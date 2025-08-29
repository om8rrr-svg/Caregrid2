// Import required functions
import { buildUrl } from './api-base.js';

// Initialize API service
const apiService = new APIService();

// Unregister any old service workers to prevent cache issues
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
    });
}

// Sample clinic data (fallback)
let clinicsData = [
    {
        "id": 1,
        "name": "Pall Mall Medical Manchester",
        "type": "Private GP",
        "location": "Manchester",
        "address": "61 King Street, Manchester M2 4PD",
        "rating": 4.8,
        "reviews": 342,
        "image": "images/pall_mall_medical.jpg",
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
        "image": "images/didsbury_dental_practice.jpg",
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
        "id": 3,
        "name": "City Rehab Liverpool",
        "type": "Private Physiotherapy",
        "location": "Liverpool",
        "address": "Liverpool City Centre, L1 8JQ",
        "rating": 4.7,
        "reviews": 423,
        "image": "images/City Rehab Liverpool.avif",
        "premium": true,
        "phone": "0151 707 2345",
        "website": "https://cityrehab.co.uk",
        "description": "City Rehab Liverpool is a leading physiotherapy clinic specializing in sports injury rehabilitation and performance enhancement. Our expert physiotherapists use evidence-based treatments and cutting-edge techniques to help patients recover faster and achieve their fitness goals.",
        "services": [
            "Sports Injury Treatment",
            "Physiotherapy",
            "Sports Massage",
            "Biomechanical Analysis"
        ]
    },
    {
        "id": 4,
        "name": "Pall Mall Medical Liverpool",
        "type": "Private GP",
        "location": "Liverpool",
        "address": "5 St Pauls Square, Liverpool L3 9SJ",
        "rating": 4.8,
        "reviews": 298,
        "image": "images/Pall Mall Medical Liverpool.jpg",
        "premium": true,
        "phone": "0151 832 2111",
        "website": "https://pallmallmedical.co.uk",
        "description": "Pall Mall Medical Liverpool offers premium private healthcare services in Liverpool's historic business quarter. Our dedicated team of medical professionals provides comprehensive health assessments, occupational health services, and executive medical care in elegant, professional surroundings.",
        "services": [
            "Private GP Consultations",
            "Health Screening",
            "Executive Health",
            "Occupational Health"
        ]
    },
    {
        "id": 5,
        "name": "207 Dental Care Manchester",
        "type": "Private Dentist",
        "location": "Manchester",
        "address": "207 Deansgate, Manchester M3 3NW",
        "rating": 4.6,
        "reviews": 445,
        "image": "images/207 Dental Care Manchester.jpeg",
        "premium": true,
        "phone": "0161 834 0606",
        "website": "https://207dentalcare.co.uk",
        "description": "207 Dental Care Manchester is a contemporary dental practice located on prestigious Deansgate. We specialize in transformative cosmetic dentistry and advanced dental treatments, combining artistic vision with clinical excellence to create stunning, healthy smiles.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry",
            "Dental Implants",
            "Smile Makeovers"
        ]
    },
    {
        "id": 6,
        "name": "Spire Manchester Hospital Physiotherapy",
        "type": "Private Physiotherapy",
        "location": "Manchester",
        "address": "170 Barlow Moor Rd, Manchester M20 2AF",
        "rating": 4.8,
        "reviews": 234,
        "image": "images/Spire Manchester Hospital Physiotherapy.jpg",
        "premium": true,
        "phone": "0161 447 6677",
        "website": "https://spirehealthcare.com",
        "description": "Spire Manchester Hospital Physiotherapy Department provides world-class rehabilitation services within one of the UK's leading private hospitals. Our specialist physiotherapists offer comprehensive treatment programs using the latest techniques and equipment for optimal recovery outcomes.",
        "services": [
            "Physiotherapy",
            "Sports Rehabilitation",
            "Post-Surgery Rehab",
            "Clinical Pilates"
        ]
    },
    {
        "id": 7,
        "name": "Regent Street Medical Practice",
        "type": "Private GP",
        "location": "Liverpool",
        "address": "Regent Street, Liverpool L1 9AR",
        "rating": 4.7,
        "reviews": 189,
        "image": "images/Regent Street Medical Practice.jpg",
        "premium": true,
        "phone": "0333 455 9070",
        "website": "https://regentstreetmedical.co.uk",
        "description": "Regent Street Medical Practice is a modern private healthcare facility in Liverpool city center. We offer comprehensive medical services including travel health consultations, sexual health screening, and aesthetic treatments, all delivered by experienced medical professionals in a comfortable, confidential environment.",
        "services": [
            "Private GP Consultations",
            "Travel Medicine",
            "Sexual Health",
            "Medical Aesthetics"
        ]
    },
    {
        "id": 8,
        "name": "Droylsden Road Dental Practice",
        "type": "Private Dentist",
        "location": "Manchester",
        "address": "117-119 Droylsden Road, Manchester M40 1NT",
        "rating": 4.5,
        "reviews": 312,
        "image": "images/Droylsden Road Dental Practice.webp",
        "premium": true,
        "phone": "0161 682 6903",
        "website": "https://droylsdendental.co.uk",
        "description": "Droylsden Road Dental Practice is a family-friendly dental clinic serving the Manchester community with high-quality dental care. We combine traditional dental values with modern techniques, offering everything from routine check-ups to advanced cosmetic treatments including Invisalign and dental implants.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry",
            "Invisalign",
            "Dental Implants"
        ]
    },
    {
        "id": 9,
        "name": "Compass Physiotherapy Waterloo",
        "type": "Private Physiotherapy",
        "location": "Liverpool",
        "address": "91 South Road, Waterloo, Liverpool L22 0LR",
        "rating": 4.6,
        "reviews": 156,
        "image": "Compass Physiotherapy Waterloo.jpg",
        "premium": true,
        "phone": "0151 928 5445",
        "website": "https://compassphysio.co.uk",
        "description": "Compass Physiotherapy Waterloo is a specialist rehabilitation clinic offering comprehensive physiotherapy services to the Liverpool area. Our experienced team provides personalized treatment plans for sports injuries, neurological conditions, and general musculoskeletal problems, incorporating traditional and complementary therapies.",
        "services": [
            "Physiotherapy",
            "Sports Injuries",
            "Acupuncture",
            "Neuro-Physiotherapy"
        ]
    },
    {
        "id": 10,
        "name": "The Dental Team Manchester",
        "type": "Private Dentist",
        "location": "Stretford",
        "address": "Chester Rd, Stretford, Manchester M32 0RS",
        "rating": 4.7,
        "reviews": 278,
        "image": "images/The Dental Team Manchester.png",
        "premium": true,
        "phone": "0161 864 3250",
        "website": "https://thedentalteam.co.uk",
        "description": "The Dental Team Manchester is a comprehensive dental practice in Stretford offering both NHS and private dental services. Our skilled team provides a full range of treatments from preventive care to advanced cosmetic procedures, including dental implants, Invisalign, and facial aesthetics in a welcoming, modern environment.",
        "services": [
            "NHS & Private Dentistry",
            "Dental Implants",
            "Invisalign",
            "Facial Aesthetics"
        ]
    },
    {
        "id": 11,
        "name": "Ghosh Medical Liverpool",
        "type": "Private GP",
        "location": "Liverpool",
        "address": "Rodney Street, Liverpool L1 9ED",
        "rating": 4.8,
        "reviews": 167,
        "image": "Ghosh Medical Liverpool.jpeg",
        "premium": true,
        "phone": "0333 200 3338",
        "website": "https://ghoshmedical.co.uk",
        "description": "Ghosh Medical Liverpool is a pioneering private healthcare practice located on prestigious Rodney Street. We specialize in innovative treatments including ADHD assessments, medical cannabis consultations, and wellness therapies, providing personalized care with a focus on mental health and holistic wellbeing.",
        "services": [
            "Private GP",
            "ADHD Assessment",
            "Medical Cannabis",
            "Vitamin Injections"
        ]
    },
    {
        "id": 12,
        "name": "Synergy Dental Preston",
        "type": "Private Dentist",
        "location": "Preston",
        "address": "35 Ormskirk Rd, Preston PR1 2QP",
        "rating": 4.6,
        "reviews": 203,
        "image": "images/clinic4.svg",
        "premium": true,
        "phone": "01772 252154",
        "website": "https://synergydental.co.uk",
        "description": "Synergy Dental Preston is a state-of-the-art dental practice committed to providing exceptional oral healthcare to the Preston community. Our comprehensive services range from preventive care to complex restorative treatments, utilizing the latest technology and techniques to ensure optimal patient outcomes.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry",
            "Orthodontics",
            "Dental Implants"
        ]
    },
    {
        "id": 13,
        "name": "Private GP Liverpool Royal Liver Building",
        "type": "Private GP",
        "location": "Liverpool",
        "address": "The Royal Liver Building, Pier Head, Liverpool L3 1HU",
        "rating": 4.9,
        "reviews": 145,
        "image": "Private GP Liverpool Royal Liver Building.avif",
        "premium": true,
        "phone": "0151 236 7890",
        "website": "https://privategpliverpool.co.uk",
        "description": "Private GP Liverpool Royal Liver Building offers premium medical services in one of Liverpool's most iconic landmarks. We provide same-day appointments, comprehensive health consultations, and medical certificates in an exclusive setting with stunning waterfront views, ensuring convenient and confidential healthcare.",
        "services": [
            "Same Day GP",
            "Private Consultations",
            "Medical Certificates",
            "Second Opinions"
        ]
    },
    {
        "id": 14,
        "name": "Spire Liverpool Hospital Physiotherapy",
        "type": "Private Physiotherapy",
        "location": "Liverpool",
        "address": "57 Rodney St, Liverpool L1 9EX",
        "rating": 4.7,
        "reviews": 198,
        "image": "Spire Liverpool Hospital Physiotherapy.jpg",
        "premium": true,
        "phone": "0151 733 7123",
        "website": "https://spirehealthcare.com",
        "description": "Spire Liverpool Hospital Physiotherapy on Rodney Street offers premium rehabilitation services in Liverpool's medical quarter. Our expert physiotherapists provide specialized treatments including hydrotherapy and sports medicine, utilizing advanced facilities and evidence-based approaches to help patients achieve optimal recovery and performance.",
        "services": [
            "Physiotherapy",
            "Sports Medicine",
            "Hydrotherapy",
            "Clinical Pilates"
        ]
    },
    {
        "id": 15,
        "name": "Synergy Dental Blackpool",
        "type": "Private Dentist",
        "location": "Blackpool",
        "address": "370 Central Dr, Blackpool FY1 6LA",
        "rating": 4.4,
        "reviews": 167,
        "image": "images/clinic7.svg",
        "premium": true,
        "phone": "01253 348616",
        "website": "https://synergydental.co.uk",
        "description": "Synergy Dental Blackpool brings exceptional dental care to the seaside town, offering comprehensive oral health services in a modern, comfortable setting. Our experienced team specializes in cosmetic dentistry and smile transformations, helping patients achieve confident, healthy smiles through advanced treatments and personalized care.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry",
            "Teeth Whitening",
            "Dental Implants"
        ]
    },
    {
        "id": 16,
        "name": "Bolton Private Medical Centre",
        "type": "Private GP",
        "location": "Bolton",
        "address": "Chorley New Rd, Bolton BL1 4QR",
        "rating": 4.5,
        "reviews": 134,
        "image": "Bolton Private Medical Centre.jpg",
        "premium": true,
        "phone": "01204 567890",
        "website": "https://boltonprivatemedical.co.uk",
        "description": "Bolton Private Medical Centre provides comprehensive private healthcare services to the Bolton community and surrounding areas. We offer a full range of medical services including health screenings, occupational health assessments, and travel medicine, delivered by experienced healthcare professionals in a modern, patient-focused environment.",
        "services": [
            "Private GP",
            "Health Screening",
            "Occupational Health",
            "Travel Vaccinations"
        ]
    },
    {
        "id": 17,
        "name": "Salford Quays Dental Practice",
        "type": "Private Dentist",
        "location": "Salford",
        "address": "The Quays, Salford M50 3AZ",
        "rating": 4.6,
        "reviews": 189,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0161 877 4567",
        "website": "https://salfordquaysdental.co.uk",
        "description": "Salford Quays Dental Practice is a contemporary dental clinic located in the vibrant Salford Quays development. We provide comprehensive dental care with a focus on preventive dentistry and cosmetic treatments, offering patients convenient access to high-quality oral healthcare in a modern waterfront setting.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry",
            "Invisalign",
            "Dental Hygiene"
        ]
    },
    {
        "id": 18,
        "name": "Stockport Physiotherapy Centre",
        "type": "Private Physiotherapy",
        "location": "Stockport",
        "address": "Wellington Rd S, Stockport SK1 3UD",
        "rating": 4.7,
        "reviews": 156,
        "image": "Stockport Physiotherapy Centre.jpg",
        "premium": true,
        "phone": "0161 480 7890",
        "website": "https://stockportphysio.co.uk",
        "description": "Stockport Physiotherapy Centre is a dedicated rehabilitation facility serving the Greater Manchester area. Our experienced physiotherapists provide comprehensive treatment programs for sports injuries, chronic pain, and post-surgical recovery, combining manual therapy techniques with modern rehabilitation equipment for optimal patient outcomes.",
        "services": [
            "Physiotherapy",
            "Sports Injury",
            "Massage Therapy",
            "Rehabilitation"
        ]
    },
    {
        "id": 19,
        "name": "Rochdale Private GP Clinic",
        "type": "Private GP",
        "location": "Rochdale",
        "address": "Yorkshire St, Rochdale OL16 1JU",
        "rating": 4.3,
        "reviews": 112,
        "image": "images/clinic3.svg",
        "premium": true,
        "phone": "01706 345678",
        "website": "https://rochdaleprivategp.co.uk",
        "description": "Rochdale Private GP Clinic offers accessible private healthcare services to the Rochdale community. We provide same-day appointments, comprehensive health assessments, and medical reports in a friendly, professional environment, ensuring patients receive prompt, personalized medical care when they need it most.",
        "services": [
            "Private GP",
            "Same Day Appointments",
            "Medical Reports",
            "Health Assessments"
        ]
    },
    {
        "id": 20,
        "name": "Warrington Dental Excellence",
        "type": "Private Dentist",
        "location": "Warrington",
        "address": "Palmyra Sq S, Warrington WA1 1BW",
        "rating": 4.8,
        "reviews": 201,
        "image": "images/clinic4.svg",
        "premium": true,
        "phone": "01925 234567",
        "website": "https://warringtondental.co.uk",
        "description": "Warrington Dental Excellence is a premier dental practice in the heart of Warrington, committed to delivering exceptional oral healthcare. Our skilled team combines advanced dental technology with personalized care to provide comprehensive treatments from routine check-ups to complex restorative procedures, ensuring every patient achieves optimal oral health.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry",
            "Dental Implants",
            "Orthodontics"
        ]
    },
    {
        "id": 21,
        "name": "Wigan Private Health Centre",
        "type": "Private GP",
        "location": "Wigan",
        "address": "Market St, Wigan WN1 1PX",
        "rating": 4.4,
        "reviews": 178,
        "image": "images/clinic5.svg",
        "premium": true,
        "phone": "01942 567890",
        "website": "https://wiganprivatehealth.co.uk",
        "description": "Wigan Private Health Centre provides comprehensive private healthcare services in the heart of Wigan. We specialize in executive health programs, occupational health assessments, and comprehensive medical examinations, offering busy professionals and organizations convenient access to high-quality healthcare services.",
        "services": [
            "Private GP",
            "Executive Health",
            "Occupational Health",
            "Medical Examinations"
        ]
    },
    {
        "id": 22,
        "name": "Oldham Physiotherapy Clinic",
        "type": "Private Physiotherapy",
        "location": "Oldham",
        "address": "High St, Oldham OL1 1DG",
        "rating": 4.5,
        "reviews": 143,
        "image": "Oldham Physiotherapy Clinic.jpeg",
        "premium": true,
        "phone": "0161 627 3456",
        "website": "https://oldhamphysio.co.uk",
        "description": "Oldham Physiotherapy Clinic is a multidisciplinary rehabilitation center serving the Oldham community. Our team of physiotherapists and occupational therapists provide comprehensive treatment programs for sports injuries, chronic pain conditions, and workplace-related injuries, focusing on evidence-based care and patient education.",
        "services": [
            "Physiotherapy",
            "Sports Medicine",
            "Occupational Therapy",
            "Pain Management"
        ]
    },
    {
        "id": 23,
        "name": "Lancaster Dental Studio",
        "type": "Private Dentist",
        "location": "Lancaster",
        "address": "Penny St, Lancaster LA1 1XN",
        "rating": 4.7,
        "reviews": 167,
        "image": "images/clinic7.svg",
        "premium": true,
        "phone": "01524 567890",
        "website": "https://lancasterdental.co.uk",
        "description": "Lancaster Dental Studio is a boutique dental practice in historic Lancaster, offering personalized dental care in an elegant, comfortable setting. We specialize in cosmetic dentistry and smile design, combining artistic expertise with advanced dental techniques to create beautiful, natural-looking results for our patients.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry",
            "Dental Implants",
            "Teeth Whitening"
        ]
    },
    {
        "id": 24,
        "name": "Southport Private GP",
        "type": "Private GP",
        "location": "Southport",
        "address": "Lord St, Southport PR8 1NY",
        "rating": 4.6,
        "reviews": 134,
        "image": "images/clinic8.svg",
        "premium": true,
        "phone": "01704 234567",
        "website": "https://southportprivategp.co.uk",
        "description": "Southport Private GP is a modern medical practice located on the prestigious Lord Street in Southport. We provide comprehensive private healthcare services including health screenings, travel medicine consultations, and minor surgical procedures, offering residents and visitors convenient access to quality medical care in this beautiful seaside town.",
        "services": [
            "Private GP",
            "Health Screening",
            "Travel Medicine",
            "Minor Surgery"
        ]
    },
    {
        "id": 25,
        "name": "Burnley Physiotherapy Centre",
        "type": "Private Physiotherapy",
        "location": "Burnley",
        "address": "St James St, Burnley BB11 1NQ",
        "rating": 4.3,
        "reviews": 98,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "01282 345678",
        "website": "https://burnleyphysio.co.uk",
        "description": "Burnley Physiotherapy Centre is a dedicated rehabilitation facility serving the Burnley and East Lancashire area. Our qualified physiotherapists provide personalized treatment programs using manual therapy techniques and exercise-based interventions to help patients recover from injuries and improve their physical function and quality of life.",
        "services": [
            "Physiotherapy",
            "Sports Rehabilitation",
            "Manual Therapy",
            "Exercise Therapy"
        ]
    },
    {
        "id": 26,
        "name": "Ghosh Medical Group",
        "type": "Private GP",
        "location": "Liverpool",
        "address": "Rodney Street, Liverpool L1 9ED",
        "rating": 4.6,
        "reviews": 118,
        "image": "images/clinic2.svg",
        "premium": true,
        "phone": "0333 200 3338",
        "website": "https://www.drarunghosh.co.uk",
        "description": "Ghosh Medical Group is an established private healthcare practice on Liverpool's renowned Rodney Street medical quarter. Led by experienced physicians, we provide comprehensive private GP services, health screenings, and occupational health assessments, combining traditional medical values with modern healthcare approaches for optimal patient care.",
        "services": [
            "Private GP Appointments",
            "Health Screening",
            "Occupational Health"
        ]
    },
    {
        "id": 27,
        "name": "Spire Liverpool Hospital - Private GP",
        "type": "Private GP",
        "location": "Liverpool",
        "address": "57 Greenbank Rd, Liverpool L18 1HQ",
        "rating": 4.4,
        "reviews": 86,
        "image": "images/clinic3.svg",
        "premium": true,
        "phone": "0151 733 7123",
        "website": "https://www.spirehealthcare.com/spire-liverpool-hospital/",
        "description": "Spire Liverpool Hospital Private GP services offer premium healthcare within one of the UK's leading private hospitals. Our experienced GPs provide comprehensive consultations, advanced diagnostics, and seamless specialist referrals, ensuring patients receive coordinated, high-quality medical care in a state-of-the-art hospital environment.",
        "services": [
            "Private GP",
            "Consultations",
            "Diagnostics",
            "Specialist Referrals"
        ]
    },
    {
        "id": 28,
        "name": "Regent Street Clinic Liverpool",
        "type": "Private GP",
        "location": "Liverpool",
        "address": "Exchange Station, Liverpool L2 2QP",
        "rating": 4.7,
        "reviews": 52,
        "image": "images/regent_medical_practice.jpg",
        "premium": true,
        "phone": "0333 455 9070",
        "website": "https://www.regentstreetclinic.co.uk/private-gp-liverpool/",
        "description": "Regent Street Clinic Liverpool is a modern private healthcare facility conveniently located at Exchange Station in Liverpool city center. We specialize in confidential healthcare services including GP consultations, sexual health testing, and travel vaccinations, providing discreet, professional medical care for busy urban professionals.",
        "services": [
            "GP Consultations",
            "Sexual Health Testing",
            "Vaccinations"
        ]
    },
    {
        "id": 29,
        "name": "The Dental House",
        "type": "Private Dentist",
        "location": "Liverpool",
        "address": "358 Aigburth Rd, Liverpool L17 6AE",
        "rating": 4.9,
        "reviews": 143,
        "image": "images/clinic5.svg",
        "premium": true,
        "phone": "0151 475 9929",
        "website": "https://www.dentalhouseliverpool.co.uk",
        "description": "The Dental House is a premier dental practice in Liverpool specializing in cosmetic dentistry and patient comfort. We excel in Invisalign treatments, teeth whitening, and dental implants, with a particular focus on caring for nervous patients in a relaxed, welcoming environment that puts dental anxiety at ease.",
        "services": [
            "Invisalign",
            "Whitening",
            "Implants",
            "Nervous Patients"
        ]
    },
    {
        "id": 30,
        "name": "Ollie & Darsh",
        "type": "Private Dentist",
        "location": "Liverpool",
        "address": "11 Dale St, Liverpool L2 2SH",
        "rating": 4.8,
        "reviews": 212,
        "image": "images/clinic6.svg",
        "premium": true,
        "phone": "0151 236 6578",
        "website": "https://www.ollieanddarsh.co.uk",
        "description": "Ollie & Darsh is an award-winning cosmetic dental practice in Liverpool's business district, renowned for creating stunning smile transformations. Our expert team combines artistic vision with advanced dental techniques to deliver exceptional cosmetic dentistry, smile makeovers, and dental implant treatments in a luxurious, contemporary setting.",
        "services": [
            "Cosmetic Dentistry",
            "Smile Makeovers",
            "Dental Implants"
        ]
    },
    {
        "id": 31,
        "name": "PBA Dental & Implant Clinic",
        "type": "Private Dentist",
        "location": "Liverpool",
        "address": "6 Childwall Valley Rd, Gateacre, Liverpool L25 1RL",
        "rating": 4.6,
        "reviews": 89,
        "image": "images/clinic7.svg",
        "premium": false,
        "phone": "0151 722 3888",
        "website": "https://www.pbadentalhealth.com",
        "description": "PBA Dental & Implant Clinic is a specialist dental practice in Gateacre, Liverpool, focusing on dental implant treatments and comprehensive oral healthcare. Our experienced team provides high-quality dental implant solutions, general dentistry, and private check-ups in a comfortable, patient-centered environment with affordable pricing options.",
        "services": [
            "Dental Implants",
            "General Dentistry",
            "Private Check-ups"
        ]
    },
    {
        "id": 32,
        "name": "Smileworks Liverpool",
        "type": "Private Dentist",
        "location": "Liverpool",
        "address": "1a Kenyon's Steps, Liverpool ONE, L1 3DF",
        "rating": 4.9,
        "reviews": 370,
        "image": "images/clinic8.svg",
        "premium": true,
        "phone": "0151 294 3229",
        "website": "https://www.smileworksliverpool.co.uk",
        "description": "Smileworks Liverpool is a flagship aesthetic dental practice located in the heart of Liverpool ONE shopping district. We are pioneers in aesthetic dentistry and facial aesthetics, offering cutting-edge treatments including advanced orthodontics and non-surgical facial rejuvenation in a stunning, award-winning clinic environment.",
        "services": [
            "Aesthetic Dentistry",
            "Facial Aesthetics",
            "Orthodontics"
        ]
    },
    {
        "id": 33,
        "name": "Duthie Dental Practice",
        "type": "Private Dentist",
        "location": "Liverpool",
        "address": "258 Woolton Rd, Liverpool L16 8NE",
        "rating": 4.5,
        "reviews": 65,
        "image": "images/clinic1.svg",
        "premium": false,
        "phone": "0151 722 2642",
        "website": "https://duthie.dental",
        "description": "Duthie Dental Practice is a friendly, family-oriented dental clinic in Woolton, Liverpool, providing accessible dental care to the local community. We offer comprehensive dental services including routine check-ups, teeth whitening, and emergency dental care, focusing on preventive dentistry and patient comfort at affordable prices.",
        "services": [
            "Check-ups",
            "Whitening",
            "Emergency Dental"
        ]
    },
    {
        "id": 101,
        "name": "SameDayDoctor Manchester",
        "type": "GP",
        "location": "Manchester",
        "address": "30 Queen Street, Manchester M2 5HX",
        "rating": 4.5,
        "reviews": 120,
        "image": "images/samedaydoctor_manchester.jpg",
        "premium": false,
        "phone": "0161 827 7868",
        "website": "https://samedaydoctor.co.uk/clinic/manchester",
        "services": [
            "Walk-in GP",
            "Private consultations",
            "Medical certificates",
            "Occupational medicals"
        ]
    },
    {
        "id": 102,
        "name": "Private GP Extra – Manchester",
        "type": "GP",
        "location": "Manchester",
        "address": "Manchester City Centre",
        "rating": 4.4,
        "reviews": 55,
        "image": "images/private_gp_extra_manchester.jpg",
        "premium": true,
        "phone": "—",
        "website": "https://privategpextra.com",
        "services": [
            "Private GP diagnostics",
            "Flexible appointments",
            "Prescriptions",
            "Referrals"
        ]
    },
    {
        "id": 103,
        "name": "The Village Doctor",
        "type": "GP",
        "location": "Manchester",
        "address": "Prestwich, Greater Manchester",
        "rating": 4.6,
        "reviews": 45,
        "image": "images/clinic3.svg",
        "premium": false,
        "phone": "—",
        "website": "https://thevillagedoctor.co.uk",
        "services": [
            "Private GP consultations",
            "Home visits",
            "Vaccinations",
            "Health screenings"
        ]
    },
    {
        "id": 104,
        "name": "Alexandra Hospital GP Service",
        "type": "GP",
        "location": "Manchester",
        "address": "The Alexandra Hospital, Cheadle, Cheshire",
        "rating": 4.2,
        "reviews": 80,
        "image": "images/clinic4.svg",
        "premium": true,
        "phone": "0161 488 5000",
        "website": "https://www.circlehealthgroup.co.uk/hospitals/the-alexandra-hospital/private-gp-manchester",
        "services": [
            "Private GP",
            "Diagnostics",
            "Blood testing",
            "Specialist referrals"
        ]
    },
    {
        "id": 105,
        "name": "360 Dental Care",
        "type": "Dentist",
        "location": "Manchester",
        "address": "Manchester City Centre",
        "rating": 4.8,
        "reviews": 250,
        "image": "images/clinic5.svg",
        "premium": true,
        "phone": "0161 881 2345",
        "website": "https://www.360dentalcare.co.uk",
        "services": [
            "Cosmetic Dentistry",
            "Teeth Whitening",
            "Veneers",
            "General Dentistry"
        ]
    },
    {
        "id": 106,
        "name": "Hale Dental Clinic",
        "type": "Dentist",
        "location": "Manchester",
        "address": "Hale, Altrincham, Greater Manchester",
        "rating": 4.7,
        "reviews": 105,
        "image": "images/clinic6.svg",
        "premium": false,
        "phone": "0161 929 1234",
        "website": "https://www.haledentalclinic.com",
        "services": [
            "Invisalign",
            "Dental Implants",
            "Cosmetic and general dentistry"
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
        "image": "city centre dental & implant clinic - dentist.webp",
        "premium": true,
        "phone": "0161 832 5678",
        "website": "https://www.citycentredentist.co.uk",
        "services": [
            "Dental Implants",
            "Restorative Dentistry",
            "Aesthetic treatments"
        ]
    },
    {
        "id": 108,
        "name": "Manchester Physio",
        "type": "Physio",
        "location": "Manchester",
        "address": "Greater Manchester area",
        "rating": 4.8,
        "reviews": 300,
        "image": "images/clinic8.svg",
        "premium": true,
        "phone": "0161 883 0077",
        "website": "https://www.manchesterphysio.co.uk",
        "services": [
            "Musculoskeletal physio",
            "Hydrotherapy",
            "Clinical Pilates",
            "Sports massage"
        ]
    },
    {
        "id": 109,
        "name": "Pure Physiotherapy – Sale",
        "type": "Physio",
        "location": "Manchester",
        "address": "45 Northenden Road, Sale, M33 2DL",
        "rating": 4.7,
        "reviews": 850,
        "image": "images/clinic9.svg",
        "premium": false,
        "phone": "0161 441 4458",
        "website": "https://purephysiotherapy.co.uk/clinics/manchester-physiotherapy-clinic-in-sale",
        "services": [
            "Sports physio",
            "Rehabilitation",
            "Pain management",
            "Online booking"
        ]
    },
    {
        "id": 110,
        "name": "Physio Pattern Manchester",
        "type": "Physio",
        "location": "Manchester",
        "address": "75 Lever Street, Manchester City Centre",
        "rating": 4.6,
        "reviews": 150,
        "image": "images/clinic10.svg",
        "premium": true,
        "phone": "0161 828 0000",
        "website": "https://www.physiopattern.com",
        "services": [
            "Rehab centre",
            "Advanced rehab equipment",
            "Sports injury therapy"
        ]
    },
    {
        "id": 201,
        "name": "OneMedical Group – Leeds City",
        "type": "GP",
        "location": "Leeds",
        "address": "The Light, The Headrow, Leeds LS1 8TL",
        "rating": 4.5,
        "reviews": 95,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0113 869 2050",
        "website": "https://onemedicalgroup.co.uk",
        "services": [
            "Private GP appointments",
            "Vaccinations",
            "Referrals",
            "Occupational health"
        ]
    },
    {
        "id": 202,
        "name": "Spire Leeds Hospital Private GP",
        "type": "GP",
        "location": "Leeds",
        "address": "Jackson Avenue, Roundhay, Leeds LS8 1NT",
        "rating": 4.7,
        "reviews": 110,
        "image": "images/clinic2.svg",
        "premium": true,
        "phone": "0113 269 3939",
        "website": "https://www.spirehealthcare.com/spire-leeds-hospital",
        "services": [
            "Same-day GP",
            "Men's health",
            "Women's health",
            "Travel health"
        ]
    },
    {
        "id": 203,
        "name": "Regent Street Clinic Leeds",
        "type": "GP",
        "location": "Leeds",
        "address": "76a Street Lane, Roundhay, Leeds LS8 2AA",
        "rating": 4.4,
        "reviews": 120,
        "image": "images/clinic3.svg",
        "premium": false,
        "phone": "0113 833 0422",
        "website": "https://www.regentstreetclinic.co.uk",
        "services": [
            "Private GP",
            "STD testing",
            "Occupational health",
            "Blood tests"
        ]
    },
    {
        "id": 204,
        "name": "Doctor Today Private GP Leeds",
        "type": "GP",
        "location": "Leeds",
        "address": "2 Legrams Terrace, Bradford Road, Leeds LS6 1BU",
        "rating": 4.3,
        "reviews": 90,
        "image": "images/clinic4.svg",
        "premium": false,
        "phone": "0113 322 7249",
        "website": "https://doctortoday.co.uk",
        "services": [
            "Acute illness",
            "Prescriptions",
            "Medicals",
            "Wellness checks"
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
        "image": "Aesthetique Dental Care.jpg",
        "premium": true,
        "phone": "0113 245 8066",
        "website": "https://www.aesthetique.co.uk",
        "services": [
            "Invisalign",
            "Teeth whitening",
            "Veneers",
            "Cosmetic dentistry"
        ]
    },
    {
        "id": 206,
        "name": "Ivory Dental Leeds",
        "type": "Dentist",
        "location": "Leeds",
        "address": "69 Armley Ridge Road, Leeds LS12 3NP",
        "rating": 4.7,
        "reviews": 145,
        "image": "images/clinic6.svg",
        "premium": false,
        "phone": "0113 279 6669",
        "website": "https://ivorydental.co.uk",
        "services": [
            "General dentistry",
            "Dental hygiene",
            "Emergency dentistry",
            "Implants"
        ]
    },
    {
        "id": 207,
        "name": "The Dental Architect",
        "type": "Dentist",
        "location": "Leeds",
        "address": "20 Park Square E, Leeds LS1 2NE",
        "rating": 4.8,
        "reviews": 130,
        "image": "images/clinic7.svg",
        "premium": true,
        "phone": "0113 868 4324",
        "website": "https://thedentalarchitect.com",
        "services": [
            "Smile makeovers",
            "Whitening",
            "Crowns",
            "Orthodontics"
        ]
    },
    {
        "id": 208,
        "name": "Whitehall Physiotherapy Clinic",
        "type": "Physio",
        "location": "Leeds",
        "address": "15a Park Square East, Leeds LS1 2LF",
        "rating": 4.6,
        "reviews": 140,
        "image": "images/clinic8.svg",
        "premium": false,
        "phone": "0113 234 5553",
        "website": "https://whitehallphysio.com",
        "services": [
            "Back pain",
            "Sports injuries",
            "Post-op rehab",
            "Manual therapy"
        ]
    },
    {
        "id": 209,
        "name": "Pure Sports Medicine Leeds",
        "type": "Physio",
        "location": "Leeds",
        "address": "Wellington Place, Leeds LS1 4DL",
        "rating": 4.9,
        "reviews": 200,
        "image": "images/clinic9.svg",
        "premium": true,
        "phone": "0113 456 8790",
        "website": "https://puresportsmed.com",
        "services": [
            "Performance physio",
            "Injury prevention",
            "Athlete rehab"
        ]
    },
    {
        "id": 210,
        "name": "Yorkshire Physio Clinic",
        "type": "Physio",
        "location": "Leeds",
        "address": "28 North Lane, Leeds LS6 3HE",
        "rating": 4.4,
        "reviews": 80,
        "image": "images/clinic10.svg",
        "premium": false,
        "phone": "0113 426 5432",
        "website": "https://yorkshirephysioclinic.co.uk",
        "services": [
            "Electrotherapy",
            "Joint mobilisation",
            "Functional rehab"
        ]
    },
    {
        "id": 211,
        "name": "Leeds Private Health",
        "type": "GP",
        "location": "Leeds",
        "address": "8 Park Square East, Leeds LS1 2LH",
        "rating": 4.5,
        "reviews": 60,
        "image": "images/clinic1.svg",
        "premium": false,
        "phone": "0113 888 1122",
        "website": "https://leedsprivatehealth.co.uk",
        "services": [
            "GP services",
            "Mental health",
            "Sexual health"
        ]
    },
    {
        "id": 212,
        "name": "Clarendon Dental Spa",
        "type": "Dentist",
        "location": "Leeds",
        "address": "2 Clarendon Road, Leeds LS2 9NN",
        "rating": 4.6,
        "reviews": 115,
        "image": "images/clinic6.svg",
        "premium": true,
        "phone": "0113 246 4877",
        "website": "https://clarendondentalspa.co.uk",
        "services": [
            "Cosmetic dentistry",
            "Invisalign",
            "Smile makeovers"
        ]
    },
    {
        "id": 213,
        "name": "Back to Fitness Physio",
        "type": "Physio",
        "location": "Leeds",
        "address": "The Basement, 15 Park Row, Leeds LS1 5HD",
        "rating": 4.3,
        "reviews": 85,
        "image": "images/clinic8.svg",
        "premium": false,
        "phone": "0113 320 7000",
        "website": "https://backtofitnessphysio.co.uk",
        "services": [
            "Chronic pain",
            "Physio-led exercise",
            "Postural assessments"
        ]
    },
    {
        "id": 301,
        "name": "GP Matters Glasgow",
        "type": "GP",
        "location": "Glasgow",
        "address": "24 Buckingham Terrace, Glasgow G12 8ED",
        "rating": 4.8,
        "reviews": 95,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0141 737 3270",
        "website": "https://www.gpmatters.com",
        "services": [
            "Same-day GP",
            "Medical tests",
            "Vaccinations",
            "Corporate health"
        ]
    },
    {
        "id": 302,
        "name": "YourGP Glasgow",
        "type": "GP",
        "location": "Glasgow",
        "address": "10 Newton Terrace, Glasgow G3 7PJ",
        "rating": 4.5,
        "reviews": 78,
        "image": "images/clinic2.svg",
        "premium": true,
        "phone": "0141 222 5778",
        "website": "https://www.yourgp.com",
        "services": [
            "Travel health",
            "Women's health",
            "Men's health",
            "Blood tests"
        ]
    },
    {
        "id": 303,
        "name": "Dr. Nair's Medical Practice",
        "type": "GP",
        "location": "Glasgow",
        "address": "30 Bellgrove Street, Glasgow G31 1HU",
        "rating": 4.6,
        "reviews": 64,
        "image": "images/clinic3.svg",
        "premium": false,
        "phone": "0141 551 5333",
        "website": "https://www.drnairpractice.co.uk",
        "services": [
            "Private consultations",
            "Mental health",
            "Certificates"
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
        "image": "3StepSmiles Dental Practice.webp",
        "premium": true,
        "phone": "0141 488 8292",
        "website": "https://www.3stepsmiles.com/uk/glasgow",
        "services": [
            "Full mouth rehab",
            "Implants",
            "Cosmetic dentistry"
        ]
    },
    {
        "id": 305,
        "name": "Dental Lounge Glasgow",
        "type": "Dentist",
        "location": "Glasgow",
        "address": "30 St. Vincent Place, Glasgow G1 2HL",
        "rating": 4.7,
        "reviews": 180,
        "image": "images/clinic6.svg",
        "premium": false,
        "phone": "0141 222 6580",
        "website": "https://www.dentalloungeglasgow.co.uk",
        "services": [
            "Invisalign",
            "Hygiene",
            "Restorative dentistry"
        ]
    },
    {
        "id": 306,
        "name": "Blythswood Dental Practice",
        "type": "Dentist",
        "location": "Glasgow",
        "address": "152 Bath Street, Glasgow G2 4TB",
        "rating": 4.6,
        "reviews": 140,
        "image": "images/clinic7.svg",
        "premium": true,
        "phone": "0141 332 8235",
        "website": "https://www.blythswooddental.com",
        "services": [
            "Smile makeovers",
            "Bridges",
            "Teeth whitening"
        ]
    },
    {
        "id": 307,
        "name": "Glasgow Physio Centre",
        "type": "Physio",
        "location": "Glasgow",
        "address": "22 Newton Place, Glasgow G3 7PY",
        "rating": 4.8,
        "reviews": 150,
        "image": "images/clinic8.svg",
        "premium": true,
        "phone": "0141 433 7000",
        "website": "https://glasgowphysiocentre.co.uk",
        "services": [
            "Sports rehab",
            "Manual therapy",
            "Back pain"
        ]
    },
    {
        "id": 308,
        "name": "Back2Fitness Physiotherapy",
        "type": "Physio",
        "location": "Glasgow",
        "address": "80 Berkeley Street, Glasgow G3 7DS",
        "rating": 4.5,
        "reviews": 100,
        "image": "images/clinic9.svg",
        "premium": false,
        "phone": "0141 248 4099",
        "website": "https://back2fitnessphysio.com",
        "services": [
            "Postural correction",
            "Joint mobilisations",
            "Post-surgical rehab"
        ]
    },
    {
        "id": 309,
        "name": "Phoenix Physio",
        "type": "Physio",
        "location": "Glasgow",
        "address": "1 Dowanhill Street, Glasgow G11 5QR",
        "rating": 4.6,
        "reviews": 88,
        "image": "images/clinic10.svg",
        "premium": true,
        "phone": "0141 339 0040",
        "website": "https://www.phoenixphysio.co.uk",
        "services": [
            "Chronic pain",
            "Neurological rehab",
            "Clinical Pilates"
        ]
    },
    {
        "id": 310,
        "name": "The Medical Suite Glasgow",
        "type": "GP",
        "location": "Glasgow",
        "address": "200 St Vincent Street, Glasgow G2 5RQ",
        "rating": 4.5,
        "reviews": 72,
        "image": "images/clinic1.svg",
        "premium": false,
        "phone": "0141 567 8899",
        "website": "https://themedicalsuite.co.uk",
        "services": [
            "General practice",
            "Work medicals",
            "Health screening"
        ]
    },
    {
        "id": 311,
        "name": "MyDentist Glasgow",
        "type": "Dentist",
        "location": "Glasgow",
        "address": "170 Buchanan Street, Glasgow G1 2LW",
        "rating": 4.2,
        "reviews": 200,
        "image": "images/clinic6.svg",
        "premium": false,
        "phone": "0141 333 5555",
        "website": "https://www.mydentist.co.uk",
        "services": [
            "General dental care",
            "NHS and private",
            "Check-ups"
        ]
    },
    {
        "id": 312,
        "name": "Physio Effect",
        "type": "Physio",
        "location": "Glasgow",
        "address": "33 Dornoch Street, Glasgow G40 2QT",
        "rating": 4.9,
        "reviews": 160,
        "image": "images/clinic8.svg",
        "premium": true,
        "phone": "0141 370 0400",
        "website": "https://www.physioeffect.co.uk",
        "services": [
            "Sports injury rehab",
            "Biomechanics",
            "Acupuncture"
        ]
    },
    {
        "id": 313,
        "name": "The Berkeley Clinic",
        "type": "Dentist",
        "location": "Glasgow",
        "address": "5 Newton Terrace, Glasgow G3 7PJ",
        "rating": 4.7,
        "reviews": 300,
        "image": "images/clinic7.svg",
        "premium": true,
        "phone": "0141 564 1900",
        "website": "https://www.berkeleyclinic.com",
        "services": [
            "Dental implants",
            "Smile design",
            "Sedation dentistry"
        ]
    },
    {
        "id": 401,
        "name": "Midland Health Birmingham",
        "type": "GP",
        "location": "Birmingham",
        "address": "23a Highfield Road, Edgbaston, Birmingham B15 3DP",
        "rating": 4.9,
        "reviews": 120,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0121 769 0999",
        "website": "https://midlandhealth.co.uk",
        "services": [
            "Same-day GP",
            "Health screening",
            "Travel vaccines",
            "Private prescriptions"
        ]
    },
    {
        "id": 402,
        "name": "Regent Street Clinic Birmingham",
        "type": "GP",
        "location": "Birmingham",
        "address": "28 George Road, Edgbaston, Birmingham B15 1PJ",
        "rating": 4.7,
        "reviews": 90,
        "image": "images/clinic2.svg",
        "premium": false,
        "phone": "0121 454 7779",
        "website": "https://regentstreetclinic.co.uk",
        "services": [
            "Walk-in GP",
            "STD testing",
            "Visa medicals"
        ]
    },
    {
        "id": 403,
        "name": "Private GP Clinic Birmingham",
        "type": "GP",
        "location": "Birmingham",
        "address": "Lyndon House, 62 Hagley Road, Edgbaston B16 8PE",
        "rating": 4.5,
        "reviews": 65,
        "image": "images/clinic3.svg",
        "premium": false,
        "phone": "0121 517 0202",
        "website": "https://privategpclinic.co.uk",
        "services": [
            "Occupational health",
            "Health checks",
            "Fit notes"
        ]
    },
    {
        "id": 404,
        "name": "Changing Faces Dentistry",
        "type": "Dentist",
        "location": "Birmingham",
        "address": "30a Great Charles Street, Birmingham B3 3JY",
        "rating": 4.8,
        "reviews": 110,
        "image": "images/clinic5.svg",
        "premium": true,
        "phone": "0121 633 1919",
        "website": "https://www.changingfacesdentures.co.uk",
        "services": [
            "Implants",
            "Dentures",
            "Smile makeovers"
        ]
    },
    {
        "id": 405,
        "name": "Edgbaston Smile Clinic",
        "type": "Dentist",
        "location": "Birmingham",
        "address": "51 Calthorpe Rd, Birmingham B15 1TH",
        "rating": 4.9,
        "reviews": 150,
        "image": "edgbaston smile clinic.jpg",
        "premium": true,
        "phone": "0121 456 7930",
        "website": "https://www.edgbastonsmile.co.uk",
        "services": [
            "Teeth whitening",
            "Invisalign",
            "Crowns",
            "Bridges"
        ]
    },
    {
        "id": 406,
        "name": "St Paul's Square Dental Practice",
        "type": "Dentist",
        "location": "Birmingham",
        "address": "17 St Paul's Square, Birmingham B3 1BU",
        "rating": 4.6,
        "reviews": 95,
        "image": "images/clinic7.svg",
        "premium": false,
        "phone": "0121 233 0867",
        "website": "https://www.stpaulsdental.co.uk",
        "services": [
            "Restorative dentistry",
            "Smile design",
            "Implants"
        ]
    },
    {
        "id": 407,
        "name": "Physio Art Birmingham",
        "type": "Physio",
        "location": "Birmingham",
        "address": "Waterloo Road, Edgbaston, Birmingham B15 3JU",
        "rating": 4.9,
        "reviews": 130,
        "image": "images/clinic8.svg",
        "premium": true,
        "phone": "0121 685 2300",
        "website": "https://www.physioart.co.uk",
        "services": [
            "Musculoskeletal physio",
            "Sports injury",
            "Rehabilitation"
        ]
    },
    {
        "id": 408,
        "name": "Birmingham Physiotherapy Clinic",
        "type": "Physio",
        "location": "Birmingham",
        "address": "38 Harborne Road, Birmingham B15 3HE",
        "rating": 4.7,
        "reviews": 85,
        "image": "images/clinic9.svg",
        "premium": false,
        "phone": "0121 455 0555",
        "website": "https://birminghamphysio.co.uk",
        "services": [
            "Joint pain",
            "Neurological rehab",
            "Post-surgical physio"
        ]
    },
    {
        "id": 409,
        "name": "Central City Physio",
        "type": "Physio",
        "location": "Birmingham",
        "address": "Regus Building, 11 Brindleyplace, Birmingham B1 2LP",
        "rating": 4.8,
        "reviews": 110,
        "image": "images/clinic10.svg",
        "premium": true,
        "phone": "0121 285 6069",
        "website": "https://www.centralcityphysio.co.uk",
        "services": [
            "Back pain",
            "Taping",
            "Workplace injury recovery"
        ]
    },
    {
        "id": 410,
        "name": "Spire Little Aston Hospital",
        "type": "GP",
        "location": "Birmingham",
        "address": "Little Aston Hall Dr, Sutton Coldfield B74 3UP",
        "rating": 4.3,
        "reviews": 210,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0121 580 7151",
        "website": "https://www.spirehealthcare.com",
        "services": [
            "Private GP",
            "Diagnostics",
            "Consultant referrals"
        ]
    },
    {
        "id": 411,
        "name": "The Clinic Room – Aesthetic & Skin",
        "type": "Dentist",
        "location": "Birmingham",
        "address": "61 Charlotte St, Birmingham B3 1PX",
        "rating": 4.6,
        "reviews": 130,
        "image": "images/clinic6.svg",
        "premium": true,
        "phone": "0121 573 0088",
        "website": "https://www.theclinicroom.co",
        "services": [
            "Skin treatments",
            "Facial aesthetics",
            "Dental hygiene"
        ]
    },
    {
        "id": 412,
        "name": "Back2Fitness Edgbaston",
        "type": "Physio",
        "location": "Birmingham",
        "address": "Unit 7, Chad Square, Birmingham B15 3TQ",
        "rating": 4.5,
        "reviews": 105,
        "image": "images/clinic8.svg",
        "premium": false,
        "phone": "0121 456 7890",
        "website": "https://www.back2fitnessphysio.co.uk",
        "services": [
            "Manual therapy",
            "Muscle rehab",
            "Pre/post op recovery"
        ]
    },
    {
        "id": 501,
        "name": "Harley Street Health Centre",
        "type": "GP",
        "location": "London",
        "address": "17 Harley Street, London W1G 9QH",
        "rating": 4.9,
        "reviews": 200,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "020 7486 1199",
        "website": "https://harleystreethealthcentre.com",
        "services": [
            "Private GP",
            "Executive health screens",
            "STD testing"
        ]
    },
    {
        "id": 502,
        "name": "London Doctors Clinic – Oxford Street",
        "type": "GP",
        "location": "London",
        "address": "168 Oxford Street, London W1D 1NH",
        "rating": 4.8,
        "reviews": 320,
        "image": "images/clinic2.svg",
        "premium": true,
        "phone": "020 4551 9522",
        "website": "https://londondoctorsclinic.co.uk",
        "services": [
            "Same-day GP",
            "Prescriptions",
            "Fit notes",
            "Vaccinations"
        ]
    },
    {
        "id": 503,
        "name": "GP London at London Bridge",
        "type": "GP",
        "location": "London",
        "address": "1 St Thomas St, London SE1 9RY",
        "rating": 4.7,
        "reviews": 135,
        "image": "images/clinic3.svg",
        "premium": false,
        "phone": "020 7940 5000",
        "website": "https://gplondon.uk",
        "services": [
            "Same-day GP",
            "Occupational health",
            "Travel clinic"
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
        "image": "chelsea Dental Clinic.png",
        "premium": true,
        "phone": "020 3947 8000",
        "website": "https://www.chelseadentalclinic.co.uk",
        "services": [
            "Cosmetic dentistry",
            "Dental implants",
            "Invisalign"
        ]
    },
    {
        "id": 505,
        "name": "Marylebone Dental Care",
        "type": "Dentist",
        "location": "London",
        "address": "36 Paddington Street, London W1U 4HE",
        "rating": 4.8,
        "reviews": 110,
        "image": "images/clinic6.svg",
        "premium": true,
        "phone": "020 7935 9366",
        "website": "https://marylebonesmileclinic.co.uk",
        "services": [
            "Smile makeovers",
            "Teeth whitening",
            "Gum treatments"
        ]
    },
    {
        "id": 506,
        "name": "Wimpole Street Dental Clinic",
        "type": "Dentist",
        "location": "London",
        "address": "43 Wimpole Street, London W1G 8DQ",
        "rating": 4.7,
        "reviews": 150,
        "image": "images/clinic7.svg",
        "premium": false,
        "phone": "020 7935 3832",
        "website": "https://www.wimpolestreetdentalclinic.co.uk",
        "services": [
            "General dentistry",
            "Endodontics",
            "Dental hygiene"
        ]
    },
    {
        "id": 507,
        "name": "Complete Physio – Chelsea",
        "type": "Physio",
        "location": "London",
        "address": "321 Fulham Rd, London SW10 9QL",
        "rating": 4.9,
        "reviews": 230,
        "image": "images/clinic8.svg",
        "premium": true,
        "phone": "020 7482 3875",
        "website": "https://complete-physio.co.uk",
        "services": [
            "Sports injuries",
            "Ultrasound",
            "Rehabilitation"
        ]
    },
    {
        "id": 508,
        "name": "Ten Health & Fitness – Mayfair",
        "type": "Physio",
        "location": "London",
        "address": "16-17 North Audley St, London W1K 6WL",
        "rating": 4.8,
        "reviews": 190,
        "image": "images/clinic9.svg",
        "premium": true,
        "phone": "020 7487 3222",
        "website": "https://www.ten.co.uk",
        "services": [
            "Clinical Pilates",
            "Massage",
            "Back pain rehab"
        ]
    },
    {
        "id": 509,
        "name": "London Physiotherapy and Wellness Clinic",
        "type": "Physio",
        "location": "London",
        "address": "1 Snow Hill, Farringdon, London EC1A 2DH",
        "rating": 4.6,
        "reviews": 120,
        "image": "images/clinic10.svg",
        "premium": false,
        "phone": "020 7112 5006",
        "website": "https://www.londonphysiotherapy.co.uk",
        "services": [
            "Posture correction",
            "Manual therapy",
            "Occupational health"
        ]
    },
    {
        "id": 510,
        "name": "One5 Health – Bank",
        "type": "GP",
        "location": "London",
        "address": "One Poultry, Bank, London EC2R 8EJ",
        "rating": 4.7,
        "reviews": 140,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "020 8050 0505",
        "website": "https://www.one5health.co.uk",
        "services": [
            "Preventive health",
            "Workplace wellbeing",
            "Health plans"
        ]
    },
    {
        "id": 511,
        "name": "GPDQ – Private GP at Home",
        "type": "GP",
        "location": "London",
        "address": "Home visits across Greater London",
        "rating": 4.6,
        "reviews": 175,
        "image": "images/clinic2.svg",
        "premium": false,
        "phone": "020 3370 0999",
        "website": "https://gpdq.co.uk",
        "services": [
            "GP home visits",
            "Children's care",
            "Elderly care"
        ]
    },
    {
        "id": 512,
        "name": "Smiles by Hillside",
        "type": "Dentist",
        "location": "London",
        "address": "28 High St, Wimbledon Village, London SW19 5BY",
        "rating": 4.9,
        "reviews": 200,
        "image": "images/clinic5.svg",
        "premium": true,
        "phone": "020 8946 8999",
        "website": "https://www.smilesbyhillside.co.uk",
        "services": [
            "Paediatric dentistry",
            "Smile restoration",
            "Emergency dental"
        ]
    },
    {
        "id": 513,
        "name": "Bodyset – Waterloo",
        "type": "Physio",
        "location": "London",
        "address": "The Cut, Waterloo, London SE1 8LN",
        "rating": 4.7,
        "reviews": 90,
        "image": "images/clinic9.svg",
        "premium": false,
        "phone": "020 7099 7730",
        "website": "https://www.bodyset.co.uk",
        "services": [
            "Performance physio",
            "Injury recovery",
            "Corporate services"
        ]
    },
    {
        "name": "Boots Pharmacy Manchester",
        "type": "Pharmacy",
        "location": "Manchester",
        "address": "Market Street, Manchester M1 1WA",
        "rating": 4.5,
        "reviews": 234,
        "image": "images/pharmacy1.svg",
        "premium": false,
        "phone": "0161 834 5678",
        "website": "https://www.boots.com",
        "services": [
            "Prescription dispensing",
            "Health consultations",
            "Vaccinations",
            "NHS services"
        ]
    },
    {
        "name": "Superdrug Pharmacy Liverpool",
        "type": "Pharmacy",
        "location": "Liverpool",
        "address": "Church Street, Liverpool L1 3AY",
        "rating": 4.3,
        "reviews": 156,
        "image": "images/pharmacy2.svg",
        "premium": false,
        "phone": "0151 709 1234",
        "website": "https://www.superdrug.com",
        "services": [
            "Prescription services",
            "Health advice",
            "Beauty consultations",
            "Travel health"
        ]
    },
    {
        "name": "Lloyds Pharmacy London",
        "type": "Pharmacy",
        "location": "London",
        "address": "Oxford Street, London W1C 1JN",
        "rating": 4.6,
        "reviews": 189,
        "image": "images/pharmacy3.svg",
        "premium": true,
        "phone": "020 7629 5678",
        "website": "https://www.lloydspharmacy.com",
        "services": [
            "Prescription collection",
            "Medicine reviews",
            "Health screenings",
            "Emergency contraception"
        ]
    },
    {
        "id": 514,
        "name": "City GP Clinic",
        "type": "Private GP",
        "location": "Manchester",
        "address": "12 Deansgate, M3 4JL",
        "rating": 4.5,
        "reviews": 224,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0161 000 1234",
        "website": "https://citygp.example.com",
        "description": "City GP Clinic is a professional healthcare provider in Manchester, offering quality medical services to the local community.",
        "services": [
            "General Practice",
            "Private Prescriptions",
            "Same-day Appointments"
        ]
    },
    {
        "id": 515,
        "name": "Smile Dental",
        "type": "Private Dentist",
        "location": "Manchester",
        "address": "22 Oxford Rd, M1 5AN",
        "rating": 4.5,
        "reviews": 50,
        "image": "Smile Dental.jpg",
        "premium": true,
        "phone": "0161 000 5678",
        "website": "https://smiledental.example.com",
        "description": "Smile Dental is a professional healthcare provider in Manchester, offering quality medical services to the local community.",
        "services": [
            "Invisalign",
            "Implants",
            "Hygiene Services"
        ]
    },
    {
        "id": 516,
        "name": "Bolton Physio Centre",
        "type": "Private Physiotherapy",
        "location": "Bolton",
        "address": "5 Market Street, BL1 1AA",
        "rating": 4.5,
        "reviews": 162,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "01204 000 987",
        "website": "https://boltonphysio.example.com",
        "description": "Bolton Physio Centre is a professional healthcare provider in Bolton, offering quality medical services to the local community.",
        "services": [
            "Sports Injury Rehab",
            "Manual Therapy",
            "Exercise Plans"
        ]
    },
    {
        "id": 517,
        "name": "Aesthetic Glow",
        "type": "Private Aesthetics",
        "location": "Liverpool",
        "address": "8 Bold Street, L1 4DS",
        "rating": 4.5,
        "reviews": 158,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0151 000 246",
        "website": "https://aestheticglow.example.com",
        "description": "Aesthetic Glow is a professional healthcare provider in Liverpool, offering quality medical services to the local community.",
        "services": [
            "Botox",
            "Dermal Fillers",
            "Skin Peels"
        ]
    },
    {
        "id": 518,
        "name": "Manchester Medical Centre",
        "type": "Private GP",
        "location": "Manchester",
        "address": "123 Oxford Road, Manchester City Centre, M1 7ED",
        "rating": 4.5,
        "reviews": 152,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "07123456789",
        "website": "https://manchestermedical.example.com",
        "description": "Manchester Medical Centre is a professional healthcare provider in Manchester, offering quality medical services to the local community.",
        "services": [
            "General Practice",
            "Health Checks"
        ]
    },
    {
        "id": 519,
        "name": "Bolton Dental Practice",
        "type": "Private Dentist",
        "location": "Bolton",
        "address": "45 High Street, Bolton Town Centre, BL1 2AB",
        "rating": 4.5,
        "reviews": 153,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "07987654321",
        "website": "https://boltondental.example.com",
        "description": "Bolton Dental Practice is a professional healthcare provider in Bolton, offering quality medical services to the local community.",
        "services": [
            "General Dentistry",
            "Cosmetic Dentistry"
        ]
    },
    {
        "id": 520,
        "name": "Vision Express Manchester",
        "type": "Optician",
        "location": "Manchester",
        "address": "Market Street, Manchester M1 1WA",
        "rating": 4.6,
        "reviews": 189,
        "image": "images/clinic1.svg",
        "premium": true,
        "phone": "0161 834 9876",
        "website": "https://visionexpress.com",
        "description": "Vision Express Manchester is a leading optician providing comprehensive eye care services in the heart of Manchester. Our qualified optometrists offer thorough eye examinations, contact lens fittings, and a wide selection of designer frames to suit every style and budget.",
        "services": [
            "Eye Examinations",
            "Contact Lens Fitting",
            "Designer Frames",
            "Prescription Glasses"
        ]
    },
    {
        "id": 521,
        "name": "Specsavers Liverpool",
        "type": "Optician",
        "location": "Liverpool",
        "address": "Church Street, Liverpool L1 3AY",
        "rating": 4.4,
        "reviews": 267,
        "image": "images/clinic2.svg",
        "premium": false,
        "phone": "0151 709 5432",
        "website": "https://specsavers.co.uk",
        "description": "Specsavers Liverpool offers affordable eye care with professional optometry services. Our experienced team provides comprehensive eye tests, hearing tests, and a vast range of glasses and contact lenses at competitive prices.",
        "services": [
            "Eye Tests",
            "Hearing Tests",
            "Glasses",
            "Contact Lenses"
        ]
    },
    {
        "id": 522,
        "name": "Optical Express London",
        "type": "Private Optician",
        "location": "London",
        "address": "Oxford Street, London W1C 1JN",
        "rating": 4.7,
        "reviews": 324,
        "image": "Optical Express London.jpg",
        "premium": true,
        "phone": "020 7629 8765",
        "website": "https://opticalexpress.co.uk",
        "description": "Optical Express London is a premium eye care clinic specializing in laser eye surgery, advanced eye treatments, and luxury eyewear. Our state-of-the-art facility offers the latest technology in vision correction and comprehensive eye health assessments.",
        "services": [
            "Laser Eye Surgery",
            "Advanced Eye Treatments",
            "Luxury Eyewear",
            "Vision Correction"
        ]
    }
];

// Global variables
let currentFilters = {
    category: 'all',
    location: 'all',
    search: '',
    sortBy: null,
    premium: null
};

// Function to reset filters
function resetFilters() {
    currentFilters = {
        category: 'all',
        location: 'all',
        search: '',
        sortBy: null,
        premium: null
    };
    
    // Reset dropdowns
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) categoryFilter.value = 'all';
    if (locationFilter) locationFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    applyFilters();
}
let currentPage = 1;
const clinicsPerPage = 6;
let filteredClinics = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Handle navbar shrinking on scroll for mobile
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop;
        }
    });
});

