import { CloudAssets } from './cloud-config.js';

// Clinic data for CareGrid Healthcare Directory
// This file contains clinic data that can be loaded independently
// It provides fallback data when the API is not available

if (typeof window !== 'undefined' && !window.clinicsData) {
    window.clinicsData = [
        {
            "id": 1,
            "name": "Pall Mall Medical Manchester",
            "type": "Private GP",
            "location": "Manchester",
            "address": "61 King Street, Manchester M2 4PD",
            "rating": 4.8,
            "reviews": 342,
            "image": CloudAssets.getImageUrl("pall_mall_medical.jpg"),
            "premium": true,
            "phone": "0161 832 2111",
            "website": "https://pallmallmedical.co.uk",
            "description": "Pall Mall Medical Manchester is a prestigious private healthcare provider located in the heart of Manchester's business district. Our experienced team of consultants and GPs offer comprehensive medical services in a luxurious, comfortable environment with state-of-the-art facilities.",
            "services": [
                "Private GP Consultations",
                "Health Screening",
                "Executive Health",
                "Travel Medicine"
            ]
        },
        {
            "id": 2,
            "name": "Didsbury Dental Practice",
            "type": "Private Dentist",
            "location": "Manchester",
            "address": "90 Barlow Moor Rd, Manchester M20 2PN",
            "rating": 4.9,
            "reviews": 567,
            "image": CloudAssets.getImageUrl("didsbury_dental_practice.jpg"),
            "premium": true,
            "phone": "0161 455 0005",
            "website": "https://didsburydental.co.uk",
            "description": "Didsbury Dental Practice is a modern, award-winning dental clinic providing exceptional dental care in the heart of Didsbury. Our skilled team combines advanced technology with gentle, personalized care to ensure optimal oral health and beautiful smiles for all our patients.",
            "services": [
                "General Dentistry",
                "Cosmetic Dentistry",
                "Invisalign",
                "Emergency Dental Care"
            ]
        },
        {
            "id": 304,
            "name": "3StepSmiles Dental Practice",
            "type": "Dentist",
            "location": "Glasgow",
            "address": "41 Bath Street, Glasgow G2 1HW",
            "rating": 4.9,
            "reviews": 220,
            "image": CloudAssets.getImageUrl("3StepSmiles Dental Practice.webp"),
            "premium": true,
            "phone": "0141 488 8292",
            "website": "https://www.3stepsmiles.com/uk/glasgow",
            "description": "3StepSmiles Dental Practice is a cutting-edge dental clinic in the heart of Glasgow, specializing in advanced dental treatments and cosmetic dentistry. Our experienced team provides comprehensive oral care using the latest technology and techniques to ensure exceptional results for every patient.",
            "services": [
                "Full mouth rehab",
                "Implants",
                "Cosmetic dentistry"
            ]
        },
        {
            "id": 205,
            "name": "Aesthetique Dental Care",
            "type": "Dentist",
            "location": "Leeds",
            "address": "44A The Headrow, Leeds LS1 8TL",
            "rating": 4.9,
            "reviews": 250,
            "image": CloudAssets.getImageUrl("Aesthetique Dental Care.jpg"),
            "premium": true,
            "phone": "0113 245 8066",
            "website": "https://aesthetiquedental.co.uk",
            "description": "Aesthetique Dental Care offers premium dental services in Leeds city center. Our state-of-the-art clinic combines advanced dental technology with personalized care to deliver exceptional results. We specialize in cosmetic dentistry, orthodontics, and comprehensive dental health.",
            "services": [
                "Cosmetic Dentistry",
                "Orthodontics",
                "Teeth Whitening",
                "Dental Implants"
            ]
        },
        {
            "id": 504,
            "name": "Chelsea Dental Clinic",
            "type": "Dentist",
            "location": "London",
            "address": "298 Fulham Road, Chelsea, London SW10 9EP",
            "rating": 4.9,
            "reviews": 180,
            "image": CloudAssets.getImageUrl("chelsea Dental Clinic.png"),
            "premium": true,
            "phone": "020 3947 8000",
            "website": "https://chelseadentalclinic.co.uk",
            "description": "Chelsea Dental Clinic is a prestigious dental practice located in the heart of Chelsea, London. We provide comprehensive dental care with a focus on excellence, comfort, and personalized treatment plans for each patient.",
            "services": [
                "General Dentistry",
                "Cosmetic Dentistry",
                "Dental Implants",
                "Emergency Care"
            ]
        },
        {
            "id": 107,
            "name": "City Centre Dental & Implant Clinic",
            "type": "Dentist",
            "location": "Manchester",
            "address": "Manchester City Centre",
            "rating": 4.9,
            "reviews": 200,
            "image": CloudAssets.getImageUrl("city centre dental & implant clinic - dentist.webp"),
            "premium": true,
            "phone": "0161 832 5678",
            "website": "https://citycentredental.co.uk",
            "description": "City Centre Dental & Implant Clinic is Manchester's premier dental facility, offering comprehensive dental services including advanced implant treatments. Our experienced team uses cutting-edge technology to provide exceptional dental care in a comfortable, modern environment.",
            "services": [
                "Dental Implants",
                "General Dentistry",
                "Cosmetic Treatments",
                "Oral Surgery"
            ]
        },
        {
            "id": 507,
            "name": "Complete Physio – Chelsea",
            "type": "Private Physiotherapy",
            "location": "London",
            "address": "321 Fulham Rd, London SW10 9QL",
            "rating": 4.9,
            "reviews": 230,
            "image": CloudAssets.getImageUrl("complete_physio_chelsea.jpg"),
            "premium": true,
            "phone": "020 7482 3875",
            "website": "https://completephysio.co.uk",
            "description": "Complete Physio Chelsea is a leading physiotherapy clinic offering comprehensive rehabilitation services and sports injury treatment. Our expert physiotherapists provide personalized care using evidence-based treatments to help patients achieve optimal recovery and performance.",
            "services": [
                "Sports Injury Treatment",
                "Physiotherapy",
                "Rehabilitation",
                "Sports Massage"
            ]
        }
    ];
}