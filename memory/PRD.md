# RheumaCARE E-Prescription Portal - PRD

## Original Problem Statement
Create an e-prescription portal for a rheumatology clinic "RheumaCARE" with:
- OP No and Patient name text boxes
- Gender, Age, ICD Code fields
- Vitals, Diagnosis and Clinical History text boxes
- Rx section with drug autocomplete (from CSV), dosage, frequency dropdown (0-0-1, 1-0-0, 1-1-1, 1-0-1 with custom option), duration, duration unit dropdown (Days, Weeks, Months), comments
- Add drug (+) option
- Review after, Advice, Lab Tests fields
- Multi-doctor support (Dr. Prakashini, Dr. B.G Dharmanand, Dr. Ramesh Jois)
- PDF generation for PRE-PRINTED PRESCRIPTION PADS (content only, no header/footer)
- Print and Download PDF buttons
- Prescription history with search and Doctor column
- Excel export
- Edit existing prescriptions

## User Personas
1. **Primary Users**: Doctors at RheumaCARE clinic - Dr. Prakashini M V, Dr. B.G Dharmanand, Dr. Ramesh Jois
2. **Use Case**: Quick prescription creation for patients with auto-complete drug names, instant PDF generation for pre-printed prescription pads

## Core Requirements (Static)
- [x] Login with password protection
- [x] OP No and Patient Name fields
- [x] Gender, Age, ICD Code fields
- [x] Vitals field
- [x] Diagnosis text area
- [x] Clinical History text area
- [x] Drug autocomplete from provided CSV list (without dosage)
- [x] Frequency dropdown: 0-0-1, 1-0-0, 1-1-1, 1-0-1 + custom (wider column)
- [x] Duration + Unit (Days, Weeks, Months) dropdown
- [x] Comments field for each drug
- [x] Add/Remove drug rows
- [x] Review after field
- [x] Advice / Instructions field
- [x] Lab Tests Advised field
- [x] Multi-doctor selection (shows in history, NOT printed on PDF)
- [x] PDF for PRE-PRINTED PADS (margins reserved but no header/footer/signature printed)
- [x] Multi-page PDF support
- [x] Print button
- [x] Download PDF button
- [x] Prescription history view with search and Doctor column
- [x] Delete prescriptions
- [x] Edit existing prescriptions
- [x] Excel export

## What's Been Implemented (Jan-Feb 2025)

### Backend (FastAPI)
- JWT-based authentication with token expiration handling
- **Multi-role authentication system**:
  - Admin role: Full access to all prescriptions and doctor management
  - Doctor role: Access only to their own prescriptions
- **Doctor Management API** (Admin only):
  - CRUD operations for doctors
  - Each doctor has: name, location, qualifications, username/password, active status
- Drug list API with search/autocomplete
- Prescription CRUD endpoints (Create, Read, Update, Delete)
- **Prescription filtering**: Doctors see only their prescriptions, Admin sees all
- PDF generation using ReportLab - **CONTENT ONLY** for pre-printed pads
  - **36mm top margin** (reserved for pre-printed header)
  - **36mm bottom margin** (reserved for pre-printed footer)
  - **4mm padding** between margins and content
  - Margins enforced on ALL pages including multi-page documents
  - No header/footer/signature printed - uses pre-printed prescription pads
  - Debug mode available: `?debug=true` to show margin lines
- Excel export using openpyxl (includes Location column)
- MongoDB for prescription storage
- Multi-doctor profiles stored in database

### Frontend (React)
- Login page with clean medical design
- **Role-based routing**:
  - Admin redirected to Admin Panel after login
  - Doctors redirected to Prescription Form
- **Admin Panel** (`/admin`):
  - Doctor Management table with Name, Username, Location, Qualifications, Status
  - Add/Edit/Delete doctors
  - Each doctor gets unique login credentials
- Prescription form with all required fields
- Edit Prescription mode (loads existing data, Update button)
- Drug autocomplete with dropdown
- Frequency selector with custom option (wider column)
- Add/remove drug functionality
- New fields: Vitals, Advice, Lab Tests
- Prescription view with print layout
- PDF download capability
- **Prescription history with Location column**
- OP No. lookup with load patient info or full prescription
- Excel export button
- Doctor selection dropdown