async function initializeApp() {
    // Load clinic data from API
    await loadClinicsFromAPI();
    
    setupEventListeners();
    
    // Handle URL parameters for category filtering
    handleURLParameters();
    
    filteredClinics = [...clinicsData];
    applyFilters();
    await updateLocationCounts();
}

// Function to handle URL parameters
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        // Map URL parameter values to filter values
        const categoryMap = {
            'gp': 'Private GP',
            'dentist': 'Private Dentist', 
            'physiotherapy': 'Private Physiotherapy',
            'aesthetics': 'Private Aesthetics',
            'pharmacy': 'Pharmacy'
        };
        
        const filterValue = categoryMap[category.toLowerCase()];
        if (filterValue) {
            currentFilters.category = filterValue;
            
            // Update the category dropdown to reflect the selection
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = filterValue;
            }
        }
    }
}

// Load clinics from API
async function loadClinicsFromAPI() {
    // Show loading status
    showAPIStatus('Loading clinics...', 'info');
    
    try {
        // Only log in development mode
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Attempting to connect to API at:', window.apiService.baseURL);
        }
        
        // Request all clinics with graceful degradation
        const response = await window.apiService.getClinics({ limit: 200 });
        
        // Handle different response formats
        const clinics = response.data || response;
        if (clinics && Array.isArray(clinics) && clinics.length > 0) {
            clinicsData = clinics;
            // Only log success in development mode
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('✅ Loaded', clinics.length, 'clinics from API');
            }
            
            // Show a subtle success indicator for users
            showAPIStatus('Live data loaded', 'success');
        } else {
            // API returned empty data, use fallback
            showAPIStatus('Using sample data', 'info');
        }
    } catch (error) {
        // Handle different types of errors gracefully
        if (error.message === 'BACKEND_UNAVAILABLE') {
            // Backend is unavailable, use fallback data silently
            showAPIStatus('Demo mode', 'offline');
        } else if (error.message === 'timeout') {
            // Timeout occurred, show user-friendly message and fallback
            showAPIStatus('Slow connection - using sample data', 'offline');
        } else {
            // Other errors - still use fallback but show different status
            showAPIStatus('Demo mode', 'offline');
        }
        
        // Only log errors in development mode
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('❌ Failed to load clinics from API, using fallback data:', error.message);
        }
        
        // Keep the existing sample data as fallback - this ensures the app works
        // clinicsData is already populated with sample data from the beginning of the file
    }
}

