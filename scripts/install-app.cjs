#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { spawn } = require('child_process');

console.log('====================================================');
console.log('  Advanced Control Equipments — ACE Prosoft V2.0    ');
console.log('====================================================');
console.log('Starting interactive product activation wizard...\n');

// On Windows, launch the interactive GUI popup dialog
if (process.platform === 'win32') {
  const psScript = path.resolve(__dirname, 'install.ps1');
  if (fs.existsSync(psScript)) {
    const { spawnSync } = require('child_process');
    const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript], {
      stdio: 'inherit',
    });
    process.exit(result.status || 0);
  }
}

const releaseUrl = 'https://github.com/meenasundaratgmaildotcom/Prosoft_V2/releases/download/v2.0.0/ACE.Prosoft.V2.Setup.2.0.0.exe';
const localFallback = path.resolve(__dirname, '../dist-installer/ACE Prosoft V2 Setup 2.0.0.exe');
const tempTarget = path.join(os.tmpdir(), 'ACE_Prosoft_V2_Setup.exe');

function runInstaller(exePath) {
  console.log(`\nLaunching installer: ${exePath}`);
  console.log('Follow the setup wizard on your screen to complete installation.\n');
  const child = spawn(exePath, [], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  process.exit(0);
}

// 1. If local installer exists (e.g. within cloned repo), run immediately
if (fs.existsSync(localFallback)) {
  console.log('Found local pre-packaged installer.');
  runInstaller(localFallback);
} else {
  // 2. Download from GitHub Release
  console.log(`Downloading official release from GitHub:`);
  console.log(releaseUrl);

  const file = fs.createWriteStream(tempTarget);
  
  function download(url) {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect (GitHub Release assets redirect to AWS S3)
        return download(res.headers.location);
      }
      if (res.statusCode !== 200) {
        console.error(`Download failed with HTTP status ${res.statusCode}.`);
        console.error('If the repository is private, ensure your machine has access permissions.');
        process.exit(1);
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total > 0) {
          const pct = Math.round((downloaded / total) * 100);
          process.stdout.write(`\rProgress: ${pct}% (${Math.round(downloaded / 1024 / 1024)} MB / ${Math.round(total / 1024 / 1024)} MB)`);
        } else {
          process.stdout.write(`\rDownloaded: ${Math.round(downloaded / 1024 / 1024)} MB`);
        }
      });

      res.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          console.log('\nDownload complete!');
          runInstaller(tempTarget);
        });
      });
    }).on('error', (err) => {
      fs.unlink(tempTarget, () => {});
      console.error('Network error during download:', err.message);
      process.exit(1);
    });
  }

  download(releaseUrl);
}
