const fs = require('fs');
const path = require('path');

// Mock CloudAssets to avoid errors
const CloudAssets = {
    getImageUrl: (filename) => `https://example.com/images/${filename}`,
    getClinicPlaceholder: (index) => `https://example.com/placeholder-${index}.svg`
};

// Read the script.js file
const scriptPath = path.join(__dirname, '../js/script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Extract clinicsData array
const clinicsDataMatch = scriptContent.match(/let clinicsData = (\[[\s\S]*?\]);/);
if (!clinicsDataMatch) {
    console.error('❌ Could not find clinicsData in script.js');
    process.exit(1);
}

// Parse the clinics data with CloudAssets mock
let clinicsData;
try {
    clinicsData = eval(clinicsDataMatch[1]);
    console.log(`📊 Found ${clinicsData.length} clinics in script.js`);
} catch (error) {
    console.error('❌ Error parsing clinicsData:', error);
    process.exit(1);
}

// Save to JSON file
const outputPath = path.join(__dirname, '../output/clinics_extracted.json');
fs.writeFileSync(outputPath, JSON.stringify(clinicsData, null, 2));
console.log(`✅ Extracted ${clinicsData.length} clinics to ${outputPath}`);