// Show API connection status to users
function showAPIStatus(message, status) {
    // Don't show status indicator on auth pages to avoid visual clutter
    if (document.body.classList.contains('auth-page')) {
        return;
    }
    
    // Create or update a small status indicator
    let statusIndicator = document.getElementById('api-status-indicator');
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'api-status-indicator';
        statusIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(statusIndicator);
    }
    
    // Set styles based on status
    const styles = {
        success: {
            background: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        info: {
            background: '#cce7ff',
            color: '#004085', 
            border: '1px solid #a6d3ff'
        },
        offline: {
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f1aeb5'
        }
    };
    
    const style = styles[status] || styles.info;
    statusIndicator.style.background = style.background;
    statusIndicator.style.color = style.color;
    statusIndicator.style.border = style.border;
    statusIndicator.textContent = message;
    
    // Auto-hide success messages after 3 seconds
    if (status === 'success') {
        setTimeout(() => {
            if (statusIndicator) {
                statusIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (statusIndicator && statusIndicator.parentNode) {
                        statusIndicator.parentNode.removeChild(statusIndicator);
                    }
                }, 300);
            }
        }, 3000);
    }
}

function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Search input - only handle if AdvancedSearch is not available
    const searchInput = document.getElementById('searchInput');
    if (searchInput && typeof AdvancedSearch === 'undefined') {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Filter dropdowns
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', applyFilters);
    }
}

