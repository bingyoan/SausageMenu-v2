const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname);
const destDir = path.join(__dirname, '..', 'SausageMenu-main0222舊專案', 'SausageMenu-main');

const filesToCopy = [
    'components/ApiKeyGate.tsx',
    'components/Paywall.tsx',
    'components/Onboarding.tsx',
    'types.ts',
    'constants.ts',
    'i18n.ts'
];

filesToCopy.forEach(file => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);

    if (fs.existsSync(srcFile) && fs.existsSync(path.dirname(destFile))) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied ${file} to old project.`);
    } else {
        console.error(`Error copying ${file}`);
    }
});
