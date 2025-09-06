#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to scan for clinic images and match them to clinics
 * Works with frontend clinic data and generates updates for database
 */

// Get all image files from root directory
function getClinicImageFiles() {
    const rootDir = __dirname;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    
    try {
        const files = fs.readdirSync(rootDir);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        });
        
        console.log(`📁 Found ${imageFiles.length} image files in root directory`);
        return imageFiles;
    } catch (error) {
        console.error('❌ Error reading directory:', error);
        return [];
    }
}

// Load clinic data from frontend script
function loadClinicDataFromFrontend() {
    try {
        const scriptPath = path.join(__dirname, 'js/script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Extract clinicsData array from the script
        const clinicsDataMatch = scriptContent.match(/let clinicsData = (\[[\s\S]*?\]);/);
        if (!clinicsDataMatch) {
            console.error('❌ Could not find clinicsData in script.js');
            return [];
        }
        
        // Parse the clinics data
        const clinicsData = eval(clinicsDataMatch[1]);
        console.log(`📊 Found ${clinicsData.length} clinics in frontend data`);
        return clinicsData;
    } catch (error) {
        console.error('❌ Error loading frontend clinic data:', error);
        return [];
    }
}

// Normalize text for comparison
function normalizeText(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Replace non-alphanumeric with spaces
        .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
        .trim();
}

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);
    
    // Exact match
    if (normalized1 === normalized2) return 1.0;
    
    // Check if one contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.9;
    }
    
    // Calculate Jaccard similarity using word sets
    const words1 = new Set(normalized1.split(' '));
    const words2 = new Set(normalized2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
}

// Extract clinic name from filename
function extractClinicNameFromFile(filename) {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return nameWithoutExt;
}

// Match image files to clinic names
function matchImagesToClinics(imageFiles, clinics) {
    const matches = [];
    const unmatchedImages = [];
    const threshold = 0.6; // Minimum similarity score for a match
    
    console.log(`\n🔍 Matching ${imageFiles.length} images to ${clinics.length} clinics...`);
    
    for (const imageFile of imageFiles) {
        const imageName = extractClinicNameFromFile(imageFile);
        let bestMatch = null;
        let bestScore = 0;
        
        for (const clinic of clinics) {
            const score = calculateSimilarity(imageName, clinic.name);
            if (score > bestScore && score >= threshold) {
                bestScore = score;
                bestMatch = clinic;
            }
        }
        
        if (bestMatch) {
            matches.push({
                imageFile,
                imageName,
                clinic: bestMatch,
                score: bestScore
            });
            console.log(`✅ Match: "${imageFile}" → "${bestMatch.name}" (${(bestScore * 100).toFixed(1)}%)`);
        } else {
            unmatchedImages.push({ imageFile, imageName });
            console.log(`⚠️  No match: "${imageFile}" (extracted: "${imageName}")`);
        }
    }
    
    console.log(`\n📊 Matching results:`);
    console.log(`   • Matched: ${matches.length} images`);
    console.log(`   • Unmatched: ${unmatchedImages.length} images`);
    
    return { matches, unmatchedImages };
}

// Update frontend clinic data with matched images
function updateFrontendClinicData(matches, clinics) {
    console.log('\n🔄 Updating frontend clinic data...');
    
    let updatedCount = 0;
    
    // Create a map of clinic IDs to image files for quick lookup
    const imageMap = new Map();
    matches.forEach(match => {
        imageMap.set(match.clinic.id, match.imageFile);
    });
    
    // Update clinic data
    clinics.forEach(clinic => {
        if (imageMap.has(clinic.id)) {
            const oldImage = clinic.image;
            clinic.image = imageMap.get(clinic.id);
            console.log(`✅ Updated clinic ${clinic.id} (${clinic.name}):`);
            console.log(`   Old: ${oldImage}`);
            console.log(`   New: ${clinic.image}`);
            updatedCount++;
        }
    });
    
    console.log(`\n📊 Updated ${updatedCount} clinic records`);
    return updatedCount;
}

