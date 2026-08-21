"""Synthetic sample document fixtures for offline testing, demos, and deterministic validation."""

SYNTHETIC_DOCUMENTS = {
    "sample_aadhaar": {
        "id": "doc_synth_001",
        "name": "Synthetic Aadhaar Card (Rajesh Kumar Verma)",
        "doc_type": "identity_card",
        "description": "Synthetic Indian Identity Card with Name, DOB, Gender, Aadhaar Number, and Varanasi Address.",
        "raw_ocr_text": """GOVERNMENT OF INDIA
UNIQUE IDENTIFICATION AUTHORITY OF INDIA
Enrollment No: 1024/50123/09876

To:
Rajesh Kumar Verma
S/O Suresh Chandra Verma
Village Rampur, Post Chakia
District Varanasi, Uttar Pradesh - 221001

Name: Rajesh Kumar Verma
नाम: राजेश कुमार वर्मा
DOB: 14/08/1984
Gender: Male / पुरुष
Aadhaar Number: 4589 1234 8901

मेरा आधार, मेरी पहचान""",
        "deterministic_fields": [
            {
                "field_key": "full_name",
                "label_en": "Full Name",
                "label_hi": "पूरा नाम",
                "value": "Rajesh Kumar Verma",
                "source_text": "Name: Rajesh Kumar Verma",
                "confidence": 0.98,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "father_or_spouse_name",
                "label_en": "Father's Name",
                "label_hi": "पिता का नाम",
                "value": "Suresh Chandra Verma",
                "source_text": "S/O Suresh Chandra Verma",
                "confidence": 0.95,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "date_of_birth",
                "label_en": "Date of Birth",
                "label_hi": "जन्म तिथि",
                "value": "14/08/1984",
                "source_text": "DOB: 14/08/1984",
                "confidence": 0.99,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "gender",
                "label_en": "Gender",
                "label_hi": "लिंग",
                "value": "Male",
                "source_text": "Gender: Male / पुरुष",
                "confidence": 0.99,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "aadhaar_number",
                "label_en": "Aadhaar Number",
                "label_hi": "आधार संख्या",
                "value": "4589 1234 8901",
                "masked_value": "XXXX XXXX 8901",
                "source_text": "Aadhaar Number: 4589 1234 8901",
                "confidence": 0.99,
                "category": "identity",
                "is_sensitive": True,
            },
            {
                "field_key": "state",
                "label_en": "State",
                "label_hi": "राज्य",
                "value": "Uttar Pradesh",
                "source_text": "Uttar Pradesh - 221001",
                "confidence": 0.97,
                "category": "address",
                "is_sensitive": False,
            },
            {
                "field_key": "district",
                "label_en": "District",
                "label_hi": "जिला",
                "value": "Varanasi",
                "source_text": "District Varanasi",
                "confidence": 0.97,
                "category": "address",
                "is_sensitive": False,
            },
            {
                "field_key": "pincode",
                "label_en": "Pincode",
                "label_hi": "पिन कोड",
                "value": "221001",
                "source_text": "221001",
                "confidence": 0.99,
                "category": "address",
                "is_sensitive": False,
            },
            {
                "field_key": "full_address",
                "label_en": "Full Address",
                "label_hi": "पूरा पता",
                "value": "Village Rampur, Post Chakia, District Varanasi, Uttar Pradesh - 221001",
                "source_text": "Village Rampur, Post Chakia\nDistrict Varanasi, Uttar Pradesh - 221001",
                "confidence": 0.95,
                "category": "address",
                "is_sensitive": False,
            },
        ],
    },
    "sample_income_cert": {
        "id": "doc_synth_002",
        "name": "Synthetic Income Certificate (Pramod Kumar)",
        "doc_type": "income_certificate",
        "description": "Synthetic Tehsil Income Certificate showing ₹72,000 annual income.",
        "raw_ocr_text": """GOVERNMENT OF UTTAR PRADESH
REVENUE DEPARTMENT / राजस्व विभाग
INCOME CERTIFICATE / आय प्रमाण पत्र

Certificate Number: INC/2026/88491
Application Number: APP/UP/991204
Date of Issue: 15/04/2026

This is to certify that:
Applicant Name: Pramod Kumar
Father's Name: Ram Prasad
Address: Village Badagaon, Tehsil Soraon, District Prayagraj, UP - 212502

Total Annual Family Income: Rs. 72,000 (Rupees Seventy Two Thousand Only)
कुल वार्षिक पारिवारिक आय: ₹ 72,000

Purpose: Education / Government Scheme Application
Valid Till: 31/03/2029

Issuing Authority: Tehsildar, Soraon, Prayagraj""",
        "deterministic_fields": [
            {
                "field_key": "full_name",
                "label_en": "Applicant Name",
                "label_hi": "आवेदक का नाम",
                "value": "Pramod Kumar",
                "source_text": "Applicant Name: Pramod Kumar",
                "confidence": 0.98,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "father_or_spouse_name",
                "label_en": "Father's Name",
                "label_hi": "पिता का नाम",
                "value": "Ram Prasad",
                "source_text": "Father's Name: Ram Prasad",
                "confidence": 0.96,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "annual_income",
                "label_en": "Annual Income (INR)",
                "label_hi": "वार्षिक आय (रुपये)",
                "value": 72000,
                "source_text": "Total Annual Family Income: Rs. 72,000",
                "confidence": 0.99,
                "category": "income",
                "is_sensitive": False,
            },
            {
                "field_key": "certificate_number",
                "label_en": "Certificate Number",
                "label_hi": "प्रमाण पत्र संख्या",
                "value": "INC/2026/88491",
                "source_text": "Certificate Number: INC/2026/88491",
                "confidence": 0.99,
                "category": "general",
                "is_sensitive": False,
            },
            {
                "field_key": "district",
                "label_en": "District",
                "label_hi": "जिला",
                "value": "Prayagraj",
                "source_text": "District Prayagraj",
                "confidence": 0.97,
                "category": "address",
                "is_sensitive": False,
            },
            {
                "field_key": "state",
                "label_en": "State",
                "label_hi": "राज्य",
                "value": "Uttar Pradesh",
                "source_text": "GOVERNMENT OF UTTAR PRADESH",
                "confidence": 0.98,
                "category": "address",
                "is_sensitive": False,
            },
        ],
    },
    "sample_land_record": {
        "id": "doc_synth_003",
        "name": "Synthetic Land Record / Khatauni (Ramesh Chandra)",
        "doc_type": "land_record",
        "description": "Synthetic Record of Rights showing 1.25 Hectares (3.08 Acres) agricultural land.",
        "raw_ocr_text": """BHULEKH - REVENUE DEPARTMENT, UTTAR PRADESH
KHATAUNI (RECORD OF RIGHTS) / खतौनी (अधिकार अभिलेख)

Fasli Year: 1430-1435
Village: Shivpur (Code: 192834)
Pargana: Kaswar Raja
Tehsil: Sadar, District: Varanasi

Khata Number: 00142
Khasra / Plot Number: 412/1, 412/2
Land Category: Agricultural (कृषि भूमि)

Landholder Name / खातेदार का नाम:
1. Ramesh Chandra S/O Bhagwati Prasad

Total Land Area / कुल क्षेत्रफल: 1.2500 Hectare (3.08 Acres)
Lagaan / Revenue: Rs. 45.00""",
        "deterministic_fields": [
            {
                "field_key": "full_name",
                "label_en": "Landholder Name",
                "label_hi": "खातेदार का नाम",
                "value": "Ramesh Chandra",
                "source_text": "1. Ramesh Chandra S/O Bhagwati Prasad",
                "confidence": 0.98,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "father_or_spouse_name",
                "label_en": "Father's Name",
                "label_hi": "पिता का नाम",
                "value": "Bhagwati Prasad",
                "source_text": "S/O Bhagwati Prasad",
                "confidence": 0.95,
                "category": "identity",
                "is_sensitive": False,
            },
            {
                "field_key": "landholding_acres",
                "label_en": "Landholding (Acres)",
                "label_hi": "भूमि का रकबा (एकड़)",
                "value": 3.08,
                "source_text": "1.2500 Hectare (3.08 Acres)",
                "confidence": 0.99,
                "category": "income",
                "is_sensitive": False,
            },
            {
                "field_key": "khata_number",
                "label_en": "Khata Number",
                "label_hi": "खाता संख्या",
                "value": "00142",
                "source_text": "Khata Number: 00142",
                "confidence": 0.99,
                "category": "general",
                "is_sensitive": False,
            },
            {
                "field_key": "district",
                "label_en": "District",
                "label_hi": "जिला",
                "value": "Varanasi",
                "source_text": "District: Varanasi",
                "confidence": 0.97,
                "category": "address",
                "is_sensitive": False,
            },
        ],
    },
}
