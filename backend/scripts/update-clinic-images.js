#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/database");

/**
 * Script to scan for clinic images and match them to clinics in the database
 * Updates clinic records with the matched image URLs
 */

// Get all image files from root directory
function getClinicImageFiles() {
  const rootDir = path.join(__dirname, "../../");
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

  try {
    const files = fs.readdirSync(rootDir);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    console.log(`📁 Found ${imageFiles.length} image files in root directory`);
    return imageFiles;
  } catch (error) {
    console.error("❌ Error reading directory:", error);
    return [];
  }
}

// Normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace non-alphanumeric with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
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
  const words1 = new Set(normalized1.split(" "));
  const words2 = new Set(normalized2.split(" "));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// Extract clinic name from filename
function extractClinicNameFromFile(filename) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  return nameWithoutExt;
}

// Match image files to clinic names
function matchImagesToClinics(imageFiles, clinics) {
  const matches = [];
  const unmatchedImages = [];
  const threshold = 0.6; // Minimum similarity score for a match

  console.log(
    `\n🔍 Matching ${imageFiles.length} images to ${clinics.length} clinics...`,
  );

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
        score: bestScore,
      });
      console.log(
        `✅ Match: "${imageFile}" → "${bestMatch.name}" (${(bestScore * 100).toFixed(1)}%)`,
      );
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

// Update clinic records with image URLs
async function updateClinicImages(matches) {
  const client = await pool.connect();

  try {
    console.log("\n🔄 Starting database updates...");

    await client.query("BEGIN");

    let updatedCount = 0;
    let errorCount = 0;

    for (const match of matches) {
      try {
        const { clinic, imageFile, score } = match;

        // Update the clinic's logo_url with the image file path
        const updateQuery = `
                    UPDATE clinics 
                    SET logo_url = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING name, logo_url
                `;

        const result = await client.query(updateQuery, [imageFile, clinic.id]);

        if (result.rows.length > 0) {
          updatedCount++;
          console.log(`✅ Updated: ${clinic.name} → ${imageFile}`);
        } else {
          console.log(`⚠️  No update: Clinic ID ${clinic.id} not found`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${match.clinic.name}:`, error.message);
        errorCount++;
      }
    }

    await client.query("COMMIT");

    console.log(`\n🎉 Database update completed!`);
    console.log(`   • Successfully updated: ${updatedCount} clinics`);
    console.log(`   • Errors: ${errorCount}`);

    return { updatedCount, errorCount };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Database update failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Main function
async function updateClinicImagesMain() {
  try {
    console.log("🚀 CareGrid Clinic Image Updater");
    console.log("================================\n");

    // Get image files from root directory
    const imageFiles = getClinicImageFiles();
    if (imageFiles.length === 0) {
      console.log("ℹ️  No image files found in root directory");
      return;
    }

    // Get all clinics from database
    console.log("📊 Fetching clinics from database...");
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT id, name, logo_url FROM clinics ORDER BY name",
      );
      const clinics = result.rows;
      console.log(`📋 Found ${clinics.length} clinics in database`);

      if (clinics.length === 0) {
        console.log("ℹ️  No clinics found in database");
        return;
      }

      // Match images to clinics
      const { matches, unmatchedImages } = matchImagesToClinics(
        imageFiles,
        clinics,
      );

      if (matches.length === 0) {
        console.log("ℹ️  No matches found");
        return;
      }

      // Show preview of what will be updated
      console.log("\n📋 Preview of updates:");
      matches.forEach((match) => {
        const currentImage = match.clinic.logo_url || "(none)";
        console.log(`   ${match.clinic.name}:`);
        console.log(`     Current: ${currentImage}`);
        console.log(`     New: ${match.imageFile}`);
        console.log(`     Match score: ${(match.score * 100).toFixed(1)}%\n`);
      });

      // Confirm before proceeding
      console.log(
        `⚠️  About to update ${matches.length} clinic records. Continue? (This will overwrite existing logo_url values)`,
      );

      // Update the database
      const { updatedCount, errorCount } = await updateClinicImages(matches);

      // Final summary
      console.log("\n📊 Final Summary:");
      console.log(`   • Image files processed: ${imageFiles.length}`);
      console.log(`   • Clinics in database: ${clinics.length}`);
      console.log(`   • Successful matches: ${matches.length}`);
      console.log(`   • Database updates: ${updatedCount}`);
      console.log(`   • Unmatched images: ${unmatchedImages.length}`);
      console.log(`   • Errors: ${errorCount}`);

      if (unmatchedImages.length > 0) {
        console.log("\n🔍 Unmatched images (manual review needed):");
        unmatchedImages.forEach(({ imageFile, imageName }) => {
          console.log(`   • ${imageFile} (extracted: "${imageName}")`);
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateClinicImagesMain()
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { updateClinicImagesMain };