// Search functionality
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase().trim();
        parseNaturalLanguageQuery(query);
        applyFilters();
        
        // Scroll to results section if search has content
        if (query.length > 0) {
            const clinicGrid = document.getElementById('clinicGrid');
            if (clinicGrid) {
                // Add a small delay to ensure filters are applied first
                setTimeout(() => {
                    clinicGrid.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                }, 100);
            }
        }
    }
}

function handleSearch(event) {
    const query = (event.target.value || '').toLowerCase().trim();
    parseNaturalLanguageQuery(query);
    applyFilters();
}

// Enhanced natural language query parser
function parseNaturalLanguageQuery(query) {
    // If query is empty, reset filters
    if (!query || query.trim() === '') {
        resetFilters();
        applyFilters(); // Re-render clinics to remove highlighting
        return;
    }
    
    // Reset specific filters but keep search term
    currentFilters.search = query;
    currentFilters.sortBy = null;
    currentFilters.premium = null;
    
    // Define patterns for different types of queries
    const patterns = {
        // Location patterns
        location: {
            'in manchester': 'Manchester',
            'in liverpool': 'Liverpool', 
            'in london': 'London',
            'in preston': 'Preston',
            'manchester': 'Manchester',
            'liverpool': 'Liverpool',
            'london': 'London',
            'preston': 'Preston',
            'near me': 'all', // Could be enhanced with geolocation
            'nearby': 'all',
            'close to me': 'all'
        },
        
        // Service type patterns
        serviceType: {
            'gp': 'gp',
            'doctor': 'gp',
            'general practitioner': 'gp',
            'physician': 'gp',
            'medical': 'gp',
            'dentist': 'dentist',
            'dental': 'dentist',
            'teeth': 'dentist',
            'tooth': 'dentist',
            'orthodontist': 'dentist',
            'physio': 'physio',
            'physiotherapy': 'physio',
            'physiotherapist': 'physio',
            'physical therapy': 'physio',
            'rehab': 'physio',
            'rehabilitation': 'physio',
            'sports injury': 'physio',
            'pharmacy': 'pharmacy',
            'chemist': 'pharmacy',
            'pharmacist': 'pharmacy',
            'prescription': 'pharmacy',
            'aesthetic': 'aesthetic',
            'cosmetic': 'aesthetic',
            'beauty': 'aesthetic'
        },
        
        // Service-specific patterns
        services: {
            'same day': ['same-day', 'same day'],
            'emergency': ['emergency'],
            'urgent': ['emergency', 'urgent'],
            'appointment': ['consultation', 'appointment'],
            'consultation': ['consultation'],
            'checkup': ['check-up', 'screening'],
            'check up': ['check-up', 'screening'],
            'screening': ['screening'],
            'vaccination': ['vaccination', 'vaccine'],
            'vaccine': ['vaccination', 'vaccine'],
            'travel': ['travel'],
            'cosmetic': ['cosmetic'],
            'invisalign': ['invisalign'],
            'implant': ['implant'],
            'whitening': ['whitening'],
            'cleaning': ['cleaning', 'hygiene'],
            'massage': ['massage'],
            'acupuncture': ['acupuncture'],
            'pilates': ['pilates'],
            'sports': ['sports'],
            'injury': ['injury'],
            'pain': ['pain'],
            'back pain': ['back pain'],
            'neck pain': ['neck pain']
        }
    };
    
    // Extract location from query
    for (const [pattern, location] of Object.entries(patterns.location)) {
        if (query.includes(pattern)) {
            if (location !== 'all') {
                currentFilters.location = location.toLowerCase();
                // Update location filter dropdown if it exists
                const locationFilter = document.getElementById('locationFilter');
                if (locationFilter) {
                    locationFilter.value = location.toLowerCase();
                }
            }
            break;
        }
    }
    
    // Extract service type from query
    for (const [pattern, serviceType] of Object.entries(patterns.serviceType)) {
        if (query.includes(pattern)) {
            currentFilters.category = serviceType;
            // Update category filter dropdown if it exists
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = serviceType;
            }
            break;
        }
    }
    
    // Handle complex queries like "dentist in manchester"
    const complexPatterns = [
        {
            regex: /(gp|doctor|medical|physician)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'gp'
        },
        {
            regex: /(dentist|dental)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'dentist'
        },
        {
            regex: /(physio|physiotherapy|rehab)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'physio'
        },
        {
            regex: /(pharmacy|chemist)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'pharmacy'
        }
    ];
    
    for (const pattern of complexPatterns) {
        const match = query.match(pattern.regex);
        if (match) {
            currentFilters.category = pattern.type;
            const location = match[3];
            currentFilters.location = location.toLowerCase();
            
            // Update dropdowns
            const categoryFilter = document.getElementById('categoryFilter');
            const locationFilter = document.getElementById('locationFilter');
            if (categoryFilter) categoryFilter.value = pattern.type;
            if (locationFilter) locationFilter.value = location.toLowerCase();
            break;
        }
    }
    
    // Handle "near me" queries with geolocation (placeholder for future enhancement)
    if (query.includes('near me') || query.includes('nearby') || query.includes('close to me')) {
        // For now, show all locations. Could be enhanced with geolocation API
        currentFilters.location = 'all';
        const locationFilter = document.getElementById('locationFilter');
        if (locationFilter) locationFilter.value = 'all';
    }
    
    // Handle rating-based queries
    if (query.includes('best') || query.includes('top rated') || query.includes('highest rated')) {
        // This will be handled in the enhanced applyFilters function
        currentFilters.sortBy = 'rating';
    }
    
    // Handle premium/private queries
    if (query.includes('private') || query.includes('premium')) {
        currentFilters.premium = true;
    }
    
    // Handle NHS queries
    if (query.includes('nhs') || query.includes('free')) {
        currentFilters.premium = false;
    }
}

