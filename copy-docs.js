// Script pour copier la documentation dans dist après le build
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'documentation');
const destDir = path.join(__dirname, 'dist', 'documentation');

try {
  if (!fs.existsSync(sourceDir)) {
    console.log('⚠️  Dossier documentation non trouvé');
    process.exit(0);
  }

  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    console.log('⚠️  Dossier dist non trouvé, exécutez d\'abord: npm run build:web');
    process.exit(1);
  }

  // Créer le dossier de destination
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copier récursivement
  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(sourceDir, destDir);
  console.log('✅ Documentation copiée dans dist/documentation');
} catch (error) {
  console.error('❌ Erreur lors de la copie de la documentation:', error);
  process.exit(1);
}
