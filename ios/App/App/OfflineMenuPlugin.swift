import Foundation
import UIKit
import Vision
import ImageIO
import NaturalLanguage
import Capacitor
import MLKitTranslate

private struct RecognizedMenuLine {
    let page: Int
    let originalText: String
    let contentText: String
    let protectedPrice: String?
    let confidence: Float
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

@objc(OfflineMenuPlugin)
public class OfflineMenuPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OfflineMenuPlugin"
    public let jsName = "OfflineMenu"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processMenu", returnType: CAPPluginReturnPromise)
    ]

    private let priceRegex = try! NSRegularExpression(
        pattern: #"(?i)(?:\s|^)((?:NT\$|HK\$|US\$|A\$|C\$|[$€£¥₩฿₫₱₹₽])?\s*\d[\d.,]*(?:\s*(?:TWD|HKD|USD|JPY|KRW|EUR|GBP|THB|VND|PHP|RUB|INR|CNY|RMB|AUD|CAD|円|元|원))?)\s*$"#
    )

    @objc public func getStatus(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "engine": "Apple Vision OCR + ML Kit on-device translation",
            "minimumIOS": "15.5"
        ])
    }

    @objc public func processMenu(_ call: CAPPluginCall) {
        guard let images = call.getArray("images", String.self), !images.isEmpty else {
            call.reject("At least one menu image is required.")
            return
        }
        guard let targetTag = languageTag(for: call.getString("targetLanguage") ?? "繁體中文"),
              let targetLanguage = translateLanguage(for: targetTag) else {
            call.reject("The selected target language is not supported offline.")
            return
        }

        let allowsCellular = call.getBool("allowsCellularDownload") ?? false

        Task {
            do {
                var lines: [RecognizedMenuLine] = []
                for (page, image) in images.enumerated() {
                    lines.append(contentsOf: try recognizeText(in: image, page: page))
                }

                guard !lines.isEmpty else {
                    throw NSError(
                        domain: "OfflineMenu",
                        code: 1001,
                        userInfo: [NSLocalizedDescriptionKey: "No text was recognized in this image."]
                    )
                }

                let combinedText = lines.map(\.contentText).joined(separator: "\n")
                let sourceTag = detectLanguage(in: combinedText)
                guard let sourceLanguage = translateLanguage(for: sourceTag) else {
                    throw NSError(
                        domain: "OfflineMenu",
                        code: 1002,
                        userInfo: [NSLocalizedDescriptionKey: "The menu language is not supported by the offline model."]
                    )
                }

                let translatedLines: [[String: Any]]
                var downloadedModel = false
                if sourceLanguage == targetLanguage {
                    translatedLines = lines.map { dictionary(for: $0, translatedText: $0.contentText) }
                } else {
                    let options = TranslatorOptions(sourceLanguage: sourceLanguage, targetLanguage: targetLanguage)
                    let translator = Translator.translator(options: options)
                    do {
                        try await downloadModelIfNeeded(translator, allowsCellular: allowsCellular)
                    } catch {
                        throw NSError(
                            domain: "OfflineMenu",
                            code: 1004,
                            userInfo: [
                                NSLocalizedDescriptionKey: "This language pack is not downloaded yet. Please connect to the internet once and try again. / 尚未下載此語言包，請先連網一次後重試。"
                            ]
                        )
                    }
                    downloadedModel = true

                    var output: [[String: Any]] = []
                    output.reserveCapacity(lines.count)
                    for line in lines {
                        let translated: String
                        if line.contentText.isEmpty {
                            translated = ""
                        } else {
                            translated = try await translate(line.contentText, using: translator)
                        }
                        output.append(dictionary(for: line, translatedText: translated))
                    }
                    translatedLines = output
                }

                call.resolve([
                    "lines": translatedLines,
                    "detectedLanguage": sourceTag,
                    "targetLanguage": targetTag,
                    "modelDownloaded": downloadedModel
                ])
            } catch {
                call.reject(error.localizedDescription, nil, error)
            }
        }
    }

    private func recognizeText(in base64Image: String, page: Int) throws -> [RecognizedMenuLine] {
        let payload = base64Image.components(separatedBy: ",").last ?? base64Image
        guard let data = Data(base64Encoded: payload, options: .ignoreUnknownCharacters),
              let image = UIImage(data: data),
              let cgImage = image.cgImage else {
            throw NSError(
                domain: "OfflineMenu",
                code: 1003,
                userInfo: [NSLocalizedDescriptionKey: "The selected image could not be decoded."]
            )
        }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        request.minimumTextHeight = 0.008
        if #available(iOS 16.0, *) {
            request.automaticallyDetectsLanguage = true
        }

        let handler = VNImageRequestHandler(
            cgImage: cgImage,
            orientation: visionOrientation(for: image.imageOrientation),
            options: [:]
        )
        try handler.perform([request])
        let observations = request.results ?? []

        return observations.compactMap { observation in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            let original = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !original.isEmpty else { return nil }
            let protected = splitProtectedPrice(from: original)
            let box = observation.boundingBox
            return RecognizedMenuLine(
                page: page,
                originalText: original,
                contentText: protected.content,
                protectedPrice: protected.price,
                confidence: candidate.confidence,
                x: box.minX,
                y: 1 - box.maxY,
                width: box.width,
                height: box.height
            )
        }
    }

    private func visionOrientation(for orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
        switch orientation {
        case .up: return .up
        case .upMirrored: return .upMirrored
        case .down: return .down
        case .downMirrored: return .downMirrored
        case .left: return .left
        case .leftMirrored: return .leftMirrored
        case .right: return .right
        case .rightMirrored: return .rightMirrored
        @unknown default: return .up
        }
    }

    private func splitProtectedPrice(from text: String) -> (content: String, price: String?) {
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        guard let match = priceRegex.firstMatch(in: text, range: range),
              match.numberOfRanges > 1,
              let priceRange = Range(match.range(at: 1), in: text) else {
            return (text, nil)
        }

        let price = String(text[priceRange]).trimmingCharacters(in: .whitespacesAndNewlines)
        let contentEnd = Range(match.range(at: 0), in: text)?.lowerBound ?? text.endIndex
        let content = String(text[..<contentEnd]).trimmingCharacters(in: .whitespacesAndNewlines)
        return (content, price.isEmpty ? nil : price)
    }

    private func detectLanguage(in text: String) -> String {
        let recognizer = NLLanguageRecognizer()
        recognizer.processString(text)
        let detected = recognizer.dominantLanguage?.rawValue ?? "en"
        if translateLanguage(for: detected) != nil { return detected }
        let base = detected.split(separator: "-").first.map(String.init) ?? detected
        return translateLanguage(for: base) != nil ? base : "en"
    }

    private func translateLanguage(for languageTag: String) -> TranslateLanguage? {
        let normalized = languageTag
            .lowercased()
            .replacingOccurrences(of: "_", with: "-")
        let base = normalized.split(separator: "-").first.map(String.init) ?? normalized

        switch base {
        case "af": return .afrikaans
        case "sq": return .albanian
        case "ar": return .arabic
        case "be": return .belarusian
        case "bn": return .bengali
        case "bg": return .bulgarian
        case "ca": return .catalan
        case "zh": return .chinese
        case "hr": return .croatian
        case "cs": return .czech
        case "da": return .danish
        case "nl": return .dutch
        case "en": return .english
        case "eo": return .eperanto
        case "et": return .estonian
        case "fi": return .finnish
        case "fr": return .french
        case "gl": return .galician
        case "ka": return .georgian
        case "de": return .german
        case "el": return .greek
        case "gu": return .gujarati
        case "ht": return .haitianCreole
        case "he", "iw": return .hebrew
        case "hi": return .hindi
        case "hu": return .hungarian
        case "is": return .icelandic
        case "id": return .indonesian
        case "ga": return .irish
        case "it": return .italian
        case "ja": return .japanese
        case "kn": return .kannada
        case "ko": return .korean
        case "lv": return .latvian
        case "lt": return .lithuanian
        case "mk": return .macedonian
        case "ms": return .malay
        case "mt": return .maltese
        case "mr": return .marathi
        case "no": return .norwegian
        case "fa": return .persian
        case "pl": return .polish
        case "pt": return .portuguese
        case "ro": return .romanian
        case "ru": return .russian
        case "sk": return .slovak
        case "sl": return .slovenian
        case "es": return .spanish
        case "sw": return .swahili
        case "sv": return .swedish
        case "tl", "fil": return .tagalog
        case "ta": return .tamil
        case "te": return .telugu
        case "th": return .thai
        case "tr": return .turkish
        case "uk": return .ukrainian
        case "ur": return .urdu
        case "vi": return .vietnamese
        case "cy": return .welsh
        default: return nil
        }
    }

    private func languageTag(for displayName: String) -> String? {
        switch displayName {
        case "繁體中文", "繁體中文-HK": return "zh"
        case "English": return "en"
        case "한국어": return "ko"
        case "Français": return "fr"
        case "Español": return "es"
        case "ไทย": return "th"
        case "Tagalog": return "tl"
        case "Tiếng Việt": return "vi"
        case "日本語": return "ja"
        case "Deutsch": return "de"
        case "Русский": return "ru"
        case "Bahasa Indonesia": return "id"
        case "Polski": return "pl"
        case "Bahasa Melayu": return "ms"
        case "Italiano": return "it"
        case "Português": return "pt"
        default: return nil
        }
    }

    private func downloadModelIfNeeded(_ translator: Translator, allowsCellular: Bool) async throws {
        let conditions = ModelDownloadConditions(
            allowsCellularAccess: allowsCellular,
            allowsBackgroundDownloading: true
        )
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            translator.downloadModelIfNeeded(with: conditions) { error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: ())
                }
            }
        }
    }

    private func translate(_ text: String, using translator: Translator) async throws -> String {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<String, Error>) in
            translator.translate(text) { translatedText, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else if let translatedText = translatedText {
                    continuation.resume(returning: translatedText)
                } else {
                    continuation.resume(returning: text)
                }
            }
        }
    }

    private func dictionary(for line: RecognizedMenuLine, translatedText: String) -> [String: Any] {
        var value: [String: Any] = [
            "page": line.page,
            "originalText": line.originalText,
            "contentText": line.contentText,
            "translatedText": translatedText,
            "confidence": Double(line.confidence),
            "x": line.x,
            "y": line.y,
            "width": line.width,
            "height": line.height
        ]
        if let price = line.protectedPrice {
            value["protectedPrice"] = price
        }
        return value
    }
}