// Filter functions
function filterByCategory(category) {
    currentFilters.category = category;
    
    // Update UI
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Update dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
    
    applyFilters();
    
    // Scroll to locations section
    const locationsSection = document.querySelector('.locations');
    if (locationsSection) {
        setTimeout(() => {
            locationsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    }
}

function filterByLocation(location) {
    currentFilters.location = location;
    
    // Update UI
    document.querySelectorAll('.location-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-location="${location}"]`).classList.add('active');
    
    // Update dropdown
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.value = location;
    }
    
    applyFilters();
    
    // Scroll to featured clinics section
    const featuredClinicsSection = document.querySelector('.featured-clinics');
    if (featuredClinicsSection) {
        setTimeout(() => {
            featuredClinicsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    }
}

function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    
    // Always update from dropdowns if they exist (allows manual filter changes to override search)
    if (categoryFilter) {
        currentFilters.category = categoryFilter.value;
    }
    
    if (locationFilter) {
        currentFilters.location = locationFilter.value;
    }
    
    filteredClinics = clinicsData.filter(clinic => {
        // Map filter categories to clinic types with enhanced matching
        let matchesCategory = currentFilters.category === 'all' || !currentFilters.category;
        if (!matchesCategory) {
            const categoryMap = {
                'gp': ['GP', 'Private GP'],
                'dentist': ['Dentist', 'Private Dentist'], 
                'physio': ['Physio', 'Private Physiotherapy'],
                'optician': ['Optician', 'Private Optician'],
                'pharmacy': ['Pharmacy']
            };
            const allowedTypes = categoryMap[currentFilters.category] || [];
            matchesCategory = allowedTypes.some(type => 
                (clinic.type || '').toLowerCase().includes(type.toLowerCase())
            );
        }
        
        // Enhanced location matching
        const matchesLocation = currentFilters.location === 'all' || 
            !currentFilters.location || 
            (clinic.city || clinic.location || '').toLowerCase() === currentFilters.location.toLowerCase();
        
        // Enhanced search matching with better natural language support
        let matchesSearch = currentFilters.search === '' || !currentFilters.search;
        if (!matchesSearch) {
            const searchTerms = currentFilters.search.toLowerCase();
            
            // Basic field matching
            const basicMatch = 
                (clinic.name || '').toLowerCase().includes(searchTerms) ||
                (clinic.type || '').toLowerCase().includes(searchTerms) ||
                (clinic.city || clinic.location || '').toLowerCase().includes(searchTerms) ||
                (clinic.address || '').toLowerCase().includes(searchTerms) ||
                (clinic.description || '').toLowerCase().includes(searchTerms) ||
                (clinic.services || []).some(service => (service || '').toLowerCase().includes(searchTerms));
            
            // Enhanced service matching for natural language
            const serviceKeywords = {
                'same day': ['same-day', 'same day', 'urgent', 'immediate'],
                'emergency': ['emergency', 'urgent', 'immediate'],
                'private': ['private'],
                'nhs': ['nhs'],
                'consultation': ['consultation', 'appointment'],
                'screening': ['screening', 'check-up', 'health check'],
                'travel': ['travel'],
                'cosmetic': ['cosmetic', 'aesthetic'],
                'sports': ['sports', 'injury'],
                'dental implants': ['implant'],
                'invisalign': ['invisalign'],
                'teeth whitening': ['whitening'],
                'physiotherapy': ['physio', 'rehabilitation', 'rehab'],
                'massage': ['massage'],
                'acupuncture': ['acupuncture'],
                'pilates': ['pilates']
            };
            
            let enhancedMatch = false;
            for (const [keyword, variations] of Object.entries(serviceKeywords)) {
                if (variations.some(variation => searchTerms.includes(variation))) {
                    enhancedMatch = clinic.services.some(service => 
                        service.toLowerCase().includes(keyword) ||
                        variations.some(v => service.toLowerCase().includes(v))
                    );
                    if (enhancedMatch) break;
                }
            }
            
            matchesSearch = basicMatch || enhancedMatch;
        }
        
        // Premium/Private filter
        let matchesPremium = true;
        if (currentFilters.premium === true) {
            matchesPremium = clinic.premium === true;
        } else if (currentFilters.premium === false) {
            matchesPremium = clinic.premium === false || !clinic.premium;
        }
        
        return matchesCategory && matchesLocation && matchesSearch && matchesPremium;
    });
    
    // Apply sorting - default to premium first, then rating, then name
    if (currentFilters.sortBy === 'rating') {
        filteredClinics.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (currentFilters.sortBy === 'reviews') {
        filteredClinics.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    } else {
        // Default sorting: premium first, then by rating, then by name
        filteredClinics.sort((a, b) => {
            // First sort by premium status (premium clinics first)
            const aPremium = a.premium || a.is_premium || false;
            const bPremium = b.premium || b.is_premium || false;
            if (aPremium !== bPremium) {
                return bPremium - aPremium; // true (1) comes before false (0)
            }
            
            // Then sort by rating (higher first)
            const aRating = a.rating || 0;
            const bRating = b.rating || 0;
            if (aRating !== bRating) {
                return bRating - aRating;
            }
            
            // Finally sort by name (alphabetical)
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            return aName.localeCompare(bName);
        });
    }
    
    currentPage = 1;
    renderClinics();
}

// Render functions
function renderClinics() {
    const clinicGrid = document.getElementById('clinicGrid');
    if (!clinicGrid) return;
    
    // Log search analytics
    if (currentFilters.search) {
        logSearchQuery(currentFilters.search, filteredClinics.length);
    }
    
    const startIndex = (currentPage - 1) * clinicsPerPage;
    const endIndex = startIndex + clinicsPerPage;
    const clinicsToShow = filteredClinics.slice(startIndex, endIndex);
    
    // Display results count
    const resultsInfo = document.getElementById('resultsInfo');
    if (resultsInfo) {
        const totalResults = filteredClinics.length;
        if (totalResults > 0) {
            const showing = Math.min(endIndex, totalResults);
            resultsInfo.textContent = `Showing ${startIndex + 1}-${showing} of ${totalResults} results`;
            resultsInfo.style.display = 'block';
        } else {
            resultsInfo.style.display = 'none';
        }
    }
    
    clinicGrid.innerHTML = '';
    
    if (clinicsToShow.length === 0) {
        let noResultsMessage = getNoResultsMessage();
        clinicGrid.innerHTML = `
            <div class="no-results">
                <h3>No clinics found</h3>
                <p>${noResultsMessage}</p>
                <button onclick="resetFilters()" class="btn btn-primary">Clear all filters</button>
            </div>
        `;
        return;
    }
    
    clinicsToShow.forEach(clinic => {
        const clinicCard = createClinicCard(clinic);
        
        // Highlight search terms if there's an active search, or remove highlights if search is cleared
        const searchableElements = clinicCard.querySelectorAll('.clinic-name, .clinic-type, .clinic-location, .clinic-services');
        searchableElements.forEach(element => {
            if (element.textContent) {
                if (currentFilters.search) {
                    // Apply highlighting
                    element.innerHTML = highlightSearchTerms(element.textContent, currentFilters.search);
                } else {
                    // Remove any existing highlights by replacing innerHTML with plain text
                    element.innerHTML = element.textContent;
                }
            }
        });
        
        clinicGrid.appendChild(clinicCard);
    });
    
    // Render pagination
    renderPagination();
}

function createClinicCard(clinic) {
    const card = document.createElement('div');
    card.className = 'clinic-card fade-in';
    card.style.cursor = 'pointer';
    
    // Add click event to entire card
    card.addEventListener('click', function(e) {
        // Don't navigate if clicking on action buttons
        if (!e.target.closest('.clinic-actions')) {
            window.location.href = `clinic-profile.html?id=${clinic.frontendId || clinic.id}`;
        }
    });
    
    // Create star rating with actual star icons
    const fullStars = Math.floor(clinic.rating);
    const hasHalfStar = clinic.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    // Get type icon for overlay
    const typeIcon = getTypeIcon(clinic.type);
    
    card.innerHTML = `
        <div class="clinic-image-container">
            <img src="${clinic.logoUrl || clinic.image}" 
                 alt="${clinic.name} - ${formatType(clinic.type)} clinic" 
                 class="clinic-image" 
                 loading="lazy"
                 onerror="this.src='images/clinic1.svg'">
            <div class="image-overlay">
                <div class="type-badge">
                    <i class="${typeIcon}"></i>
                    <span>${formatType(clinic.type)}</span>
                </div>
                ${(clinic.premium !== undefined ? clinic.premium : false) ? '<div class="premium-badge-image"><i class="fas fa-crown"></i> Premium</div>' : ''}
            </div>
            <div class="image-gradient"></div>
        </div>
        <div class="clinic-content">
            <div class="clinic-header">
                <div>
                    <h3 class="clinic-name">${clinic.name}</h3>
                    <p class="clinic-type">${formatType(clinic.type)}</p>
                </div>
            </div>
            <p class="clinic-location">${clinic.address}</p>
            <div class="clinic-rating">
                <div class="stars">${starsHTML}</div>
                <span class="rating-text">${clinic.rating}</span>
                <span class="review-count">(${clinic.reviewCount || clinic.reviews} reviews)</span>
            </div>
            <div class="clinic-actions">
                <a href="clinic-profile.html?id=${clinic.id}" class="visit-btn">View Details</a>
                <a href="tel:${clinic.phone}" class="contact-btn">Call Now</a>
            </div>
        </div>
    `;
    
    return card;
}

function formatType(type) {
    const typeMap = {
        'gp': 'General Practitioner',
        'GP': 'General Practitioner',
        'Private GP': 'General Practitioner',
        'dentist': 'Dentist',
        'Dentist': 'Dentist',
        'Private Dentist': 'Dentist',
        'physio': 'Physiotherapist',
        'Physio': 'Physiotherapist',
        'Private Physiotherapy': 'Physiotherapist',
        'aesthetic': 'Aesthetic Clinic'
    };
    return typeMap[type] || type;
}

function getTypeIcon(type) {
    const iconMap = {
        'gp': 'fas fa-stethoscope',
        'GP': 'fas fa-stethoscope',
        'Private GP': 'fas fa-stethoscope',
        'dentist': 'fas fa-tooth',
        'Dentist': 'fas fa-tooth',
        'Private Dentist': 'fas fa-tooth',
        'physio': 'fas fa-dumbbell',
        'Physio': 'fas fa-dumbbell',
        'Private Physiotherapy': 'fas fa-dumbbell',
        'optician': 'fas fa-eye',
        'Optician': 'fas fa-eye',
        'Private Optician': 'fas fa-eye'
    };
    return iconMap[type] || 'fas fa-hospital';
}

function goToPage(page) {
    currentPage = page;
    renderClinics();
    
    // Scroll to top of clinic results
    const clinicGrid = document.getElementById('clinicGrid');
    if (clinicGrid) {
        clinicGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderPagination() {
    const paginationControls = document.getElementById('paginationControls');
    if (!paginationControls) return;
    
    const totalPages = Math.ceil(filteredClinics.length / clinicsPerPage);
    
    if (totalPages <= 1) {
        paginationControls.innerHTML = '';
        return;
    }
    
    const maxVisiblePages = 5; // Maximum number of page buttons to show
    let paginationHTML = '';
    
    // Calculate the range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})">&laquo; Previous</button>`;
    }
    
    // First page and ellipsis if needed
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" onclick="goToPage(${i})">${i}</button>`;
        }
    }
    
    // Last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})">Next &raquo;</button>`;
    }
    
    paginationControls.innerHTML = paginationHTML;
}

async function updateLocationCounts() {
    const locations = [
        { key: 'manchester', city: 'Manchester' },
        { key: 'bolton', city: 'Bolton' },
        { key: 'liverpool', city: 'Liverpool' },
        { key: 'leeds', city: 'Leeds' },
        { key: 'glasgow', city: 'Glasgow' },
        { key: 'birmingham', city: 'Birmingham' },
        { key: 'london', city: 'London' }
    ];
    
    // Check if backend is healthy before making requests
    const isBackendHealthy = await window.apiService.isBackendHealthy();
    
    // Update total count for 'All Locations'
    try {
        let totalCount;
        if (isBackendHealthy) {
            const totalData = await window.apiService.getClinics({ limit: 1000 });
            totalCount = totalData.pagination?.total || totalData.data?.length || 0;
        } else {
            // Use fallback data when backend is not healthy
            totalCount = clinicsData.length;
        }
        
        const totalCountElement = document.querySelector('[data-location="all"] .clinic-count');
        if (totalCountElement) {
            totalCountElement.textContent = `${totalCount} clinics`;
        }
        
        // Also update mobile dropdown
        const mobileAllOption = document.querySelector('.mobile-location-select option[value="all"]');
        if (mobileAllOption) {
            mobileAllOption.textContent = `All Locations (${totalCount} clinics)`;
        }
    } catch (error) {
        // Only log errors if we expected the backend to be healthy
        if (isBackendHealthy) {
            console.warn('Error fetching total clinic count, using fallback data:', error.message);
        }
        // Use local fallback data
        const totalCount = clinicsData.length;
        const totalCountElement = document.querySelector('[data-location="all"] .clinic-count');
        if (totalCountElement) {
            totalCountElement.textContent = `${totalCount} clinics`;
        }
        
        const mobileAllOption = document.querySelector('.mobile-location-select option[value="all"]');
        if (mobileAllOption) {
            mobileAllOption.textContent = `All Locations (${totalCount} clinics)`;
        }
    }
    
    // Update individual location counts
    for (const location of locations) {
        try {
            let count;
            if (isBackendHealthy) {
                const data = await window.apiService.getClinics({ city: location.city, limit: 1000 });
                count = data.pagination?.total || data.data?.length || 0;
            } else {
                // Use fallback data when backend is not healthy
                count = clinicsData.filter(clinic => 
                    clinic.location && clinic.location.toLowerCase() === location.city.toLowerCase()
                ).length;
            }
            
            const countElement = document.querySelector(`[data-location="${location.key}"] .clinic-count`);
            if (countElement) {
                countElement.textContent = `${count} ${count === 1 ? 'clinic' : 'clinics'}`;
            }
            
            // Also update mobile dropdown
            const mobileOption = document.querySelector(`.mobile-location-select option[value="${location.key}"]`);
            if (mobileOption) {
                mobileOption.textContent = `${location.city} (${count} ${count === 1 ? 'clinic' : 'clinics'})`;
            }
        } catch (error) {
            // Only log errors if we expected the backend to be healthy
            if (isBackendHealthy) {
                console.warn(`Error fetching clinic count for ${location.city}, using fallback data:`, error.message);
            }
            // Use local fallback data
            const count = clinicsData.filter(clinic => 
                clinic.location && clinic.location.toLowerCase() === location.city.toLowerCase()
            ).length;
            
            const countElement = document.querySelector(`[data-location="${location.key}"] .clinic-count`);
            if (countElement) {
                countElement.textContent = `${count} ${count === 1 ? 'clinic' : 'clinics'}`;
            }
            
            // Also update mobile dropdown  
            const mobileOption = document.querySelector(`.mobile-location-select option[value="${location.key}"]`);
            if (mobileOption) {
                mobileOption.textContent = `${location.city} (${count} ${count === 1 ? 'clinic' : 'clinics'})`;
            }
        }
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Smooth scrolling for same-page anchor links only
document.querySelectorAll('a[href^="#"]:not([href*=".html"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        // Only proceed if href is not just '#' and contains a valid selector
        if (href && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = '#ffffff';
            navbar.style.backdropFilter = 'none';
        }
    }
});

// Handle hash navigation on page load
function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash) {
        const target = document.querySelector(hash);
        if (target) {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }
}

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe elements for animation and handle hash navigation
document.addEventListener('DOMContentLoaded', function() {
    const elementsToAnimate = document.querySelectorAll('.category-btn, .location-btn, .clinic-card');
    elementsToAnimate.forEach(el => observer.observe(el));
    
    // Handle hash navigation after page loads
    handleHashNavigation();
});

// Also handle hash changes (for single page navigation)
window.addEventListener('hashchange', handleHashNavigation);

// Hero animations are handled by CSS
// No additional JavaScript needed for the new hero design

// Export functions and data for global access
// Export functions to global scope
window.performSearch = performSearch;
window.filterByCategory = filterByCategory;
window.filterByLocation = filterByLocation;
window.applyFilters = applyFilters;
window.goToPage = goToPage;
window.clinicsData = clinicsData;
window.resetFilters = resetFilters;
window.parseNaturalLanguageQuery = parseNaturalLanguageQuery;

// Search suggestions function
function getSearchSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    // Location suggestions
    const locations = ['Manchester', 'Liverpool', 'London', 'Preston'];
    locations.forEach(location => {
        if (location.toLowerCase().includes(lowerQuery)) {
            suggestions.push(location);
        }
    });
    
    // Service type suggestions
    const serviceTypes = ['GP', 'Dentist', 'Physiotherapy', 'Pharmacy', 'Aesthetic'];
    serviceTypes.forEach(type => {
        if (type.toLowerCase().includes(lowerQuery)) {
            suggestions.push(type);
        }
    });
    
    // Common search patterns
    const commonSearches = [
        'dentist in manchester',
        'gp near me',
        'physio in liverpool',
        'pharmacy in london',
        'private gp',
        'same day appointment',
        'emergency dentist',
        'sports injury physio',
        'cosmetic dentistry',
        'travel vaccination'
    ];
    
    commonSearches.forEach(search => {
        if (search.includes(lowerQuery)) {
            suggestions.push(search);
        }
    });
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
}

