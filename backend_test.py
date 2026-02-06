import requests
import sys
import json
from datetime import datetime

class RheumaCareAPITester:
    def __init__(self, base_url="https://doctorrx.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        print(f"{status_icon} {name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_login_valid(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Login - Valid Credentials",
            "POST",
            "auth/login",
            200,
            data={"username": "doctor", "password": "rheumacare2024"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_test("Token Extraction", True, "Token obtained successfully")
            return True
        else:
            self.log_test("Token Extraction", False, "No token in response")
            return False

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Login - Invalid Credentials",
            "POST",
            "auth/login",
            401,
            data={"username": "wrong", "password": "wrong"}
        )

    def test_auth_verify(self):
        """Test auth verification"""
        if not self.token:
            self.log_test("Auth Verify", False, "No token available")
            return False
        
        return self.run_test("Auth Verify", "GET", "auth/verify", 200)

    def test_get_drugs_all(self):
        """Test getting all drugs"""
        return self.run_test("Get All Drugs", "GET", "drugs", 200)

    def test_get_drugs_search(self):
        """Test drug search functionality"""
        success, response = self.run_test(
            "Drug Search - WYS",
            "GET",
            "drugs?search=WYS",
            200
        )
        
        if success and 'drugs' in response:
            drugs = response['drugs']
            wysolone_found = any('WYSOLONE' in drug for drug in drugs)
            self.log_test(
                "WYSOLONE in Search Results", 
                wysolone_found, 
                f"Found {len(drugs)} drugs, WYSOLONE present: {wysolone_found}"
            )
            return wysolone_found
        
        return False

    def test_doctor_info(self):
        """Test doctor info endpoint"""
        success, response = self.run_test("Get Doctor Info", "GET", "doctor-info", 200)
        
        if success and 'name' in response:
            expected_name = "Dr. Prakashini M V"
            name_correct = response['name'] == expected_name
            self.log_test(
                "Doctor Name Verification",
                name_correct,
                f"Expected: {expected_name}, Got: {response.get('name', 'N/A')}"
            )
            return name_correct
        
        return False

    def test_create_prescription(self):
        """Test prescription creation"""
        if not self.token:
            self.log_test("Create Prescription", False, "No auth token")
            return False, None

        prescription_data = {
            "op_no": "OP001",
            "patient_name": "Test Patient",
            "diagnosis": "Rheumatoid Arthritis",
            "clinical_history": "Patient presents with joint pain and stiffness",
            "drugs": [
                {
                    "drug_name": "WYSOLONE",
                    "dosage": "10mg",
                    "frequency": "1-0-1",
                    "duration": "7",
                    "duration_unit": "Days"
                }
            ],
            "review_after": "2 weeks"
        }

        success, response = self.run_test(
            "Create Prescription",
            "POST",
            "prescriptions",
            200,
            data=prescription_data
        )
        
        if success and 'id' in response:
            return True, response['id']
        
        return False, None

    def test_get_prescriptions(self):
        """Test getting all prescriptions"""
        if not self.token:
            self.log_test("Get Prescriptions", False, "No auth token")
            return False
        
        return self.run_test("Get All Prescriptions", "GET", "prescriptions", 200)

    def test_get_prescription_by_id(self, prescription_id):
        """Test getting specific prescription"""
        if not self.token or not prescription_id:
            self.log_test("Get Prescription by ID", False, "No auth token or prescription ID")
            return False
        
        return self.run_test(
            "Get Prescription by ID",
            "GET",
            f"prescriptions/{prescription_id}",
            200
        )

    def test_generate_pdf(self, prescription_id):
        """Test PDF generation"""
        if not self.token or not prescription_id:
            self.log_test("Generate PDF", False, "No auth token or prescription ID")
            return False
        
        url = f"{self.api_url}/prescriptions/{prescription_id}/pdf"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=15)
            success = response.status_code == 200 and response.headers.get('content-type') == 'application/pdf'
            
            if success:
                pdf_size = len(response.content)
                self.log_test("Generate PDF", True, f"PDF generated successfully ({pdf_size} bytes)")
            else:
                self.log_test("Generate PDF", False, f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
            
            return success
            
        except Exception as e:
            self.log_test("Generate PDF", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🔍 Starting RheumaCare API Tests...")
        print("=" * 50)
        
        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication tests
        self.test_login_invalid()
        login_success = self.test_login_valid()
        
        if login_success:
            self.test_auth_verify()
        
        # Drug-related tests
        self.test_get_drugs_all()
        self.test_get_drugs_search()
        
        # Doctor info
        self.test_doctor_info()
        
        # Prescription workflow
        prescription_created, prescription_id = self.test_create_prescription()
        
        if prescription_created:
            self.test_get_prescriptions()
            self.test_get_prescription_by_id(prescription_id)
            self.test_generate_pdf(prescription_id)
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

def main():
    tester = RheumaCareAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())