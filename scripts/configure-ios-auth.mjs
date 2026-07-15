import fs from 'node:fs';
import path from 'node:path';

const iosRoot = path.resolve('ios/App');
const infoPlistPath = path.join(iosRoot, 'App/Info.plist');
const entitlementsPath = path.join(iosRoot, 'App/App.entitlements');
const projectPath = path.join(iosRoot, 'App.xcodeproj/project.pbxproj');
const googleUrlScheme = 'com.googleusercontent.apps.708202943885-tmfdkjpeencn7nqbgqtmnlc7bjp8vajh';

for (const requiredPath of [infoPlistPath, projectPath]) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Missing generated iOS file: ${requiredPath}`);
  }
}

let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
if (!infoPlist.includes(googleUrlScheme)) {
  const urlTypes = `\n\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleTypeRole</key>\n\t\t\t<string>Editor</string>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>${googleUrlScheme}</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>`;
  const closingTag = /\n<\/dict>\s*\n<\/plist>\s*$/;
  if (!closingTag.test(infoPlist)) {
    throw new Error('Unable to locate the root Info.plist dictionary');
  }
  infoPlist = infoPlist.replace(closingTag, `${urlTypes}\n</dict>\n</plist>\n`);
  fs.writeFileSync(infoPlistPath, infoPlist);
  console.log('Added the Google Sign-In callback URL scheme');
}

const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.developer.applesignin</key>
\t<array>
\t\t<string>Default</string>
\t</array>
</dict>
</plist>
`;
fs.writeFileSync(entitlementsPath, entitlements);

let project = fs.readFileSync(projectPath, 'utf8');
if (!project.includes('CODE_SIGN_ENTITLEMENTS = App/App.entitlements;')) {
  const appIconSetting = /(ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;\r?\n)(\s*)/g;
  let replacements = 0;
  project = project.replace(appIconSetting, (match, setting, indentation) => {
    replacements += 1;
    return `${setting}${indentation}CODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n${indentation}`;
  });
  if (replacements === 0) {
    throw new Error('Unable to configure the App target entitlements');
  }
}

if (!project.includes('com.apple.SignInWithApple')) {
  const provisioningSetting = /(ProvisioningStyle = Automatic;\r?\n)(\s*)/;
  if (!provisioningSetting.test(project)) {
    throw new Error('Unable to locate the App target capabilities');
  }
  project = project.replace(
    provisioningSetting,
    (_, setting, indentation) => `${setting}${indentation}SystemCapabilities = {\n${indentation}\tcom.apple.SignInWithApple = {\n${indentation}\t\tenabled = 1;\n${indentation}\t};\n${indentation}};\n${indentation}`,
  );
}

fs.writeFileSync(projectPath, project);
console.log('Enabled Sign in with Apple and configured iOS authentication');