// Function to highlight search terms in results
function highlightSearchTerms(text, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Function to get search analytics (for future enhancement)
function logSearchQuery(query, resultsCount) {
    // This could be enhanced to send analytics to a backend service
    console.log(`Search: "${query}" returned ${resultsCount} results`);
}

// Get contextual no results message
function getNoResultsMessage() {
    const { search, category, location, premium } = currentFilters;
    
    if (search && search.trim()) {
        if (location !== 'all' && category !== 'all') {
            return `No ${category.toLowerCase()} found for "${search}" in ${location}. Try expanding your search area or adjusting your criteria.`;
        } else if (location !== 'all') {
            return `No results found for "${search}" in ${location}. Try searching in nearby areas or adjusting your search terms.`;
        } else if (category !== 'all') {
            return `No ${category.toLowerCase()} found for "${search}". Try different search terms or browse all categories.`;
        } else {
            return `No results found for "${search}". Try different keywords, check spelling, or browse our categories.`;
        }
    } else if (location !== 'all' && category !== 'all') {
        return `No ${category.toLowerCase()} available in ${location}. Try expanding to nearby areas.`;
    } else if (location !== 'all') {
        return `No clinics found in ${location}. Try selecting a different location.`;
    } else if (category !== 'all') {
        return `No ${category.toLowerCase()} currently available. Try browsing other categories.`;
    } else if (premium !== null) {
        return premium ? 'No premium clinics match your criteria.' : 'No NHS/standard clinics match your criteria.';
    } else {
        return 'No clinics found. Please try adjusting your search criteria or filters.';
    }
}

// Rotating Text Animation
function initRotatingText() {
    const rotatingText = document.getElementById('rotating-text');
    if (!rotatingText) return;
    
    const words = ['Medical Care', 'GPs', 'Dentists', 'Physios', 'Pharmacies'];
    let currentIndex = 1;
    let isAnimating = false;
    
    function rotateText() {
        if (isAnimating) return;
        isAnimating = true;
        
        // Start fade-out animation
        rotatingText.classList.add('text-fade-out');
        
        setTimeout(() => {
            // Add shimmer effect during text change
            rotatingText.classList.add('changing');
            
            setTimeout(() => {
                // Change the text
                rotatingText.textContent = words[currentIndex];
                
                // Remove fade-out and changing classes
                rotatingText.classList.remove('text-fade-out', 'changing');
                
                // Add fade-in animation
                rotatingText.classList.add('text-fade-in');
                
                // Move to next word
                currentIndex = (currentIndex + 1) % words.length;
                
                // Clean up after fade-in completes
                setTimeout(() => {
                    rotatingText.classList.remove('text-fade-in');
                    isAnimating = false;
                }, 600);
            }, 200);
        }, 400);
    }
    
    // Start rotation after initial delay
    setTimeout(() => {
        rotateText();
        // Continue rotating every 3 seconds for smoother experience
        setInterval(rotateText, 3000);
    }, 3000);
}

// Initialize rotating text when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRotatingText);
} else {
    initRotatingText();
}
window.currentFilters = currentFilters;

