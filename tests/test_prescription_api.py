"""
Backend API Tests for RheumaCare E-Prescription Portal
Tests: Login, CRUD operations, Edit functionality, PDF generation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://doctorrx.preview.emergentagent.com')

# Test credentials
TEST_USERNAME = "doctor"
TEST_PASSWORD = "rheumacare2024"

# Test prescription ID for multi-page PDF testing
MULTIPAGE_PRESCRIPTION_ID = "e84243a9-fb4b-4176-bc50-faf9bead4587"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"] == TEST_USERNAME
        assert len(data["token"]) > 0
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_verify_token(self):
        """Test token verification endpoint"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Verify token
        response = requests.get(f"{BASE_URL}/api/auth/verify", 
                               headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True


class TestPrescriptionCRUD:
    """Prescription CRUD operations tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_prescription(self):
        """Test creating a new prescription"""
        test_op_no = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        prescription_data = {
            "op_no": test_op_no,
            "patient_name": "Test Patient Create",
            "gender": "Male",
            "age": "35",
            "icd_code": "M05.9",
            "vitals": "BP: 120/80, Pulse: 72",
            "diagnosis": "Test Diagnosis",
            "clinical_history": "Test History",
            "drugs": [{
                "drug_name": "WYSOLONE",
                "dosage": "10mg",
                "frequency": "1-0-1",
                "duration": "7",
                "duration_unit": "Days",
                "comments": "After food"
            }],
            "review_after": "2 weeks",
            "advice": "Test advice",
            "lab_tests": "CBC, ESR",
            "doctor_id": "dr_prakashini"
        }
        
        response = requests.post(f"{BASE_URL}/api/prescriptions", 
                                json=prescription_data, 
                                headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["op_no"] == test_op_no
        assert data["patient_name"] == "Test Patient Create"
        assert "id" in data
        
        # Cleanup - delete the test prescription
        requests.delete(f"{BASE_URL}/api/prescriptions/{data['id']}", headers=self.headers)
    
    def test_get_prescription_by_id(self):
        """Test fetching a prescription by ID"""
        response = requests.get(f"{BASE_URL}/api/prescriptions/{MULTIPAGE_PRESCRIPTION_ID}", 
                               headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == MULTIPAGE_PRESCRIPTION_ID
        assert data["op_no"] == "TEST-MULTIPAGE-001"
        assert len(data["drugs"]) == 12  # Should have 12 drugs
    
    def test_get_all_prescriptions(self):
        """Test fetching all prescriptions"""
        response = requests.get(f"{BASE_URL}/api/prescriptions", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_prescriptions_by_op_no(self):
        """Test fetching prescriptions by OP number"""
        response = requests.get(f"{BASE_URL}/api/prescriptions/by-op/TEST-MULTIPAGE-001", 
                               headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "prescriptions" in data
        assert len(data["prescriptions"]) >= 1


class TestEditPrescription:
    """Edit prescription functionality tests - NEW FEATURE"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create test prescription"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test prescription for editing
        self.test_op_no = f"TEST-EDIT-{uuid.uuid4().hex[:8].upper()}"
        prescription_data = {
            "op_no": self.test_op_no,
            "patient_name": "Test Patient Edit",
            "gender": "Female",
            "age": "40",
            "icd_code": "M06.0",
            "vitals": "BP: 110/70",
            "diagnosis": "Original Diagnosis",
            "clinical_history": "Original History",
            "drugs": [{
                "drug_name": "HCQS",
                "dosage": "200mg",
                "frequency": "1-0-1",
                "duration": "30",
                "duration_unit": "Days",
                "comments": "After food"
            }],
            "review_after": "4 weeks",
            "advice": "Original advice",
            "lab_tests": "CBC",
            "doctor_id": "dr_prakashini"
        }
        
        response = requests.post(f"{BASE_URL}/api/prescriptions", 
                                json=prescription_data, 
                                headers=self.headers)
        self.test_prescription_id = response.json()["id"]
    
    def teardown_method(self, method):
        """Cleanup test prescription after each test"""
        try:
            requests.delete(f"{BASE_URL}/api/prescriptions/{self.test_prescription_id}", 
                          headers=self.headers)
        except:
            pass
    
    def test_update_prescription_basic_fields(self):
        """Test updating basic prescription fields via PUT endpoint"""
        update_data = {
            "op_no": self.test_op_no,
            "patient_name": "Updated Patient Name",
            "gender": "Female",
            "age": "41",
            "icd_code": "M06.0",
            "vitals": "BP: 115/75, Pulse: 68",
            "diagnosis": "Updated Diagnosis",
            "clinical_history": "Updated History",
            "drugs": [{
                "drug_name": "HCQS",
                "dosage": "200mg",
                "frequency": "1-0-1",
                "duration": "30",
                "duration_unit": "Days",
                "comments": "After food"
            }],
            "review_after": "6 weeks",
            "advice": "Updated advice",
            "lab_tests": "CBC, ESR",
            "doctor_id": "dr_prakashini"
        }
        
        response = requests.put(f"{BASE_URL}/api/prescriptions/{self.test_prescription_id}", 
                               json=update_data, 
                               headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["patient_name"] == "Updated Patient Name"
        assert data["diagnosis"] == "Updated Diagnosis"
        assert data["age"] == "41"
        assert data["vitals"] == "BP: 115/75, Pulse: 68"
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/prescriptions/{self.test_prescription_id}", 
                                   headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["patient_name"] == "Updated Patient Name"
        assert fetched["diagnosis"] == "Updated Diagnosis"
    
    def test_update_prescription_drugs(self):
        """Test updating prescription drugs"""
        update_data = {
            "op_no": self.test_op_no,
            "patient_name": "Test Patient Edit",
            "gender": "Female",
            "age": "40",
            "icd_code": "M06.0",
            "vitals": "BP: 110/70",
            "diagnosis": "Original Diagnosis",
            "clinical_history": "Original History",
            "drugs": [
                {
                    "drug_name": "HCQS",
                    "dosage": "400mg",  # Changed dosage
                    "frequency": "1-0-0",  # Changed frequency
                    "duration": "60",  # Changed duration
                    "duration_unit": "Days",
                    "comments": "Morning only"
                },
                {
                    "drug_name": "WYSOLONE",  # Added new drug
                    "dosage": "5mg",
                    "frequency": "1-0-1",
                    "duration": "14",
                    "duration_unit": "Days",
                    "comments": "After food"
                }
            ],
            "review_after": "4 weeks",
            "advice": "Original advice",
            "lab_tests": "CBC",
            "doctor_id": "dr_prakashini"
        }
        
        response = requests.put(f"{BASE_URL}/api/prescriptions/{self.test_prescription_id}", 
                               json=update_data, 
                               headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["drugs"]) == 2
        assert data["drugs"][0]["dosage"] == "400mg"
        assert data["drugs"][1]["drug_name"] == "WYSOLONE"
    
    def test_update_prescription_new_fields(self):
        """Test updating new fields: vitals, advice, lab_tests"""
        update_data = {
            "op_no": self.test_op_no,
            "patient_name": "Test Patient Edit",
            "gender": "Female",
            "age": "40",
            "icd_code": "M06.0",
            "vitals": "BP: 130/85, Pulse: 78, Weight: 65kg, SpO2: 99%",
            "diagnosis": "Original Diagnosis",
            "clinical_history": "Original History",
            "drugs": [{
                "drug_name": "HCQS",
                "dosage": "200mg",
                "frequency": "1-0-1",
                "duration": "30",
                "duration_unit": "Days",
                "comments": "After food"
            }],
            "review_after": "4 weeks",
            "advice": "1. Rest well\n2. Avoid cold exposure\n3. Regular exercise",
            "lab_tests": "CBC, ESR, CRP, Uric Acid, LFT, RFT",
            "doctor_id": "dr_prakashini"
        }
        
        response = requests.put(f"{BASE_URL}/api/prescriptions/{self.test_prescription_id}", 
                               json=update_data, 
                               headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "BP: 130/85" in data["vitals"]
        assert "Rest well" in data["advice"]
        assert "CBC, ESR, CRP" in data["lab_tests"]
    
    def test_update_nonexistent_prescription(self):
        """Test updating a prescription that doesn't exist returns 404"""
        fake_id = "nonexistent-id-12345"
        update_data = {
            "op_no": "TEST",
            "patient_name": "Test",
            "diagnosis": "Test",
            "clinical_history": "",
            "drugs": [],
            "review_after": ""
        }
        
        response = requests.put(f"{BASE_URL}/api/prescriptions/{fake_id}", 
                               json=update_data, 
                               headers=self.headers)
        assert response.status_code == 404


class TestPDFGeneration:
    """PDF generation tests including multi-page support"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_pdf_generation_basic(self):
        """Test basic PDF generation returns valid PDF"""
        response = requests.get(f"{BASE_URL}/api/prescriptions/{MULTIPAGE_PRESCRIPTION_ID}/pdf", 
                               headers=self.headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        # Check PDF magic bytes
        assert response.content[:4] == b'%PDF'
    
    def test_pdf_multipage_prescription(self):
        """Test PDF generation for prescription with 12 drugs (should be multi-page)"""
        response = requests.get(f"{BASE_URL}/api/prescriptions/{MULTIPAGE_PRESCRIPTION_ID}/pdf", 
                               headers=self.headers)
        assert response.status_code == 200
        # PDF should be larger due to multiple pages
        assert len(response.content) > 5000  # Multi-page PDF should be substantial
        
        # Check content-disposition header
        assert "attachment" in response.headers.get("content-disposition", "")


class TestDoctorAndDrugAPIs:
    """Tests for doctor and drug lookup APIs"""
    
    def test_get_doctors_list(self):
        """Test fetching list of doctors"""
        response = requests.get(f"{BASE_URL}/api/doctors")
        assert response.status_code == 200
        data = response.json()
        assert "doctors" in data
        assert len(data["doctors"]) >= 3  # Should have at least 3 doctors
        
        # Verify doctor structure
        doctor = data["doctors"][0]
        assert "id" in doctor
        assert "name" in doctor
        assert "qualifications" in doctor
    
    def test_get_doctor_by_id(self):
        """Test fetching specific doctor info"""
        response = requests.get(f"{BASE_URL}/api/doctors/dr_prakashini")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Dr. Prakashini M V"
        assert "clinic_name" in data  # Should include clinic info
    
    def test_drug_search(self):
        """Test drug autocomplete search"""
        response = requests.get(f"{BASE_URL}/api/drugs?search=WYS")
        assert response.status_code == 200
        data = response.json()
        assert "drugs" in data
        assert "WYSOLONE" in data["drugs"]
    
    def test_drug_list_default(self):
        """Test default drug list without search"""
        response = requests.get(f"{BASE_URL}/api/drugs")
        assert response.status_code == 200
        data = response.json()
        assert "drugs" in data
        assert len(data["drugs"]) > 0


class TestDeletePrescription:
    """Delete prescription tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_delete_prescription(self):
        """Test deleting a prescription"""
        # First create a prescription to delete
        test_op_no = f"TEST-DELETE-{uuid.uuid4().hex[:8].upper()}"
        prescription_data = {
            "op_no": test_op_no,
            "patient_name": "Test Patient Delete",
            "diagnosis": "Test Diagnosis",
            "clinical_history": "",
            "drugs": [{
                "drug_name": "WYSOLONE",
                "dosage": "10mg",
                "frequency": "1-0-1",
                "duration": "7",
                "duration_unit": "Days",
                "comments": ""
            }],
            "review_after": "",
            "doctor_id": "dr_prakashini"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/prescriptions", 
                                       json=prescription_data, 
                                       headers=self.headers)
        prescription_id = create_response.json()["id"]
        
        # Delete the prescription
        delete_response = requests.delete(f"{BASE_URL}/api/prescriptions/{prescription_id}", 
                                         headers=self.headers)
        assert delete_response.status_code == 200
        
        # Verify it's deleted
        get_response = requests.get(f"{BASE_URL}/api/prescriptions/{prescription_id}", 
                                   headers=self.headers)
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_prescription(self):
        """Test deleting a prescription that doesn't exist returns 404"""
        fake_id = "nonexistent-id-delete-test"
        response = requests.delete(f"{BASE_URL}/api/prescriptions/{fake_id}", 
                                  headers=self.headers)
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
