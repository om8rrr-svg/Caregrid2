#!/usr/bin/env node
/**
 * Script to update all image references to use cloud configuration
 * This will replace hardcoded image paths with CloudAssets helper functions
 */

const fs = require('fs');
const path = require('path');

// Project root directory
const projectRoot = path.join(__dirname, '..');

// Recursively find files with specific extensions
function findFiles(dir, extensions, ignore = []) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relativePath = path.relative(projectRoot, fullPath);
      
      // Skip ignored directories
      if (ignore.some(pattern => relativePath.includes(pattern))) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDir(dir);
  return files;
}

// Get all files to update
function getFilesToUpdate() {
  const extensions = ['.js', '.html', '.css'];
  const ignore = ['node_modules', 'scripts', '.git', 'cloud-deployment'];
  
  return findFiles(projectRoot, extensions, ignore);
}

// Image reference patterns to replace
const imagePatterns = [
  {
    pattern: /"images\/(clinic[0-9]+\.svg)"/g,
    replacement: (match, filename) => {
      const index = filename.match(/clinic([0-9]+)\.svg/)[1];
      return `CloudAssets.getClinicPlaceholder(${index})`;
    }
  },
  {
    pattern: /"images\/logo\.svg"/g,
    replacement: 'CloudAssets.getLogo()'
  },
  {
    pattern: /"images\/default-avatar\.svg"/g,
    replacement: 'CloudAssets.getImageUrl("default-avatar.svg")'
  },
  {
    pattern: /"images\/([^"]+\.(jpg|jpeg|png|webp|avif))"/g,
    replacement: (match, filename) => `CloudAssets.getImageUrl("${filename}")`
  },
  {
    pattern: /'images\/(clinic[0-9]+\.svg)'/g,
    replacement: (match, filename) => {
      const index = filename.match(/clinic([0-9]+)\.svg/)[1];
      return `CloudAssets.getClinicPlaceholder(${index})`;
    }
  },
  {
    pattern: /'images\/logo\.svg'/g,
    replacement: 'CloudAssets.getLogo()'
  },
  {
    pattern: /'images\/([^']+\.(jpg|jpeg|png|webp|avif))'/g,
    replacement: (match, filename) => `CloudAssets.getImageUrl("${filename}")`
  },
  // HTML src attributes
  {
    pattern: /src="images\/(clinic[0-9]+\.svg)"/g,
    replacement: (match, filename) => {
      const index = filename.match(/clinic([0-9]+)\.svg/)[1];
      return `src="" data-cloud-image="clinic-placeholder-${index}"`;
    }
  },
  {
    pattern: /src="images\/logo\.svg"/g,
    replacement: 'src="" data-cloud-image="logo"'
  },
  {
    pattern: /src="images\/([^"]+)"/g,
    replacement: (match, filename) => `src="" data-cloud-image="${filename}"`
  },
  // CSS background images
  {
    pattern: /url\(['"]?images\/([^'"\)]+)['"]?\)/g,
    replacement: (match, filename) => `url(var(--cloud-image-${filename.replace(/[^a-zA-Z0-9]/g, '-')}))`
  }
];

// Function to update file content
function updateFileContent(filePath, content) {
  let updatedContent = content;
  let hasChanges = false;

  imagePatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(pattern, replacement);
      hasChanges = true;
    }
  });

  return { content: updatedContent, hasChanges };
}

// Function to add cloud config import to JS files
function addCloudConfigImport(content, filePath) {
  if (filePath.endsWith('.js') && !content.includes('cloud-config.js')) {
    // Check if file uses CloudAssets
    if (content.includes('CloudAssets.')) {
      const importStatement = "import { CloudAssets } from './cloud-config.js';\n";
      
      // Add import at the top, after existing imports
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('const ') && lines[i].includes('require(')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*')) {
          break;
        }
      }
      
      lines.splice(insertIndex, 0, importStatement);
      return lines.join('\n');
    }
  }
  return content;
}

// Main execution
async function main() {
  console.log('🚀 Starting image reference update...');
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  const files = getFilesToUpdate();
  
  for (const filePath of files) {
    const file = path.relative(projectRoot, filePath);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { content: updatedContent, hasChanges } = updateFileContent(filePath, content);
        
        if (hasChanges) {
          // Add cloud config import for JS files
          const finalContent = addCloudConfigImport(updatedContent, filePath);
          
          fs.writeFileSync(filePath, finalContent, 'utf8');
          console.log(`✅ Updated: ${file}`);
          updatedFiles++;
        }
        
      totalFiles++;
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files updated: ${updatedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - updatedFiles}`);
  
  if (updatedFiles > 0) {
    console.log('\n🎉 Image references updated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the application locally');
    console.log('   2. Set up CDN for production images');
    console.log('   3. Update CLOUD_CONFIG.CDN_BASE_URL in cloud-config.js');
  } else {
    console.log('\n✨ No files needed updating.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateFileContent, addCloudConfigImport };