// Stakeholder Mode Functionality
function initStakeholderMode() {
    // Check for stakeholder parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const isStakeholder = urlParams.get('stakeholder') === 'true' || 
                         localStorage.getItem('stakeholderMode') === 'true';
    
    if (isStakeholder) {
        document.body.classList.add('stakeholder');
        // Store stakeholder mode in localStorage for persistence
        localStorage.setItem('stakeholderMode', 'true');
    }
    
    // Add keyboard shortcut (Ctrl+Shift+S) to toggle stakeholder mode
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            toggleStakeholderMode();
        }
    });
}

function toggleStakeholderMode() {
    const isCurrentlyStakeholder = document.body.classList.contains('stakeholder');
    
    if (isCurrentlyStakeholder) {
        document.body.classList.remove('stakeholder');
        localStorage.setItem('stakeholderMode', 'false');
        console.log('Stakeholder mode disabled');
    } else {
        document.body.classList.add('stakeholder');
        localStorage.setItem('stakeholderMode', 'true');
        console.log('Stakeholder mode enabled');
    }
}

// Initialize stakeholder mode when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStakeholderMode);
} else {
    initStakeholderMode();
}

// Share clinic function
function shareClinic() {
    const clinicName = document.getElementById('clinicName')?.textContent || 'Clinic';
    const url = window.location.href;
    const title = `${clinicName} - CareGrid`;
    const text = `Check out ${clinicName} on CareGrid - Your trusted healthcare directory`;
    
    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).then(() => {
            console.log('Clinic shared successfully');
        }).catch((error) => {
            console.log('Error sharing clinic:', error);
            fallbackShare(url, title, text);
        });
    } else {
        fallbackShare(url, title, text);
    }
}

