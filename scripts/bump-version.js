const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'version.txt');
const frontendPackagePath = path.join(__dirname, '..', 'frontend', 'package.json');

let currentVersion = 'v1.0.0';

if (fs.existsSync(versionFilePath)) {
  const content = fs.readFileSync(versionFilePath, 'utf8').trim();
  if (content) {
    currentVersion = content;
  }
}

const match = currentVersion.match(/^v?(\d+)\.(\d+)\.(\d+)$/);

if (!match) {
  console.error(`Invalid version format in version.txt: ${currentVersion}. Expected format vX.Y.Z`);
  process.exit(1);
}

const major = parseInt(match[1], 10);
const minor = parseInt(match[2], 10);
const patch = parseInt(match[3], 10) + 1;

const newVersion = `v${major}.${minor}.${patch}`;

fs.writeFileSync(versionFilePath, `${newVersion}\n`, 'utf8');
console.log(`[Version Bump] Version updated: ${currentVersion} -> ${newVersion}`);

// Also update frontend/package.json if it exists
if (fs.existsSync(frontendPackagePath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    pkg.version = `${major}.${minor}.${patch}`;
    fs.writeFileSync(frontendPackagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to sync frontend/package.json version:', err.message);
  }
}
