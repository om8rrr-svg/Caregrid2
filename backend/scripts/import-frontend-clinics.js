#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { pool } = require('../config/database');

// Read the frontend clinics data
const frontendScriptPath = path.join(__dirname, '../../js/script.js');
const scriptContent = fs.readFileSync(frontendScriptPath, 'utf8');

// Extract clinicsData array from the script
const clinicsDataMatch = scriptContent.match(/let clinicsData = (\[[\s\S]*?\]);/);
if (!clinicsDataMatch) {
    console.error('❌ Could not find clinicsData in script.js');
    process.exit(1);
}

// Parse the clinics data
let clinicsData;
try {
    clinicsData = eval(clinicsDataMatch[1]);
    console.log(`📊 Found ${clinicsData.length} clinics in frontend data`);
} catch (error) {
    console.error('❌ Error parsing clinicsData:', error);
    process.exit(1);
}

// Map frontend data to backend schema
function mapClinicData(frontendClinic) {
    // Extract city from location or address
    let city = frontendClinic.location || 'Unknown';
    
    // Extract postcode from address (basic regex)
    const postcodeMatch = frontendClinic.address?.match(/([A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})$/i);
    const postcode = postcodeMatch ? postcodeMatch[1] : 'N/A'; // Default to 'N/A' since postcode is required
    
    // Clean address (remove postcode if found)
    let cleanAddress = frontendClinic.address || '';
    if (postcode) {
        cleanAddress = cleanAddress.replace(new RegExp(postcode + '$', 'i'), '').trim().replace(/,$/, '');
    }
    
    return {
        id: randomUUID(), // Generate new UUID for backend
        frontend_id: frontendClinic.id, // Keep original ID for reference
        name: frontendClinic.name,
        type: frontendClinic.type,
        description: frontendClinic.description || `${frontendClinic.name} is a professional healthcare provider in ${city}, offering quality medical services to the local community.`,
        address: cleanAddress,
        city: city,
        postcode: postcode,
        phone: frontendClinic.phone,
        email: null, // Not available in frontend data
        website: frontendClinic.website,
        logo_url: frontendClinic.image,
        rating: frontendClinic.rating,
        review_count: frontendClinic.reviews,
        is_premium: frontendClinic.premium || false,
        is_active: true,
        owner_id: null, // Will be set later if needed
        services: frontendClinic.services || []
    };
}

async function importClinics() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting clinic import...');
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Keep existing clinics and append new ones
        console.log('📊 Keeping existing clinic data and appending new clinics');
        
        let importedCount = 0;
        let skippedCount = 0;
        
        for (const frontendClinic of clinicsData) {
            try {
                const mappedClinic = mapClinicData(frontendClinic);
                
                // Skip clinics without frontend ID (some entries in the data don't have IDs)
                if (!mappedClinic.frontend_id) {
                    console.log(`⚠️  Skipping clinic without frontend ID: ${mappedClinic.name}`);
                    skippedCount++;
                    continue;
                }
                
                // Check if clinic already exists by name and address (since we're generating new UUIDs)
                const existsResult = await client.query(
                    'SELECT id FROM clinics WHERE name = $1 AND address = $2', 
                    [mappedClinic.name, mappedClinic.address]
                );
                
                if (existsResult.rows.length > 0) {
                    console.log(`⏭️  Clinic already exists, skipping: ${mappedClinic.name}`);
                    skippedCount++;
                    continue;
                }
                
                // Insert new clinic
                const insertQuery = `
                    INSERT INTO clinics (
                        id, name, type, description, address, city, postcode,
                        phone, email, website, logo_url, rating, review_count,
                        is_premium, is_active, owner_id, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
                    )
                `;
                
                await client.query(insertQuery, [
                    mappedClinic.id,
                    mappedClinic.name,
                    mappedClinic.type,
                    mappedClinic.description,
                    mappedClinic.address,
                    mappedClinic.city,
                    mappedClinic.postcode,
                    mappedClinic.phone,
                    mappedClinic.email,
                    mappedClinic.website,
                    mappedClinic.logo_url,
                    mappedClinic.rating,
                    mappedClinic.review_count,
                    mappedClinic.is_premium,
                    mappedClinic.is_active,
                    mappedClinic.owner_id
                ]);
                
                // Insert services
                if (mappedClinic.services && mappedClinic.services.length > 0) {
                    for (const service of mappedClinic.services) {
                        await client.query(
                            'INSERT INTO clinic_services (clinic_id, service_name) VALUES ($1, $2)',
                            [mappedClinic.id, service]
                        );
                    }
                }
                
                importedCount++;
                console.log(`✅ Imported: ${mappedClinic.name} (Frontend ID: ${mappedClinic.frontend_id})`);
                
                
            } catch (error) {
                console.error(`❌ Error importing clinic ${frontendClinic.name}:`, error.message);
                skippedCount++;
            }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log('\n🎉 Import completed!');
        console.log(`✅ Successfully imported: ${importedCount} clinics`);
        console.log(`⚠️  Skipped: ${skippedCount} clinics`);
        
        // Verify the import
        const countResult = await client.query('SELECT COUNT(*) FROM clinics');
        console.log(`📊 Total clinics in database: ${countResult.rows[0].count}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Import failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the import
if (require.main === module) {
    importClinics()
        .then(() => {
            console.log('✅ Import script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Import script failed:', error);
            process.exit(1);
        });
}

module.exports = { importClinics };