// Fallback share function for browsers without Web Share API
function fallbackShare(url, title, text) {
    // Try to copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('Clinic link copied to clipboard!');
        }).catch(() => {
            // If clipboard fails, show a modal with the link
            showShareModal(url, title, text);
        });
    } else {
        showShareModal(url, title, text);
    }
}

// Show share modal with social media options
function showShareModal(url, title, text) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);
    
    const shareOptions = [
        {
            name: 'Facebook',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            icon: 'fab fa-facebook-f'
        },
        {
            name: 'Twitter',
            url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            icon: 'fab fa-twitter'
        },
        {
            name: 'LinkedIn',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            icon: 'fab fa-linkedin-in'
        },
        {
            name: 'WhatsApp',
            url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
            icon: 'fab fa-whatsapp'
        },
        {
            name: 'Email',
            url: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
            icon: 'fas fa-envelope'
        }
    ];
    
    let modalHtml = `
        <div id="shareModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%;">
                <h3 style="margin-top: 0; text-align: center; color: #333;">Share Clinic</h3>
                <div style="margin: 20px 0;">
                    <input type="text" value="${url}" readonly style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;" onclick="this.select()">
                    <button onclick="copyToClipboard('${url}')" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; margin-bottom: 15px; cursor: pointer;">Copy Link</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 10px; margin: 20px 0;">
    `;
    
    shareOptions.forEach(option => {
        modalHtml += `
            <a href="${option.url}" target="_blank" style="display: flex; flex-direction: column; align-items: center; padding: 10px; text-decoration: none; color: #333; border: 1px solid #ddd; border-radius: 5px; transition: background 0.3s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                <i class="${option.icon}" style="font-size: 20px; margin-bottom: 5px;"></i>
                <span style="font-size: 12px;">${option.name}</span>
            </a>
        `;
    });
    
    modalHtml += `
                </div>
                <button onclick="closeShareModal()" style="width: 100%; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Copy to clipboard function
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
    }
}

// Close share modal
function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.remove();
    }
}

// Get Directions functionality
function getDirections(address) {
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);
    
    // Check if geolocation is available
    if ('geolocation' in navigator) {
        // Request user's current location
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // Success: Got user's location
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                openMapsWithLocation(encodedAddress, userLat, userLng);
            },
            function(error) {
                // Error or permission denied: Fall back to destination-only directions
                console.log('Geolocation error:', error.message);
                openMapsWithoutLocation(encodedAddress);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    } else {
        // Geolocation not supported: Fall back to destination-only directions
        openMapsWithoutLocation(encodedAddress);
    }
}

function openMapsWithLocation(encodedAddress, userLat, userLng) {
    // Check if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Try to open in native maps app with current location as start point
        const mapsUrl = `maps://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${encodedAddress}`;
        const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${encodedAddress}`;
        
        // Try native app first, fallback to web
        window.location.href = mapsUrl;
        
        // Fallback to Google Maps web after a short delay
        setTimeout(() => {
            window.open(googleMapsUrl, '_blank');
        }, 1000);
    } else {
        // Desktop: Open Google Maps in new tab with directions from current location
        const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${encodedAddress}`;
        window.open(googleMapsUrl, '_blank');
    }
}

function openMapsWithoutLocation(encodedAddress) {
    // Check if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Try to open in native maps app first, fallback to Google Maps web
        const mapsUrl = `maps://maps.google.com/maps?daddr=${encodedAddress}`;
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        
        // Create a temporary link to test if maps:// protocol is supported
        const tempLink = document.createElement('a');
        tempLink.href = mapsUrl;
        
        // Try native app, fallback to web
        window.location.href = mapsUrl;
        
        // Fallback to Google Maps web after a short delay
        setTimeout(() => {
            window.open(googleMapsUrl, '_blank');
        }, 1000);
    } else {
        // Desktop: Open Google Maps in new tab
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        window.open(googleMapsUrl, '_blank');
    }
}

// Navbar Authentication State Management
function updateNavbarAuthState() {
    const authNavItem = document.getElementById('authNavItem');
    const userNavItem = document.getElementById('userNavItem');
    const userName = document.getElementById('userName');
    
    if (window.authSystem && window.authSystem.isAuthenticated()) {
        const currentUser = window.authSystem.getCurrentUser();
        
        if (authNavItem) authNavItem.style.display = 'none';
        if (userNavItem) userNavItem.style.display = 'block';
        
        if (userName && currentUser) {
            const firstName = currentUser.firstName || currentUser.name || 'User';
            const title = currentUser.role === 'doctor' ? 'Dr.' : '';
            userName.textContent = `${title} ${firstName}`.trim();
        }
    } else {
        if (authNavItem) authNavItem.style.display = 'block';
        if (userNavItem) userNavItem.style.display = 'none';
    }
}

// Enhanced logout function
function logout() {
    if (window.authSystem) {
        window.authSystem.logout();
    } else {
        // Fallback logout
        localStorage.removeItem('careGridCurrentUser');
        sessionStorage.removeItem('careGridCurrentUser');
        localStorage.removeItem('careGridToken');
        window.location.href = 'index.html';
    }
}

// Check authentication state on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for auth system to initialize
    setTimeout(() => {
        updateNavbarAuthState();
    }, 100);
});

// Update navbar when auth state changes
window.addEventListener('authStateChanged', updateNavbarAuthState);