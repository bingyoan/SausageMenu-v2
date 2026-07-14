package com.sausagemenu.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Rect;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.nl.languageid.LanguageIdentification;
import com.google.mlkit.nl.languageid.LanguageIdentificationOptions;
import com.google.mlkit.nl.languageid.LanguageIdentifier;
import com.google.mlkit.nl.translate.TranslateLanguage;
import com.google.mlkit.nl.translate.Translation;
import com.google.mlkit.nl.translate.Translator;
import com.google.mlkit.nl.translate.TranslatorOptions;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions;
import com.google.mlkit.vision.text.japanese.JapaneseTextRecognizerOptions;
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "OfflineMenu")
public class OfflineMenuPlugin extends Plugin {
    private static final Pattern TRAILING_PRICE = Pattern.compile(
        "((?:NT\\$|HK\\$|US\\$|A\\$|C\\$|[$€£¥₩฿₫₱₹₽])?\\s*\\d[\\d.,]*(?:\\s*(?:TWD|HKD|USD|JPY|KRW|EUR|GBP|THB|VND|PHP|RUB|INR|CNY|RMB|AUD|CAD))?)\\s*$",
        Pattern.CASE_INSENSITIVE
    );

    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("engine", "ML Kit Text Recognition + On-device Translation");
        call.resolve(result);
    }

    @PluginMethod
    public void processMenu(PluginCall call) {
        JSArray images = call.getArray("images");
        String requestedTarget = call.getString("targetLanguage", "English");
        boolean allowsCellular = call.getBoolean("allowsCellularDownload", true);

        if (images == null || images.length() == 0) {
            call.reject("No menu images were provided.");
            return;
        }

        worker.execute(() -> {
            try {
                List<RecognizedLine> lines = new ArrayList<>();
                List<Object> imageValues = images.toList();
                for (int page = 0; page < imageValues.size(); page++) {
                    Bitmap bitmap = decodeImage(String.valueOf(imageValues.get(page)));
                    lines.addAll(recognizeBestScript(bitmap, page));
                }

                String fullText = joinOriginalText(lines);
                String sourceTag = identifyLanguage(fullText);
                String sourceLanguage = supportedLanguage(sourceTag);
                String targetLanguage = targetLanguage(requestedTarget);
                boolean modelDownloaded = false;

                if (!sourceLanguage.equals(targetLanguage)) {
                    TranslatorOptions options = new TranslatorOptions.Builder()
                        .setSourceLanguage(sourceLanguage)
                        .setTargetLanguage(targetLanguage)
                        .build();
                    Translator translator = Translation.getClient(options);
                    try {
                        DownloadConditions.Builder conditions = new DownloadConditions.Builder();
                        if (!allowsCellular) conditions.requireWifi();
                        try {
                            Tasks.await(translator.downloadModelIfNeeded(conditions.build()));
                        } catch (Exception downloadError) {
                            throw new IllegalStateException(
                                "This language pack is not downloaded yet. Please connect to the internet once and try again. / 尚未下載此語言包，請先連網一次後重試。",
                                downloadError
                            );
                        }
                        modelDownloaded = true;
                        for (RecognizedLine line : lines) {
                            if (!line.contentText.isEmpty()) {
                                line.translatedText = Tasks.await(translator.translate(line.contentText));
                            }
                        }
                    } finally {
                        translator.close();
                    }
                } else {
                    for (RecognizedLine line : lines) line.translatedText = line.contentText;
                }

                JSArray outputLines = new JSArray();
                for (RecognizedLine line : lines) outputLines.put(line.toJSObject());

                JSObject result = new JSObject();
                result.put("lines", outputLines);
                result.put("detectedLanguage", sourceTag);
                result.put("targetLanguage", targetLanguage);
                result.put("modelDownloaded", modelDownloaded);
                call.resolve(result);
            } catch (Exception error) {
                call.reject(error.getMessage() == null ? "Offline menu processing failed." : error.getMessage(), error);
            }
        });
    }

    private Bitmap decodeImage(String dataUrl) {
        int comma = dataUrl.indexOf(',');
        String encoded = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
        byte[] bytes = Base64.decode(encoded.getBytes(StandardCharsets.UTF_8), Base64.DEFAULT);
        Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        if (bitmap == null) throw new IllegalArgumentException("Unable to read the selected menu image.");
        return bitmap;
    }

    private List<RecognizedLine> recognizeBestScript(Bitmap bitmap, int page) throws Exception {
        InputImage image = InputImage.fromBitmap(bitmap, 0);
        List<TextRecognizer> recognizers = Arrays.asList(
            TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS),
            TextRecognition.getClient(new ChineseTextRecognizerOptions.Builder().build()),
            TextRecognition.getClient(new JapaneseTextRecognizerOptions.Builder().build()),
            TextRecognition.getClient(new KoreanTextRecognizerOptions.Builder().build()),
            TextRecognition.getClient(new DevanagariTextRecognizerOptions.Builder().build())
        );

        Text best = null;
        int bestScore = -1;
        try {
            for (TextRecognizer recognizer : recognizers) {
                Text candidate = Tasks.await(recognizer.process(image));
                int score = candidate.getText().replaceAll("\\s", "").length();
                if (score > bestScore) {
                    best = candidate;
                    bestScore = score;
                }
            }
        } finally {
            for (TextRecognizer recognizer : recognizers) recognizer.close();
        }

        List<RecognizedLine> output = new ArrayList<>();
        if (best == null) return output;
        for (Text.TextBlock block : best.getTextBlocks()) {
            for (Text.Line textLine : block.getLines()) {
                Rect box = textLine.getBoundingBox();
                if (box == null) continue;
                String original = textLine.getText().trim();
                if (original.isEmpty()) continue;
                Matcher priceMatcher = TRAILING_PRICE.matcher(original);
                String price = priceMatcher.find() ? priceMatcher.group(1).trim() : "";
                String content = priceMatcher.find(0) ? original.substring(0, priceMatcher.start()).trim() : original;
                if (content.isEmpty() && price.isEmpty()) continue;
                output.add(new RecognizedLine(
                    page,
                    original,
                    content,
                    price,
                    averageConfidence(textLine),
                    box.left / (double) bitmap.getWidth(),
                    box.top / (double) bitmap.getHeight(),
                    box.width() / (double) bitmap.getWidth(),
                    box.height() / (double) bitmap.getHeight()
                ));
            }
        }
        return output;
    }

    private double averageConfidence(Text.Line line) {
        double total = 0;
        int count = 0;
        for (Text.Element element : line.getElements()) {
            Float confidence = element.getConfidence();
            if (confidence != null) {
                total += confidence;
                count++;
            }
        }
        return count == 0 ? 0.8 : total / count;
    }

    private String joinOriginalText(List<RecognizedLine> lines) {
        StringBuilder text = new StringBuilder();
        for (RecognizedLine line : lines) text.append(line.originalText).append('\n');
        return text.toString();
    }

    private String identifyLanguage(String text) throws Exception {
        if (text.trim().isEmpty()) return "en";
        LanguageIdentifier identifier = LanguageIdentification.getClient(
            new LanguageIdentificationOptions.Builder().setConfidenceThreshold(0.25f).build()
        );
        try {
            String language = Tasks.await(identifier.identifyLanguage(text));
            return "und".equals(language) ? "en" : language;
        } finally {
            identifier.close();
        }
    }

    private String supportedLanguage(String tag) {
        String language = TranslateLanguage.fromLanguageTag(tag.toLowerCase(Locale.ROOT));
        return language == null ? TranslateLanguage.ENGLISH : language;
    }

    private String targetLanguage(String requested) {
        switch (requested) {
            case "繁體中文":
            case "繁體中文-HK": return TranslateLanguage.CHINESE;
            case "한국어": return TranslateLanguage.KOREAN;
            case "Français": return TranslateLanguage.FRENCH;
            case "Español": return TranslateLanguage.SPANISH;
            case "ไทย": return TranslateLanguage.THAI;
            case "Tagalog": return TranslateLanguage.TAGALOG;
            case "Tiếng Việt": return TranslateLanguage.VIETNAMESE;
            case "日本語": return TranslateLanguage.JAPANESE;
            case "Deutsch": return TranslateLanguage.GERMAN;
            case "Русский": return TranslateLanguage.RUSSIAN;
            case "Bahasa Indonesia": return TranslateLanguage.INDONESIAN;
            case "Polski": return TranslateLanguage.POLISH;
            case "Bahasa Melayu": return TranslateLanguage.MALAY;
            case "Italiano": return TranslateLanguage.ITALIAN;
            case "Português": return TranslateLanguage.PORTUGUESE;
            default: return TranslateLanguage.ENGLISH;
        }
    }

    @Override
    protected void handleOnDestroy() {
        worker.shutdownNow();
        super.handleOnDestroy();
    }

    private static final class RecognizedLine {
        final int page;
        final String originalText;
        final String contentText;
        final String protectedPrice;
        final double confidence;
        final double x;
        final double y;
        final double width;
        final double height;
        String translatedText = "";

        RecognizedLine(int page, String originalText, String contentText, String protectedPrice,
                       double confidence, double x, double y, double width, double height) {
            this.page = page;
            this.originalText = originalText;
            this.contentText = contentText;
            this.protectedPrice = protectedPrice;
            this.confidence = confidence;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        JSObject toJSObject() {
            JSObject value = new JSObject();
            value.put("page", page);
            value.put("originalText", originalText);
            value.put("contentText", contentText);
            value.put("translatedText", translatedText);
            value.put("protectedPrice", protectedPrice);
            value.put("confidence", confidence);
            value.put("x", x);
            value.put("y", y);
            value.put("width", width);
            value.put("height", height);
            return value;
        }
    }
}
