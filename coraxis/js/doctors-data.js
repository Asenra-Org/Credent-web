/**
 * MediPulse Smart Hospital - Doctors & Departments Dataset
 */

const DEPARTMENTS = [
    { id: 'all', name: 'All Specialties', icon: 'fa-user-md' },
    { id: 'cardiology', name: 'Cardiology', icon: 'fa-heartbeat' },
    { id: 'neurology', name: 'Neurology', icon: 'fa-brain' },
    { id: 'orthopedics', name: 'Orthopedics', icon: 'fa-bone' },
    { id: 'dermatology', name: 'Dermatology', icon: 'fa-allergies' },
    { id: 'pediatrics', name: 'Pediatrics', icon: 'fa-baby' },
    { id: 'general', name: 'General Medicine', icon: 'fa-stethoscope' },
    { id: 'ophthalmology', name: 'Ophthalmology', icon: 'fa-eye' }
];

const SYMPTOM_RULES = [
    {
        keywords: ['chest pain', 'palpitations', 'breathlessness', 'high blood pressure', 'heart rate'],
        departmentId: 'cardiology',
        departmentName: 'Cardiology',
        urgency: 'high',
        urgencyLabel: 'Urgent / Priority Care',
        recommendation: 'We strongly recommend consulting a Cardiologist. If chest pain is severe or radiating to arms, please seek immediate emergency care.'
    },
    {
        keywords: ['headache', 'dizziness', 'numbness', 'seizure', 'memory loss', 'migraine', 'tremor'],
        departmentId: 'neurology',
        departmentName: 'Neurology',
        urgency: 'medium',
        urgencyLabel: 'Specialist Consultation Required',
        recommendation: 'A Neurologist can perform a detailed neurological evaluation for persistent headaches, dizziness, or tingling sensations.'
    },
    {
        keywords: ['joint pain', 'back pain', 'fracture', 'knee stiffness', 'swelling', 'bone ache', 'muscle strain'],
        departmentId: 'orthopedics',
        departmentName: 'Orthopedics',
        urgency: 'medium',
        urgencyLabel: 'Specialist Consultation Required',
        recommendation: 'Our Orthopedic specialists treat joint issues, spinal discomfort, bone injuries, and sports mobility problems.'
    },
    {
        keywords: ['skin rash', 'acne', 'itching', 'eczema', 'hair loss', 'skin spots', 'allergy'],
        departmentId: 'dermatology',
        departmentName: 'Dermatology',
        urgency: 'low',
        urgencyLabel: 'Routine Specialist Care',
        recommendation: 'Book a consultation with a Dermatologist for clinical skin diagnosis, allergy patch testing, or cosmetic skin treatment.'
    },
    {
        keywords: ['fever', 'cough', 'cold', 'fatigue', 'body ache', 'sore throat', 'flu', 'weakness'],
        departmentId: 'general',
        departmentName: 'General Medicine',
        urgency: 'low',
        urgencyLabel: 'Primary Care Consultation',
        recommendation: 'General Physicians can diagnose common viral infections, seasonal flu, fever, general weakness, and preventive health checks.'
    },
    {
        keywords: ['child fever', 'infant cough', 'pediatric growth', 'vaccination', 'childhood rash'],
        departmentId: 'pediatrics',
        departmentName: 'Pediatrics',
        urgency: 'medium',
        urgencyLabel: 'Pediatric Care',
        recommendation: 'Consult our experienced Pediatricians for infant health, developmental tracking, and child fever management.'
    },
    {
        keywords: ['blurred vision', 'eye pain', 'dry eyes', 'red eyes', 'cataract', 'vision problem'],
        departmentId: 'ophthalmology',
        departmentName: 'Ophthalmology',
        urgency: 'medium',
        urgencyLabel: 'Eye Specialist Care',
        recommendation: 'Visit an Ophthalmologist for vision tests, intraocular pressure checks, and comprehensive eye health screening.'
    }
];

