const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const JavaScriptObfuscator = require('javascript-obfuscator');

const rootDir = path.resolve(__dirname, '..');
const tempOut = path.join(os.tmpdir(), 'prosoft-release');
console.log(`[Build] Temporary build staging directory: ${tempOut}`);

// Parse optional customer-tailored offline flags:
// e.g. node scripts/build-dist.cjs --customer="National Institute of Technology" --email="hod@nit.edu" --modules="ace101,sim-ace401"
let targetCustomer = '';
let targetEmail = '';
let targetModules = null;

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--customer=')) targetCustomer = arg.split('=')[1].replace(/^["']|["']$/g, '');
  if (arg.startsWith('--email=')) targetEmail = arg.split('=')[1].replace(/^["']|["']$/g, '');
  if (arg.startsWith('--modules=')) {
    targetModules = arg.split('=')[1].replace(/^["']|["']$/g, '').split(',').map((m) => m.trim().toLowerCase());
  }
}

if (targetModules) {
  console.log(`\n>>> [OFFLINE TAILORED BUILD DETECTED] <<<`);
  console.log(`Target Customer: ${targetCustomer || 'Offline Customer'}`);
  console.log(`Licensed Modules (${targetModules.length}): ${targetModules.join(', ')}\n`);
}

// Obfuscation configuration for anti-reverse-engineering & anti-cracking
const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.25,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayThreshold: 0.8,
  transformObjectKeys: true,
  renameGlobals: false,
};

// Files to temporarily backup and obfuscate for the build
const backendFilesToProtect = [
  path.join(rootDir, 'electron/main.cjs'),
  path.join(rootDir, 'electron/apiServer.cjs'),
  path.join(rootDir, 'src/services/modbus/modbusServerBridge.cjs'),
  path.join(rootDir, 'src/services/modbus/remoteLabManager.cjs'),
  path.join(rootDir, 'src/services/tcp/ace2007TcpBridge.cjs'),
];

const psScriptToProtect = path.join(rootDir, 'src/services/modbus/modbus_daemon.ps1');

const backups = new Map();

function backupAndProtect() {
  console.log('\n[Security 1/2] Backing up and obfuscating backend and daemon code...');

  // Backup and obfuscate backend .cjs files
  for (const filePath of backendFilesToProtect) {
    if (fs.existsSync(filePath)) {
      const originalCode = fs.readFileSync(filePath, 'utf8');
      backups.set(filePath, originalCode);
      console.log(`  -> Obfuscating: ${path.relative(rootDir, filePath)}`);
      const obfuscated = JavaScriptObfuscator.obfuscate(originalCode, obfuscatorOptions).getObfuscatedCode();
      fs.writeFileSync(filePath, obfuscated, 'utf8');
    }
  }

  // Backup and encode PowerShell daemon
  if (fs.existsSync(psScriptToProtect)) {
    const originalPs = fs.readFileSync(psScriptToProtect, 'utf8');
    backups.set(psScriptToProtect, originalPs);
    console.log(`  -> Encrypting PowerShell daemon: ${path.relative(rootDir, psScriptToProtect)}`);
    const gzBuffer = zlib.gzipSync(Buffer.from(originalPs, 'utf8'));
    const b64 = gzBuffer.toString('base64');
    const protectedRunner = `# ACE Industrial Process Daemon - Protected Binary Stream
$enc = "${b64}"
$bytes = [System.Convert]::FromBase64String($enc)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$gz = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Decompress)
$sr = New-Object System.IO.StreamReader($gz, [System.Text.Encoding]::UTF8)
$dec = $sr.ReadToEnd()
Invoke-Expression $dec
`;
    fs.writeFileSync(psScriptToProtect, protectedRunner, 'utf8');
  }
}

function restoreOriginals() {
  if (backups.size === 0) return;
  console.log('\n[Security 2/2] Restoring original source files in repository...');
  for (const [filePath, originalContent] of backups.entries()) {
    try {
      fs.writeFileSync(filePath, originalContent, 'utf8');
      console.log(`  -> Restored: ${path.relative(rootDir, filePath)}`);
    } catch (err) {
      console.error(`Failed to restore ${filePath}:`, err);
    }
  }
  backups.clear();
}

process.on('SIGINT', () => {
  restoreOriginals();
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  restoreOriginals();
  console.error(err);
  process.exit(1);
});

try {
  // 1. Build Vite & TypeScript
  console.log('\n[Build 1/4] Compiling React frontend with Vite & TypeScript...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

  // Bake entitlement file into dist/ (unrestricted master by default, or tailored if flags passed)
  const masterProfile = {
    collegeName: targetCustomer || 'ACE Prosoft V2 — Master Edition',
    department: targetCustomer ? 'Customer Installation' : 'All Modules Unlocked',
    email: targetEmail || 'master@ace-instruments.com',
    allowedModules: targetModules || ['*'],
    isUnrestricted: !targetModules,
    issuedAt: new Date().toISOString(),
  };
  const distTarget = path.join(rootDir, 'dist/installed_modules.json');
  fs.writeFileSync(distTarget, JSON.stringify(masterProfile, null, 2), 'utf8');
  console.log(`\n  -> [Package License] Baked profile into dist/installed_modules.json (Unrestricted: ${!targetModules})\n`);

  // 2. Obfuscate frontend assets
  console.log('\n[Build 2/4] Obfuscating React frontend bundle...');
  const assetsDir = path.join(rootDir, 'dist/assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const fullPath = path.join(assetsDir, file);
        console.log(`  -> Obfuscating frontend asset: dist/assets/${file}`);
        const code = fs.readFileSync(fullPath, 'utf8');
        const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions).getObfuscatedCode();
        fs.writeFileSync(fullPath, obfuscated, 'utf8');
      }
    }
  }

  // 3. Obfuscate backend and PowerShell daemon
  backupAndProtect();

  // 4. Run electron-builder
  console.log('\n[Build 3/4] Bundling standalone Windows installer with electron-builder...');
  execSync('npx electron-builder --win --x64', { stdio: 'inherit', cwd: rootDir });

} finally {
  // Always restore originals even if build fails or is interrupted
  restoreOriginals();
}

// 5. Copy final installer to dist-installer/
console.log('\n[Build 4/4] Finalizing output files...');
const targetDir = path.resolve(rootDir, 'dist-installer');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(tempOut)) {
  const files = fs.readdirSync(tempOut);
  for (const file of files) {
    if (file.endsWith('.exe')) {
      const src = path.join(tempOut, file);
      let outName = file;
      if (targetCustomer) {
        const cleanName = targetCustomer.replace(/[^a-zA-Z0-9]/g, '_');
        outName = `ACE_Prosoft_Setup_${cleanName}.exe`;
      }
      const dst = path.join(targetDir, outName);
      console.log(`[Build] Output created: dist-installer/${outName}`);
      fs.copyFileSync(src, dst);
    }
  }
}
console.log('\n[Build Complete] Protected & Obfuscated Installer is ready in dist-installer/ folder!\n');
