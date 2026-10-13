const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tempOut = path.join(os.tmpdir(), 'prosoft-release');
console.log(`[Build] Temporary build staging directory: ${tempOut}`);

// 1. Build Vite & TypeScript
console.log('\n[Build 1/3] Compiling React frontend with Vite & TypeScript...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Run electron-builder
console.log('\n[Build 2/3] Bundling standalone Windows installer with electron-builder...');
execSync('npx electron-builder --win --x64', { stdio: 'inherit' });

// 3. Copy final installer to dist-installer/
console.log('\n[Build 3/3] Finalizing output files...');
const targetDir = path.resolve(__dirname, '../dist-installer');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(tempOut)) {
  const files = fs.readdirSync(tempOut);
  for (const file of files) {
    if (file.endsWith('.exe')) {
      const src = path.join(tempOut, file);
      const dst = path.join(targetDir, file);
      console.log(`[Build] Output created: dist-installer/${file}`);
      fs.copyFileSync(src, dst);
    }
  }
}
console.log('\n[Build Complete] Installer is ready in dist-installer/ folder!\n');