const INITIAL_DOCTORS = [
    {
        id: 'doc-101',
        name: 'Dr. Sarah Jenkins',
        title: 'MD, DM (Cardiology), FACC',
        departmentId: 'cardiology',
        departmentName: 'Cardiology',
        experienceYears: 14,
        rating: 4.9,
        reviewsCount: 184,
        consultationFee: 75,
        location: 'Block A, 3rd Floor - Room 304',
        type: 'In-person & Video',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        slots: {
            morning: ['09:00 AM', '09:30 AM', '10:15 AM', '11:00 AM'],
            afternoon: ['02:00 PM', '02:45 PM', '03:30 PM'],
            evening: ['05:00 PM', '05:45 PM', '06:30 PM']
        },
        bio: 'Senior Cardiologist specializing in interventional cardiology, heart rhythm disorders, and preventive cardiac wellness.'
    },
    {
        id: 'doc-102',
        name: 'Dr. Robert Chen',
        title: 'MD (Neurology), PhD',
        departmentId: 'neurology',
        departmentName: 'Neurology',
        experienceYears: 18,
        rating: 4.8,
        reviewsCount: 210,
        consultationFee: 85,
        location: 'Block B, 2nd Floor - Room 212',
        type: 'In-person Only',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
        availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
        slots: {
            morning: ['09:30 AM', '10:30 AM', '11:30 AM'],
            afternoon: ['01:30 PM', '02:30 PM', '04:00 PM'],
            evening: ['05:30 PM', '06:15 PM']
        },
        bio: 'Expert in clinical neurology, migraine management, stroke rehabilitation, and neuro-diagnostic imaging.'
    },
    {
        id: 'doc-103',
        name: 'Dr. Elena Rostova',
        title: 'MS (Orthopedics), M.Ch',
        departmentId: 'orthopedics',
        departmentName: 'Orthopedics',
        experienceYears: 12,
        rating: 4.9,
        reviewsCount: 156,
        consultationFee: 70,
        location: 'Block A, 1st Floor - Room 108',
        type: 'In-person & Video',
        avatar: 'https://images.unsplash.com/photo-1594824813566-788536757053?auto=format&fit=crop&w=300&q=80',
        availableDays: ['Tue', 'Thu', 'Fri', 'Sat'],
        slots: {
            morning: ['10:00 AM', '10:45 AM', '11:30 AM'],
            afternoon: ['02:00 PM', '03:15 PM', '04:00 PM'],
            evening: ['05:00 PM', '06:00 PM']
        },
        bio: 'Specialist in knee joint arthroscopy, joint replacement surgery, spinal alignment, and sports injury recovery.'
    },
    {
        id: 'doc-104',
        name: 'Dr. Marcus Vance',
        title: 'MD (Dermatology, Venereology)',
        departmentId: 'dermatology',
        departmentName: 'Dermatology',
        experienceYears: 9,
        rating: 4.7,
        reviewsCount: 128,
        consultationFee: 60,
        location: 'Block C, 4th Floor - Room 401',
        type: 'In-person & Video',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat'],
        slots: {
            morning: ['09:15 AM', '10:00 AM', '11:15 AM'],
            afternoon: ['01:45 PM', '02:30 PM', '03:45 PM'],
            evening: ['04:30 PM', '05:30 PM']
        },
        bio: 'Clinical dermatologist focused on acne therapy, eczema care, laser dermatology, and allergy diagnostics.'
    },
    {
        id: 'doc-105',
        name: 'Dr. Aisha Patel',
        title: 'MD (Internal Medicine)',
        departmentId: 'general',
        departmentName: 'General Medicine',
        experienceYears: 11,
        rating: 4.9,
        reviewsCount: 310,
        consultationFee: 50,
        location: 'Block A, Ground Floor - Room 015',
        type: 'In-person & Video',
        avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=300&q=80',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        slots: {
            morning: ['08:30 AM', '09:15 AM', '10:00 AM', '11:00 AM'],
            afternoon: ['01:30 PM', '02:15 PM', '03:30 PM'],
            evening: ['05:00 PM', '06:00 PM', '07:00 PM']
        },
        bio: 'Comprehensive internal medicine consultant specializing in chronic diabetes management, hypertension, and routine adult health screenings.'
    },
    {
        id: 'doc-106',
        name: 'Dr. David Miller',
        title: 'MD (Pediatrics), DCH',
        departmentId: 'pediatrics',
        departmentName: 'Pediatrics',
        experienceYears: 15,
        rating: 4.8,
        reviewsCount: 195,
        consultationFee: 65,
        location: 'Block B, 1st Floor - Children Wing Room 102',
        type: 'In-person Only',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80',
        availableDays: ['Mon', 'Wed', 'Thu', 'Fri'],
        slots: {
            morning: ['09:00 AM', '10:00 AM', '11:15 AM'],
            afternoon: ['02:00 PM', '03:00 PM', '04:15 PM'],
            evening: ['05:15 PM', '06:30 PM']
        },
        bio: 'Pediatric care expert providing compassionate newborn health checks, immunization plans, and pediatric emergency consultation.'
    },
    {
        id: 'doc-107',
        name: 'Dr. Sophia Loren',
        title: 'MS (Ophthalmology), FRCS',
        departmentId: 'ophthalmology',
        departmentName: 'Ophthalmology',
        experienceYears: 13,
        rating: 4.9,
        reviewsCount: 142,
        consultationFee: 70,
        location: 'Block C, 2nd Floor - Room 205',
        type: 'In-person & Video',
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80',
        availableDays: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
        slots: {
            morning: ['09:30 AM', '10:30 AM', '11:45 AM'],
            afternoon: ['02:00 PM', '03:15 PM', '04:30 PM'],
            evening: ['05:30 PM', '06:15 PM']
        },
        bio: 'Ophthalmic surgeon specializing in laser vision correction, glaucoma management, and computerized retinal diagnostic scans.'
    }
];

