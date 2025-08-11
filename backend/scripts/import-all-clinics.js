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
function mapClinicData(frontendClinic, index) {
    // Extract city from location or address
    let city = frontendClinic.location || 'Unknown';
    
    // Extract postcode from address (basic regex)
    const postcodeMatch = frontendClinic.address?.match(/([A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2})$/i);
    const postcode = postcodeMatch ? postcodeMatch[1] : 'N/A';
    
    // Clean address (remove postcode if found)
    let cleanAddress = frontendClinic.address || '';
    if (postcode && postcode !== 'N/A') {
        cleanAddress = cleanAddress.replace(new RegExp(postcode + '$', 'i'), '').trim().replace(/,$/, '');
    }
    
    // Generate ID if missing (for the 3 pharmacy entries)
    const frontendId = frontendClinic.id || (1000 + index); // Use index-based ID for missing ones
    
    return {
        id: randomUUID(), // Generate new UUID for backend
        frontend_id: frontendId,
        name: frontendClinic.name,
        type: frontendClinic.type,
        description: frontendClinic.description || `${frontendClinic.name} is a professional healthcare provider in ${city}, offering quality medical services to the local community.`,
        address: cleanAddress,
        city: city,
        postcode: postcode,
        phone: frontendClinic.phone || null,
        email: frontendClinic.email || null,
        website: frontendClinic.website || null,
        logo_url: frontendClinic.image || null,
        rating: frontendClinic.rating || 0,
        review_count: frontendClinic.reviews || 0,
        is_premium: frontendClinic.premium || false,
        is_active: true,
        owner_id: null,
        services: frontendClinic.services || []
    };
}

async function importAllClinics() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting complete clinic import...');
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Clear existing clinic data to start fresh
        console.log('🗑️  Clearing existing clinic data...');
        await client.query('DELETE FROM clinic_services');
        await client.query('DELETE FROM clinics');
        
        let importedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < clinicsData.length; i++) {
            const frontendClinic = clinicsData[i];
            try {
                const mappedClinic = mapClinicData(frontendClinic, i);
                
                console.log(`📝 Processing clinic ${i + 1}/${clinicsData.length}: ${mappedClinic.name}`);
                
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
                console.error(`❌ Error importing clinic ${frontendClinic.name || 'Unknown'}:`, error.message);
                errorCount++;
                // Continue with next clinic instead of stopping
            }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log('\n🎉 Import completed!');
        console.log(`✅ Successfully imported: ${importedCount} clinics`);
        console.log(`❌ Errors: ${errorCount} clinics`);
        
        // Verify the import
        const countResult = await client.query('SELECT COUNT(*) FROM clinics');
        console.log(`📊 Total clinics in database: ${countResult.rows[0].count}`);
        
        // Show some sample data
        const sampleResult = await client.query('SELECT name, type, city FROM clinics LIMIT 5');
        console.log('\n📋 Sample imported clinics:');
        sampleResult.rows.forEach(clinic => {
            console.log(`  - ${clinic.name} (${clinic.type}) in ${clinic.city}`);
        });
        
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
    importAllClinics()
        .then(() => {
            console.log('✅ Complete import script finished successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Complete import script failed:', error);
            process.exit(1);
        });
}

module.exports = { importAllClinics };