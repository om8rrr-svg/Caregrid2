#!/usr/bin/env node

// Script to check clinic data in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

// Initialize Supabase client with service key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration!');
    console.error('Please check your .env.local file for:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseData() {
    console.log('🔍 Checking Supabase clinic data...');
    console.log('=' .repeat(50));
    
    try {
        // Get total count of clinics
        const { count: totalCount, error: countError } = await supabase
            .from('clinics')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error('❌ Error getting total count:', countError.message);
            return;
        }
        
        console.log(`📊 Total clinics in database: ${totalCount}`);
        
        // Get verified clinics count
        const { count: verifiedCount, error: verifiedError } = await supabase
            .from('clinics')
            .select('*', { count: 'exact', head: true })
            .eq('verified', true);
            
        if (verifiedError) {
            console.error('❌ Error getting verified count:', verifiedError.message);
        } else {
            console.log(`✅ Verified clinics: ${verifiedCount}`);
            console.log(`⏳ Unverified clinics: ${totalCount - verifiedCount}`);
        }
        
        // Get clinic types breakdown
        const { data: typeData, error: typeError } = await supabase
            .from('clinics')
            .select('type')
            .not('type', 'is', null);
            
        if (typeError) {
            console.error('❌ Error getting clinic types:', typeError.message);
        } else {
            const typeCounts = {};
            typeData.forEach(clinic => {
                typeCounts[clinic.type] = (typeCounts[clinic.type] || 0) + 1;
            });
            
            console.log('\n📋 Clinic types breakdown:');
            Object.entries(typeCounts)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    console.log(`  ${type}: ${count}`);
                });
        }
        
        // Get location breakdown
        const { data: locationData, error: locationError } = await supabase
            .from('clinics')
            .select('location')
            .not('location', 'is', null);
            
        if (locationError) {
            console.error('❌ Error getting locations:', locationError.message);
        } else {
            const cityCounts = {};
            locationData.forEach(clinic => {
                const city = clinic.location?.city || 'Unknown';
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            });
            
            console.log('\n🏙️  Top cities (showing top 10):');
            Object.entries(cityCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .forEach(([city, count]) => {
                    console.log(`  ${city}: ${count}`);
                });
        }
        
        // Get sample clinic data
        const { data: sampleData, error: sampleError } = await supabase
            .from('clinics')
            .select('id, name, type, location, rating, verified, created_at')
            .limit(5);
            
        if (sampleError) {
            console.error('❌ Error getting sample data:', sampleError.message);
        } else {
            console.log('\n📋 Sample clinic records:');
            sampleData.forEach((clinic, index) => {
                console.log(`\n${index + 1}. ${clinic.name}`);
                console.log(`   Type: ${clinic.type}`);
                console.log(`   Location: ${clinic.location?.city || 'N/A'}, ${clinic.location?.country || 'N/A'}`);
                console.log(`   Rating: ${clinic.rating || 'N/A'}`);
                console.log(`   Verified: ${clinic.verified ? '✅' : '❌'}`);
                console.log(`   Created: ${new Date(clinic.created_at).toLocaleDateString()}`);
            });
        }
        
        console.log('\n' + '=' .repeat(50));
        console.log('✅ Data check completed successfully!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

// Run the check
checkSupabaseData();