const INITIAL_QUEUE_STATUS = [
    { department: 'Cardiology', activeToken: 'CARD-014', totalWaiting: 3, estWaitMinutes: 18, room: '304' },
    { department: 'General Medicine', activeToken: 'GEN-042', totalWaiting: 6, estWaitMinutes: 12, room: '015' },
    { department: 'Orthopedics', activeToken: 'ORTHO-009', totalWaiting: 2, estWaitMinutes: 25, room: '108' },
    { department: 'Pediatrics', activeToken: 'PED-021', totalWaiting: 4, estWaitMinutes: 15, room: '102' }
];

const SAMPLE_APPOINTMENTS = [
    {
        id: 'MP-8921',
        tokenNumber: 'CARD-018',
        doctorId: 'doc-101',
        doctorName: 'Dr. Sarah Jenkins',
        departmentName: 'Cardiology',
        location: 'Block A, 3rd Floor - Room 304',
        patientName: 'Alexander Hayes',
        patientPhone: '+1 (555) 234-5678',
        patientEmail: 'alex.hayes@example.com',
        patientAge: 38,
        gender: 'Male',
        bloodGroup: 'O+',
        consultationType: 'In-person',
        date: '2026-08-06',
        timeSlot: '10:15 AM',
        reason: 'Routine annual cardiac checkup and BP review.',
        fee: 75,
        status: 'Approved',
        createdAt: '2026-08-01T14:30:00Z'
    },
    {
        id: 'MP-8922',
        tokenNumber: 'NEUR-045',
        doctorId: 'doc-102',
        doctorName: 'Dr. Robert Chen',
        departmentName: 'Neurology',
        location: 'Block B, 2nd Floor - Room 212',
        patientName: 'Emily Watson',
        patientPhone: '+1 (555) 345-6789',
        patientEmail: 'emily.w@example.com',
        patientAge: 42,
        gender: 'Female',
        bloodGroup: 'A+',
        consultationType: 'In-person',
        date: '2026-08-07',
        timeSlot: '02:30 PM',
        reason: 'Severe recurring migraines and aura evaluation.',
        fee: 85,
        status: 'Under Review',
        createdAt: '2026-08-02T09:15:00Z'
    },
    {
        id: 'MP-8923',
        tokenNumber: 'ORTHO-012',
        doctorId: 'doc-103',
        doctorName: 'Dr. Elena Rostova',
        departmentName: 'Orthopedics',
        location: 'Block A, 1st Floor - Room 108',
        patientName: 'Michael Brown',
        patientPhone: '+1 (555) 456-7890',
        patientEmail: 'mbrown@example.com',
        patientAge: 51,
        gender: 'Male',
        bloodGroup: 'B+',
        consultationType: 'Video Consultation',
        date: '2026-08-08',
        timeSlot: '11:30 AM',
        reason: 'Post-op knee ligament follow-up session.',
        fee: 70,
        status: 'Manual',
        createdAt: '2026-07-28T11:00:00Z'
    },
    {
        id: 'MP-8924',
        tokenNumber: 'DERM-029',
        doctorId: 'doc-104',
        doctorName: 'Dr. Marcus Vance',
        departmentName: 'Dermatology',
        location: 'Block C, 4th Floor - Room 401',
        patientName: 'Sophia Martinez',
        patientPhone: '+1 (555) 567-8901',
        patientEmail: 'sophia.m@example.com',
        patientAge: 27,
        gender: 'Female',
        bloodGroup: 'O-',
        consultationType: 'Video Consultation',
        date: '2026-08-09',
        timeSlot: '01:45 PM',
        reason: 'Allergic skin patch test consultation.',
        fee: 60,
        status: 'Rejected',
        createdAt: '2026-07-30T16:20:00Z'
    },
    {
        id: 'MP-8925',
        tokenNumber: 'GEN-088',
        doctorId: 'doc-105',
        doctorName: 'Dr. Aisha Patel',
        departmentName: 'General Medicine',
        location: 'Block A, Ground Floor - Room 015',
        patientName: 'David Miller',
        patientPhone: '+1 (555) 678-9012',
        patientEmail: 'dmiller@example.com',
        patientAge: 63,
        gender: 'Male',
        bloodGroup: 'AB+',
        consultationType: 'In-person',
        date: '2026-08-10',
        timeSlot: '09:15 AM',
        reason: 'Diabetes HbA1c review & cholesterol check.',
        fee: 50,
        status: 'Approved',
        createdAt: '2026-08-03T10:00:00Z'
    },
    {
        id: 'MP-8926',
        tokenNumber: 'OPHT-033',
        doctorId: 'doc-107',
        doctorName: 'Dr. Sophia Loren',
        departmentName: 'Ophthalmology',
        location: 'Block C, 2nd Floor - Room 205',
        patientName: 'Olivia Davis',
        patientPhone: '+1 (555) 789-0123',
        patientEmail: 'olivia.d@example.com',
        patientAge: 31,
        gender: 'Female',
        bloodGroup: 'A-',
        consultationType: 'In-person',
        date: '2026-08-12',
        timeSlot: '03:15 PM',
        reason: 'Routine eye strain & vision acuity check.',
        fee: 70,
        status: 'Under Review',
        createdAt: '2026-08-04T08:45:00Z'
    }
];