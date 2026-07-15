require 'xcodeproj'

project_path = File.expand_path('../ios/App/Pods/Pods.xcodeproj', __dir__)
manifest_root = File.expand_path('ios-privacy-manifests', __dir__)
target_manifests = {
  'GoogleSignIn' => File.join(manifest_root, 'GoogleSignIn', 'PrivacyInfo.xcprivacy'),
  'GTMAppAuth' => File.join(manifest_root, 'GTMAppAuth', 'PrivacyInfo.xcprivacy'),
  'GTMSessionFetcher' => File.join(manifest_root, 'GTMSessionFetcher', 'PrivacyInfo.xcprivacy')
}

abort("Pods project not found: #{project_path}") unless File.exist?(project_path)

target_manifests.each_value do |manifest_path|
  abort("Privacy manifest not found: #{manifest_path}") unless File.exist?(manifest_path)
end

project = Xcodeproj::Project.open(project_path)
privacy_group = project.main_group.find_subpath('SausageMenu Privacy Manifests', true)
privacy_group.set_source_tree('<group>')

target_manifests.each do |target_name, manifest_path|
  target = project.targets.find { |candidate| candidate.name == target_name }
  abort("CocoaPods target not found: #{target_name}") unless target

  target_group = privacy_group.find_subpath(target_name, true)
  target_group.set_source_tree('<group>')
  file_reference = target_group.files.find { |file| file.real_path.to_s == manifest_path }
  file_reference ||= target_group.new_file(manifest_path)

  unless target.resources_build_phase.files_references.include?(file_reference)
    target.resources_build_phase.add_file_reference(file_reference, true)
  end

  puts "Embedded PrivacyInfo.xcprivacy in #{target_name}"
end

project.save