// Generate SQL update statements for database
function generateSQLUpdates(matches) {
    console.log('\n📝 Generating SQL update statements...');
    
    const sqlStatements = [];
    
    matches.forEach(match => {
        const { clinic, imageFile } = match;
        const sql = `UPDATE clinics SET logo_url = '${imageFile}', updated_at = CURRENT_TIMESTAMP WHERE name = '${clinic.name.replace(/'/g, "''")}';`;
        sqlStatements.push(sql);
    });
    
    // Write to file
    const sqlFile = path.join(__dirname, 'update_clinic_images.sql');
    const sqlContent = `-- Generated SQL statements to update clinic images
-- Run these statements on your database

${sqlStatements.join('\n')}

-- Summary: ${sqlStatements.length} UPDATE statements generated
`;
    
    fs.writeFileSync(sqlFile, sqlContent);
    console.log(`💾 SQL statements saved to: ${sqlFile}`);
    
    return sqlStatements;
}

// Save updated clinic data back to script.js
function saveUpdatedClinicData(clinics) {
    try {
        const scriptPath = path.join(__dirname, 'js/script.js');
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Create backup
        const backupPath = path.join(__dirname, 'js/script.js.backup');
        fs.writeFileSync(backupPath, scriptContent);
        console.log(`💾 Created backup: ${backupPath}`);
        
        // Replace clinicsData in the script
        const updatedScript = scriptContent.replace(
            /let clinicsData = \[[\s\S]*?\];/,
            `let clinicsData = ${JSON.stringify(clinics, null, 4)};`
        );
        
        fs.writeFileSync(scriptPath, updatedScript);
        console.log(`✅ Updated frontend script: ${scriptPath}`);
        
    } catch (error) {
        console.error('❌ Error saving updated clinic data:', error);
    }
}

// Main function
async function main() {
    try {
        console.log('🚀 CareGrid Clinic Image Matcher');
        console.log('================================\n');
        
        // Get image files from root directory
        const imageFiles = getClinicImageFiles();
        if (imageFiles.length === 0) {
            console.log('ℹ️  No image files found in root directory');
            return;
        }
        
        // Load clinic data from frontend
        const clinics = loadClinicDataFromFrontend();
        if (clinics.length === 0) {
            console.log('ℹ️  No clinic data found');
            return;
        }
        
        // Match images to clinics
        const { matches, unmatchedImages } = matchImagesToClinics(imageFiles, clinics);
        
        if (matches.length === 0) {
            console.log('ℹ️  No matches found');
            return;
        }
        
        // Show preview of what will be updated
        console.log('\n📋 Preview of updates:');
        matches.forEach(match => {
            const currentImage = match.clinic.image || '(none)';
            console.log(`   ${match.clinic.name}:`);
            console.log(`     Current: ${currentImage}`);
            console.log(`     New: ${match.imageFile}`);
            console.log(`     Match score: ${(match.score * 100).toFixed(1)}%\n`);
        });
        
        // Update frontend data
        const updatedCount = updateFrontendClinicData(matches, clinics);
        
        // Generate SQL for database updates
        const sqlStatements = generateSQLUpdates(matches);
        
        // Save updated frontend data
        saveUpdatedClinicData(clinics);
        
        // Final summary
        console.log('\n📊 Final Summary:');
        console.log(`   • Image files processed: ${imageFiles.length}`);
        console.log(`   • Clinics in frontend data: ${clinics.length}`);
        console.log(`   • Successful matches: ${matches.length}`);
        console.log(`   • Frontend updates: ${updatedCount}`);
        console.log(`   • SQL statements generated: ${sqlStatements.length}`);
        console.log(`   • Unmatched images: ${unmatchedImages.length}`);
        
        if (unmatchedImages.length > 0) {
            console.log('\n🔍 Unmatched images (manual review needed):');
            unmatchedImages.forEach(({ imageFile, imageName }) => {
                console.log(`   • ${imageFile} (extracted: "${imageName}")`);
            });
        }
        
        console.log('\n✅ Script completed successfully');
        console.log('📝 Next steps:');
        console.log('   1. Review the updated js/script.js file');
        console.log('   2. Run the generated SQL statements on your database');
        console.log('   3. Check unmatched images for manual assignment');
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main };