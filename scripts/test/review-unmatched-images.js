#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to review unmatched images and find potential matches with lower thresholds
 */

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

// Review unmatched images
function reviewUnmatchedImages() {
    const unmatchedImages = [
        "Optical Express Salford.jpg",
        "Vision Express Bolton.jpg", 
        "harley_st_health_centre_.jpg"
    ];
    
    const clinics = loadClinicDataFromFrontend();
    
    console.log('🔍 Reviewing unmatched images for potential matches...\n');
    
    unmatchedImages.forEach(imageFile => {
        const imageName = extractClinicNameFromFile(imageFile);
        console.log(`📷 Image: ${imageFile}`);
        console.log(`   Extracted name: "${imageName}"`);
        
        // Find top 5 matches with any similarity
        const matches = [];
        clinics.forEach(clinic => {
            const score = calculateSimilarity(imageName, clinic.name);
            if (score > 0) {
                matches.push({ clinic, score });
            }
        });
        
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        
        console.log('   Top potential matches:');
        matches.slice(0, 5).forEach((match, index) => {
            console.log(`     ${index + 1}. ${match.clinic.name} (${(match.score * 100).toFixed(1)}%)`);
        });
        console.log('');
    });
    
    // Manual suggestions
    console.log('💡 Manual review suggestions:');
    console.log('   • "Optical Express Salford.jpg" - Could match "Optical Express" clinics (similar chain)');
    console.log('   • "Vision Express Bolton.jpg" - Different chain from Optical Express, may need manual clinic entry');
    console.log('   • "harley_st_health_centre_.jpg" - Likely refers to a Harley Street clinic, check for variations');
}

reviewUnmatchedImages();