### Design
- RheumaCARE teal brand color (#6B9A9A)
- Clean, professional medical aesthetic
- Responsive layout
- Manrope + Inter fonts

## Login Credentials
- **Admin**: `admin` / `rheumacare_admin_2024`
- **Default Doctors** (password format: `{username}123`):
  - Dr. Prakashini M V: `prakashini` / `prakashini123`
  - Dr. B.G Dharmanand: `dharmanand` / `dharmanand123`
  - Dr. Ramesh Jois: `ramesh` / `ramesh123`

## Tech Stack
- Backend: FastAPI + MongoDB + ReportLab (PDF) + OpenPyXL (Excel)
- Frontend: React + Tailwind CSS + shadcn/ui
- Auth: JWT tokens

## API Endpoints
- POST /api/auth/login - Login (returns role, doctor_id, location)
- GET /api/auth/verify - Verify token
- **Admin Endpoints** (require admin role):
  - GET /api/admin/doctors - List all doctors
  - POST /api/admin/doctors - Create doctor
  - PUT /api/admin/doctors/{id} - Update doctor
  - DELETE /api/admin/doctors/{id} - Delete doctor
- GET /api/doctors - List active doctors (for dropdown)
- GET /api/doctors/{id} - Get doctor info
- GET /api/drugs - Drug list with search
- POST /api/prescriptions - Create prescription
- GET /api/prescriptions - List prescriptions (filtered by role)
- GET /api/prescriptions/{id} - Get prescription
- PUT /api/prescriptions/{id} - Update prescription (EDIT)
- DELETE /api/prescriptions/{id} - Delete prescription
- GET /api/prescriptions/by-op/{op_no} - Get by OP number
- GET /api/prescriptions/{id}/pdf - Download PDF (content only, for pre-printed pads)
- GET /api/prescriptions/export/excel - Export to Excel (includes Location)

## PDF Design for Pre-Printed Pads
The PDF is designed to be printed on pre-printed prescription pads that already have:
- Header with RheumaCARE branding, doctor name, credentials
- Footer with clinic address, phone numbers

The generated PDF only contains the prescription content:
- Patient details (Date, OP No, Name, Sex, Age, ICD Code, Vitals)
- Diagnosis and Clinical History
- Drug table (Name, Dosage, Frequency, Duration, Comments)
- Review After, Advice, Lab Tests

**Margin Configuration (Updated Feb 2025):**
- Header space: **36mm** reserved for pre-printed header
- Footer space: **36mm** reserved for pre-printed footer
- Padding: **4mm** between header/footer and content
- Total Top margin: 40mm (36mm + 4mm)
- Total Bottom margin: 40mm (36mm + 4mm)
- Left/Right: 15mm
- Content is top-aligned within the safe zone
- Margins enforced on ALL pages (multi-page documents supported)
- Debug mode: Add `?debug=true` to PDF URL to see margin lines (blue=header/footer, red=content boundary)

## Prioritized Backlog

### P0 - Complete
- [x] All core features implemented
- [x] Multi-doctor support
- [x] Excel export
- [x] Edit prescriptions
- [x] New fields (Vitals: Weight, Height, BP, SpO2; Advice, Lab Tests)
- [x] Multi-page PDF support with correct 50mm margins on ALL pages
- [x] PDF for pre-printed pads (no header/footer)
- [x] Doctor column in history
- [x] Data migration from eprescribe-1 (75 records migrated)
- [x] Patient Name layout on left, OP/Sex/Age on right
- [x] Individual vitals fields (Weight, Height, BP, SpO2)
- [x] "Gender" changed to "Sex" throughout app

### P1 - Potential Enhancements
- [ ] Common comment presets dropdown (e.g., "After food", "Before food")
- [ ] Email prescription to patient

### P2 - Future Features
- [ ] Patient database/history (auto-fill returning patients)
- [ ] Prescription templates for common conditions
- [ ] Appointment integration
- [ ] Drug interaction warnings
- [ ] Prescription analytics/reports

## Next Tasks
1. Add common comment presets for quick selection
2. Consider adding patient database to auto-fill returning patients
3. Add prescription templates for frequently prescribed drug combinations
