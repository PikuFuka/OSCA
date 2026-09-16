# SYSTEM REQUIREMENTS SPECIFICATION (SRS)

## OSCA Senior Citizen ID & Management System

---

| Field | Detail |
|-------|--------|
| **Document Title** | System Requirements Specification |
| **Project Name** | OSCA Senior Citizen ID & Management System |
| **Client / Organization** | Office of the Senior Citizens' Affairs (OSCA), Municipality of Pagsanjan, Laguna, Philippines |
| **Document Version** | 1.0 |
| **Date Prepared** | September 01, 2026 |
| **Prepared By** | Systems Analyst / Development Team |
| **Project Repository** | https://github.com/PikuFuka/OSCA.git |

---

## Table of Contents

1. [Client/Stakeholder Information](#1-clientstakeholder-information)
2. [Problem Statement](#2-problem-statement)
3. [Project Scope](#3-project-scope)
4. [Target Users](#4-target-users)
5. [Current Process/System](#5-current-processsystem)
6. [User Needs and Expectations](#6-user-needs-and-expectations)
7. [Functional Requirements (Modules)](#7-functional-requirements-modules)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Security Requirements](#9-security-requirements)
10. [User Interface Requirements](#10-user-interface-requirements)
11. [System Constraints](#11-system-constraints)
12. [System Assumptions](#12-system-assumptions)
13. [Requirement Priorities](#13-requirement-priorities)
14. [Requirement IDs](#14-requirement-ids)
15. [Requirement Validation](#15-requirement-validation)
16. [Requirement Traceability](#16-requirement-traceability)
17. [Client Approval/Confirmation](#17-client-approvalconfirmation)
18. [Appendices](#18-appendices)

---

## 1. Client/Stakeholder Information

### 1.1 Primary Client

| Field | Detail |
|-------|--------|
| **Organization** | Office of the Senior Citizens' Affairs (OSCA) |
| **Municipality** | Pagsanjan |
| **Province** | Laguna |
| **Country** | Philippines |
| **Role** | End-user and primary beneficiary of the system |

### 1.2 Key Stakeholders

| Stakeholder | Role | Responsibility |
|-------------|------|----------------|
| **Municipal Mayor** | Executive Sponsor | Approves project scope, budget, and final acceptance |
| **OSCA Head / Municipal Social Welfare Officer** | Primary Client Representative | Defines requirements, validates deliverables, confirms acceptance |
| **OSCA Staff** | Day-to-Day Operators | Data encoding, member registration, ID printing, report generation |
| **Senior Citizens (Constituents)** | End Beneficiaries | Self-registration, record viewing, profile updates |
| **IT Department / Municipal Systems Administrator** | Technical Support | System deployment, maintenance, backup management |
| **Barangay Officials** | Data Providers | Verification of senior citizen residency and documentation |

### 1.3 Development Team

| Role | Responsibility |
|------|----------------|
| **Project Lead / Systems Analyst** | Requirements gathering, system design, documentation |
| **Backend Developer** | Server-side logic, API development, database design |
| **Frontend Developer** | User interface, client-side features, responsive design |
| **QA / Testing** | Test execution, defect reporting, acceptance verification |

---

## 2. Problem Statement

### 2.1 Background

The Office of the Senior Citizens' Affairs (OSCA) in Pagsanjan, Laguna is mandated to maintain an accurate and up-to-date registry of all senior citizens within the municipality. This registry is essential for the delivery of government services, benefits allocation (discounts, pensions, medical assistance), and compliance with Republic Act No. 7432 (Senior Citizens Act) and its amendments.

### 2.2 Current Challenges

1. **Manual Record Keeping**: Senior citizen records are maintained using manual processes (paper-based forms, spreadsheets, or fragmented digital files), leading to data redundancy, inconsistency, and difficulty in retrieval.

2. **Slow Verification and Approval**: New registrations and profile updates require manual review and physical paperwork, causing delays in processing and service delivery.

3. **No Centralized Database**: There is no unified, searchable database for senior citizen records across the 16 barangays of Pagsanjan, making demographic analysis and reporting difficult.

4. **ID Card Production Inefficiency**: Senior citizen ID cards are produced using manual or semi-automated tools, resulting in inconsistent formatting, slow batch processing, and difficulty in reprinting.

5. **Limited Reporting Capability**: Generating audited masterlists, centenarian rosters, and deceased records for municipal and provincial reporting is time-consuming and error-prone.

6. **No Offline Digital System**: Existing solutions often require internet connectivity, which is unreliable in some barangay offices and during field operations.

### 2.3 Problem Statement

**OSCA Pagsanjan lacks a centralized, offline-capable digital system for managing senior citizen records, processing registrations and approvals, producing digital ID cards, and generating demographic reports — resulting in inefficiencies, data inconsistencies, and delayed service delivery to the senior citizen population.**

---

## 3. Project Scope

### 3.1 In Scope

The following features and capabilities are included in this project:

| # | Scope Area | Description |
|---|-----------|-------------|
| 1 | **Member Registry** | Centralized database of all senior citizens with search, filter, and CRUD operations |
| 2 | **Digital ID Card System** | Interactive dual-sided card builder with customizable layout, QR code generation, and preview |
| 3 | **Batch ID Printing** | Multi-card batch printing capability (up to 4 cards per batch) |
| 4 | **Smart Camera with AI** | Live camera capture with AI-powered background removal using MediaPipe selfie segmentation |
| 5 | **Application Approval Workflow** | Review, approve, or reject new registrations and information update requests |
| 6 | **Reporting & Excel Export** | One-click generation of audited masterlists, centenarian rosters, deceased records, and newly registered senior reports in Excel format |
| 7 | **Dashboard & Analytics** | Real-time KPI cards, demographic charts (age, gender, barangay), and registration trends |
| 8 | **Account Management & RBAC** | Role-based access control for Administrator, Staff, and Senior Citizen accounts |
| 9 | **Audit Trail & System Logs** | Complete activity logging for all record changes, ID prints, deletions, and system operations |
| 10 | **Database Backup & Restore** | One-click SQL export and import with data normalization and schema compatibility checks |
| 11 | **Senior Citizen Self-Service Portal** | Personal portal for seniors to view their records, check application status, and submit update requests |
| 12 | **Offline Operation** | 100% air-gapped capability with self-hosted AI models, fonts, and assets |

### 3.2 Out of Scope

| # | Excluded | Reason |
|---|---------|--------|
| 1 | Cloud hosting / Internet deployment | System is designed for local LAN and offline use |
| 2 | Mobile application (iOS/Android) | Current scope is web-based only |
| 3 | Integration with PhilSys / National ID database | External API integration not within project scope |
| 4 | SMS/Email notifications | Not required by client for current phase |
| 5 | Multi-municipality support | System is single-tenant for Pagsanjan only |
| 6 | Payment processing | OSCA services are government-funded; no payment gateway needed |

### 3.3 Project Boundary Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    OSCA SYSTEM BOUNDARY                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Member   │  │ Digital  │  │Approval  │  │ Reports  │  │
│  │ Registry │  │ ID Card  │  │Workflow  │  │ & Excel  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │         │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐  │
│  │              Laravel 12 REST API Backend              │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│  ┌────────────────────────┴─────────────────────────────┐  │
│  │           MySQL / MariaDB Database (Local)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React 19 Single-Page Application             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ AI Smart │  │ Dashboard│  │ Account  │                │
│  │ Camera   │  │ & Stats  │  │ & RBAC   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
         │
         │ LAN (Local Area Network)
         │
    ┌────┴────┐
    │ Client  │  (Other office PCs, laptops)
    │ Browser │
    └─────────┘
```

---

## 4. Target Users

### 4.1 User Roles

| Role | Description | Technical Proficiency |
|------|-------------|----------------------|
| **Administrator** | OSCA Head or designated IT officer with full system access | Intermediate to Advanced |
| **Staff Member** | OSCA personnel responsible for data encoding, registration, and daily operations | Basic to Intermediate |
| **Print Station** | Dedicated account for ID card printing operations | Basic |
| **Senior Citizen** | Elderly constituents accessing the self-service portal | Basic / Limited |

### 4.2 User Personas

#### Persona 1: Maria (Administrator)
- **Age**: 45
- **Role**: OSCA Head / Municipal Social Welfare Officer
- **Goal**: Ensure all senior citizens are properly registered, generate reports for municipal council, manage staff accounts
- **Needs**: Full system access, audit trails, backup capability, demographic analytics

#### Persona 2: Juan (Staff Member)
- **Age**: 28
- **Role**: Data Encoder / OSCA Staff
- **Goal**: Register new senior citizens, process ID cards, handle update requests
- **Needs**: Fast search, efficient registration form, batch printing, approval workflow

#### Persona 3: Lolo Pedro (Senior Citizen)
- **Age**: 72
- **Role**: Registered Senior Citizen
- **Goal**: View his records, check ID application status, update his contact information
- **Needs**: Simple, large-text interface, minimal navigation, clear status indicators

#### Persona 4: Ana (Print Station Operator)
- **Age**: 25
- **Role**: Staff assigned to ID printing
- **Goal**: Print senior citizen ID cards in batches efficiently
- **Needs**: Quick card search, batch queue, print preview, minimal steps

---

## 5. Current Process/System

### 5.1 Current Workflow (Before OSCA System)

```
Step 1: Senior Citizen visits OSCA office or barangay hall
            │
            ▼
Step 2: Fills out paper registration form
            │
            ▼
Step 3: Submits supporting documents (birth certificate, cedula, barangay cert)
            │
            ▼
Step 4: Staff manually encodes data into spreadsheet / paper logbook
            │
            ▼
Step 5: OSCA Head reviews and approves (physical signature)
            │
            ▼
Step 6: ID card is manually designed or typed using Word/Canva
            │
            ▼
Step 7: ID card is printed individually
            │
            ▼
Step 8: Reports are compiled manually from spreadsheets for municipal/provincial submission
```

### 5.2 Problems with Current Process

| # | Problem | Impact |
|---|---------|--------|
| 1 | No centralized database | Duplicate records, difficulty finding member information |
| 2 | Paper-based forms | Risk of loss, damage, illegibility |
| 3 | Manual spreadsheet encoding | Human error, data inconsistency |
| 4 | Individual ID card production | Slow, inconsistent formatting, no batch capability |
| 5 | Manual report compilation | Time-consuming, prone to errors, delays in submission |
| 6 | No audit trail | Cannot track who made changes or when |
| 7 | No backup system | Risk of permanent data loss |
| 8 | No offline capability | Cannot operate during internet outages or in remote areas |

---

## 6. User Needs and Expectations

### 6.1 Functional Needs

| # | Need | Priority |
|---|------|----------|
| 1 | Quickly search and find any senior citizen record by name, OSCA ID, or barangay | High |
| 2 | Register new senior citizens with all required information in one form | High |
| 3 | Upload and store profile photos and supporting documents digitally | High |
| 4 | Generate professional, standardized dual-sided ID cards | High |
| 5 | Print multiple ID cards in a single batch | High |
| 6 | Review and process pending registration and update requests | High |
| 7 | Generate Excel reports for municipal and provincial submission | High |
| 8 | View real-time dashboard with key statistics and trends | Medium |
| 9 | Senior citizens can view their own records and submit update requests | Medium |
| 10 | Track all system activities with an audit log | Medium |
| 11 | Export and import database backups for disaster recovery | Medium |
| 12 | Capture ID photos with clean, professional backgrounds using AI | Medium |

### 6.2 Non-Functional Needs

| # | Need | Priority |
|---|------|----------|
| 1 | System must work without internet connection | High |
| 2 | System must be accessible from multiple office computers via LAN | High |
| 3 | System must respond within 3 seconds for common operations | Medium |
| 4 | System must protect sensitive personal information of senior citizens | High |
| 5 | System must be easy to use for staff with basic computer skills | High |
| 6 | System must be maintainable and transferable to other devices | Medium |

---

## 7. Functional Requirements (Modules)

### Module 1: Authentication & Account Management

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-AUTH-01 | User Login | The system shall allow users to log in using email/OSCA ID and password | High |
| FR-AUTH-02 | Token-Based Authentication | The system shall use Laravel Sanctum tokens for API authentication | High |
| FR-AUTH-03 | Force Password Change | The system shall force password change on first login for all seeded accounts | High |
| FR-AUTH-04 | Password Validation | The system shall enforce minimum 8 characters, at least 1 number, and 1 special character | High |
| FR-AUTH-05 | Logout | The system shall allow users to log out and revoke authentication tokens | Medium |
| FR-AUTH-06 | Session Management | The system shall manage user sessions securely via file-based driver | Medium |
| FR-AUTH-07 | Public Registration | The system shall allow public senior citizen registration without login | High |

### Module 2: Member Registry (Senior Citizen CRUD)

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-REG-01 | Create Record | The system shall allow staff to create new senior citizen records with personal, address, and contact information | High |
| FR-REG-02 | View Record | The system shall display complete senior citizen profile including family members and documents | High |
| FR-REG-03 | Edit Record | The system authorized users to update senior citizen information | High |
| FR-REG-04 | Delete Record | The system shall allow soft-deletion of records (trash/restore workflow) | High |
| FR-REG-05 | Search | The system shall support search by name (first, middle, last), OSCA ID, and barangay | High |
| FR-REG-06 | Filter | The system shall filter records by 16 barangays, status (Active/Pending/Deceased/Inactive), and pension status | High |
| FR-REG-07 | Sort | The system shall allow sorting by last name, first name, created date, barangay, status, and age | Medium |
| FR-REG-08 | Pagination | The system shall paginate results with configurable page size (max 100 records per page) | Medium |
| FR-REG-09 | Profile Photo | The system shall allow upload and storage of profile photos via camera capture or file upload | High |
| FR-REG-10 | Document Upload | The system shall allow upload of supporting documents (birth certificate, cedula, barangay certificate, ID picture) with 10MB max per file | High |
| FR-REG-11 | Mark Deceased | The system shall allow marking a senior citizen as deceased | Medium |
| FR-REG-12 | Restore Record | The system shall allow restoration of soft-deleted records | Medium |
| FR-REG-13 | Duplicate Detection | The system shall detect duplicate registrations based on first name, last name, and date of birth | Medium |
| FR-REG-14 | Auto Age Calculation | The system shall automatically calculate age from date of birth | Low |

### Module 3: Approval Workflow

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-APR-01 | View Pending Requests | The system shall display a queue of pending registration and update requests | High |
| FR-APR-02 | Approve Request | The system shall allow staff to approve requests and assign OSCA IDs for new applications | High |
| FR-APR-03 | Reject Request | The system shall allow staff to reject requests with a mandatory rejection reason | High |
| FR-APR-04 | Submit Update Request | The system shall allow senior citizens to submit information update requests (stored as pending changes) | High |
| FR-APR-05 | Pending Data Reconciliation | The system shall ensure all pending seniors have corresponding request records | Medium |
| FR-APR-06 | Document Review | The system shall allow reviewers to view attached documents during approval | Medium |

### Module 4: Digital ID Card Studio

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-ID-01 | Card Builder | The system shall provide an interactive dual-sided card builder with customizable label positions | High |
| FR-ID-02 | Drag-and-Drop Layout | The system shall support drag-and-drop repositioning of card labels (name, barangay, age, DOB, gender, date issued) | High |
| FR-ID-03 | QR Code Generation | The system shall generate QR codes containing senior citizen information | High |
| FR-ID-04 | Card Preview | The system shall display real-time front and back card preview | High |
| FR-ID-05 | Per-Card Configuration | The system shall allow individual card configuration (font sizes, X/Y positions) stored as JSON | Medium |
| FR-ID-06 | Save Layout | The system shall save card layout configurations per senior citizen for reprinting | Medium |

### Module 5: Batch Printing

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-PRT-01 | Batch Queue | The system shall allow adding up to 4 senior citizens to a print batch | High |
| FR-PRT-02 | Print Preview | The system shall display print-optimized card layout before printing | High |
| FR-PRT-03 | Browser Print | The system shall invoke the browser print dialog for physical printing | High |
| FR-PRT-04 | Print Logging | The system shall log all ID print operations in the audit trail | Medium |
| FR-PRT-05 | Dedicated Print Account | The system shall provide a dedicated Print Station account that auto-redirects to batch print view | Low |

### Module 6: Smart Camera with AI Background Removal

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-CAM-01 | Live Camera | The system shall access the device camera for live photo capture | High |
| FR-CAM-02 | AI Segmentation | The system shall perform real-time AI selfie segmentation to remove background | Medium |
| FR-CAM-03 | Offline AI | The system shall bundle MediaPipe models locally for 100% offline operation | High |
| FR-CAM-04 | Photo Capture | The system shall capture and store the processed photo as profile image | High |

### Module 7: Dashboard & Statistics

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-DASH-01 | KPI Cards | The system shall display summary KPIs: total, active, pending, deceased, centenarians | High |
| FR-DASH-02 | Monthly Chart | The system shall display a monthly registration bar chart (male/female/deceased breakdown) | Medium |
| FR-DASH-03 | Age Distribution | The system shall display age distribution chart (60-65, 66-70, 71-75, 76-80, 81-85, 86-90, 91+) | Medium |
| FR-DASH-04 | Gender Distribution | The system shall display gender distribution chart | Medium |
| FR-DASH-05 | Barangay Heatmap | The system shall display a barangay heatmap with intensity scoring | Medium |
| FR-DASH-06 | Top Barangays | The system shall display top 5 barangays ranking by senior population | Low |
| FR-DASH-07 | Filter by Year/Barangay | The system shall filter dashboard data by year and barangay | Medium |
| FR-DASH-08 | Pending Count | The system shall display count of pending approval requests | High |

### Module 8: Reports & Excel Export

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-RPT-01 | Excel Export | The system shall generate Excel (.xlsx) reports using Maatwebsite/Excel | High |
| FR-RPT-02 | Per-Barangay Tabs | The system shall generate per-barangay worksheet tabs in the Excel report | Medium |
| FR-RPT-03 | Masterlist Tab | The system shall include a consolidated Masterlist tab | High |
| FR-RPT-04 | Filter Options | The system shall filter reports by year and barangay | Medium |
| FR-RPT-05 | Report Sections | The system shall generate sections for: masterlist, centenarians, deceased, newly registered | High |
| FR-RPT-06 | Async Generation | The system shall support async/queued report generation for large datasets | Low |

### Module 9: System Logs (Audit Trail)

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-LOG-01 | Activity Logging | The system shall log all CRUD operations with action type, user, target, and timestamp | High |
| FR-LOG-02 | IP Tracking | The system shall record IP address for every logged action | Medium |
| FR-LOG-03 | Log Auto-Delete | The system shall auto-delete activity logs older than 24 hours | Low |
| FR-LOG-04 | Log Search | The system shall support search by action, user name, and target details | Medium |
| FR-LOG-05 | Log Filtering | The system shall filter logs by user, action, and date range | Medium |
| FR-LOG-06 | Clear Logs | The system shall allow administrators to clear all activity logs | Low |
| FR-LOG-07 | Log Pagination | The system shall paginate log results (50 per page) | Low |

### Module 10: Database Backup & Restore

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-BKP-01 | Export Database | The system shall export the database as a SQL dump file | High |
| FR-BKP-02 | Import Database | The system shall import a SQL backup file with automatic schema migration | High |
| FR-BKP-03 | Data Normalization | The system shall normalize data on import (Excel artifacts, OSCA ID cleanup) | Medium |
| FR-BKP-04 | Schema Compatibility | The system shall check and adjust schema compatibility after import | Medium |
| FR-BKP-05 | File Size Limit | The system shall enforce a 500MB maximum import file size | Low |
| FR-BKP-06 | Async Operations | The system shall support async/queued backup operations for large datasets | Low |

### Module 11: User/Account Administration

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-USR-01 | Create Account | The system shall allow administrators to create new staff accounts | High |
| FR-USR-02 | Edit Account | The system shall allow administrators to update user account details | Medium |
| FR-USR-03 | Delete Account | The system shall allow administrators to delete user accounts (self-deletion prevented) | Medium |
| FR-USR-04 | Role Assignment | The system shall assign roles (Admin, Staff) with appropriate permissions | High |
| FR-USR-05 | Barangay Assignment | The system shall assign staff to specific barangays | Low |
| FR-USR-06 | Account Status | The system shall support Active/Inactive account status | Medium |
| FR-USR-07 | Last Active Tracking | The system shall track and display last active timestamp for each user | Low |

### Module 12: Senior Citizen Self-Service Portal

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-SRV-01 | Home Dashboard | The system shall provide a personal home dashboard for logged-in senior citizens | Medium |
| FR-SRV-02 | My Record | The system shall display the senior citizen's complete profile, documents, and family members (view-only) | Medium |
| FR-SRV-03 | Update Request | The system shall allow senior citizens to submit information update requests for approval | High |
| FR-SRV-04 | Status Check | The system shall display application/request status to senior citizens | Medium |
| FR-SRV-05 | Role Restriction | The system shall restrict senior portal access to personal records only | High |

### Module 13: Archive / Deleted Records

| Req ID | Requirement | Description | Priority |
|--------|------------|-------------|----------|
| FR-ARC-01 | View Deleted | The system shall display a list of soft-deleted senior citizen records | Medium |
| FR-ARC-02 | Restore Record | The system shall allow restoration of deleted records to active status | Medium |
| FR-ARC-03 | Search Deleted | The system shall support search within deleted records | Low |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Req ID | Requirement | Description | Target |
|--------|------------|-------------|--------|
| NFR-PERF-01 | Response Time | The system shall respond to common operations (search, filter, view) within 3 seconds | < 3 seconds |
| NFR-PERF-02 | Dashboard Load | The system shall load the dashboard with all charts within 5 seconds | < 5 seconds |
| NFR-PERF-03 | Statistics Cache | The system shall cache dashboard statistics for 5 minutes with observer-based invalidation | 5-minute TTL |
| NFR-PERF-04 | Index Cache | The system shall cache paginated search results for 45 seconds | 45-second TTL |
| NFR-PERF-05 | Concurrent Users | The system shall support at least 10 concurrent users on LAN deployment | >= 10 users |
| NFR-PERF-06 | Database Indexes | The system shall maintain 20+ database indexes covering common query patterns | Covered |
| NFR-PERF-07 | Report Generation | The system shall generate Excel reports within 30 seconds for up to 7,000 records | < 30 seconds |

### 8.2 Reliability

| Req ID | Requirement | Description |
|--------|------------|-------------|
| NFR-REL-01 | Data Integrity | The system shall maintain data integrity through foreign key constraints and database transactions |
| NFR-REL-02 | Soft Deletes | The system shall preserve deleted records via soft-delete mechanism for recovery |
| NFR-REL-03 | Duplicate Prevention | The system shall prevent duplicate registrations through name + DOB validation |
| NFR-REL-04 | Backup & Recovery | The system shall support full database backup and restoration for disaster recovery |

### 8.3 Usability

| Req ID | Requirement | Description |
|--------|------------|-------------|
| NFR-USE-01 | Intuitive Interface | The system shall provide a clean, intuitive interface requiring minimal training |
| NFR-USE-02 | Responsive Design | The system shall be accessible on desktop and laptop screens (1024px minimum width) |
| NFR-USE-03 | Role-Based Views | The system shall display only relevant menu items and views based on user role |
| NFR-USE-04 | Senior-Friendly Portal | The self-service portal shall use large text, clear labels, and minimal navigation depth |

### 8.4 Maintainability

| Req ID | Requirement | Description |
|--------|------------|-------------|
| NFR-MAINT-01 | Transferable Deployment | The system shall be transferable to other devices via USB/ZIP or Git |
| NFR-MAINT-02 | Environment Configuration | The system shall use environment-based configuration (.env) for portability |
| NFR-MAINT-03 | Modular Architecture | The system shall follow a modular backend (controllers, services, repositories) and frontend (feature-based) structure |
| NFR-MAINT-04 | Automated Tests | The system shall include automated unit and controller tests for backend and frontend |

### 8.5 Compatibility

| Req ID | Requirement | Description |
|--------|------------|-------------|
| NFR-COMPAT-01 | Browser Support | The system shall support Google Chrome, Microsoft Edge, and Mozilla Firefox (latest versions) |
| NFR-COMPAT-02 | OS Support | The system shall run on Windows 10/11, macOS, and Linux |
| NFR-COMPAT-03 | Database Support | The system shall support MySQL/MariaDB and SQLite database backends |

---

## 9. Security Requirements

### 9.1 Confidentiality

| Req ID | Requirement | Description |
|--------|------------|-------------|
| SEC-CONF-01 | Password Hashing | All passwords shall be hashed using BCRYPT with 12 rounds |
| SEC-CONF-02 | Password Hidden | Passwords shall never be returned in API responses (model $hidden arrays) |
| SEC-CONF-03 | Token Authentication | All API endpoints (except public registration and login) shall require valid Sanctum bearer tokens |
| SEC-CONF-04 | Role-Based Access | Admin-only operations shall be enforced server-side with 403 responses for unauthorized access |
| SEC-CONF-05 | Sensitive Data Protection | Personal information (contact numbers, emergency contacts, addresses) shall be accessible only to authorized users |
| SEC-CONF-06 | Document Access Control | Uploaded documents shall be accessible only to authenticated users with appropriate roles |
| SEC-CONF-07 | Offline Security | System operates on local network only, eliminating exposure to public internet threats |

### 9.2 Integrity

| Req ID | Requirement | Description |
|--------|------------|-------------|
| SEC-INTG-01 | Input Validation | All user inputs shall be validated through Laravel FormRequest classes |
| SEC-INTG-02 | SQL Injection Prevention | All database queries shall use Eloquent ORM and parameterized queries |
| SEC-INTG-03 | File Upload Validation | File uploads shall be validated for type (whitelist: birthCert, cedula, brgyCert, idPicture) and size (10MB max) |
| SEC-INTG-04 | CSRF Protection | The system shall implement CSRF cookie pre-flight on authentication |
| SEC-INTG-05 | Audit Trail | All data mutations shall be logged with user, action, timestamp, and IP address |
| SEC-INTG-06 | Data Normalization | Import processes shall normalize data and prevent corruption through idempotent operations |
| SEC-INTG-07 | Foreign Key Constraints | Database shall enforce referential integrity through foreign key constraints with CASCADE deletes |

### 9.3 Availability

| Req ID | Requirement | Description |
|--------|------------|-------------|
| SEC-AVAIL-01 | Offline Operation | The system shall be fully operational without internet connectivity |
| SEC-AVAIL-02 | Self-Hosted Assets | All AI models, fonts, and dependencies shall be bundled locally |
| SEC-AVAIL-03 | LAN Accessibility | The system shall be accessible from any computer on the local office network |
| SEC-AVAIL-04 | Backup Frequency | The system shall support on-demand database backup at any time |
| SEC-AVAIL-05 | Data Preservation | Soft deletes shall ensure no permanent data loss without explicit action |
| SEC-AVAIL-06 | Auto Log Rotation | Activity logs shall auto-rotate after 24 hours to prevent storage bloat |

---

## 10. User Interface Requirements

### 10.1 General UI Requirements

| Req ID | Requirement | Description |
|--------|------------|-------------|
| UI-01 | Single-Page Application | The system shall be a React-based SPA with client-side routing |
| UI-02 | Responsive Layout | The system shall adapt to desktop and laptop screen sizes (minimum 1024px width) |
| UI-03 | Dark/Light Theme | The system shall use a professional, clean color scheme with Tailwind CSS |
| UI-04 | Navigation Sidebar | The system shall provide a left sidebar navigation with role-based menu visibility |
| UI-05 | Loading Indicators | The system shall display loading spinners/skeletons during data fetching |
| UI-06 | Error Feedback | The system shall display clear error messages for failed operations |
| UI-07 | Confirmation Dialogs | The system shall require confirmation for destructive actions (delete, clear logs) |

### 10.2 Page/View Requirements

| Req ID | View | Description |
|--------|------|-------------|
| UI-V-01 | Login Page | Clean login form with email/OSCA ID field, password field, and public registration link |
| UI-V-02 | Dashboard | KPI cards (5 metrics), 4 charts (monthly, age, gender, barangay heatmap), pending count badge |
| UI-V-03 | Member Registry | Searchable/filterable data table with inline actions, sort headers, pagination, and detail drawer |
| UI-V-04 | Registration Form | Multi-tab form (Personal Info, Address, Family Members, Documents) with camera capture |
| UI-V-05 | Approval View | Request queue with approve/reject buttons, document preview, rejection reason modal |
| UI-V-06 | Digital ID Studio | Interactive card builder with drag-and-drop labels, front/back preview, QR code display |
| UI-V-07 | Batch Print View | Card queue (max 4), search-and-add workflow, print preview, browser print invocation |
| UI-V-08 | Reports View | Year/barangay filters, section tabs (masterlist, centenarians, deceased, newly registered), download button |
| UI-V-09 | Account Management | User list table, create/edit modal, role assignment dropdown |
| UI-V-10 | System Logs | Filterable log table with search, date range, and action type filters |
| UI-V-11 | Backup View | Export button, import with file upload, progress indicator, operation status feedback |
| UI-V-12 | Senior Portal Dashboard | Personal info summary card, status indicator, quick action buttons |
| UI-V-13 | Senior My Record | Full profile view with documents gallery and family members list |
| UI-V-14 | Senior Update Form | Simplified update request form with field-level change tracking |

### 10.3 ID Card Layout

| Req ID | Requirement | Description |
|--------|------------|-------------|
| UI-ID-01 | Card Dimensions | ID cards shall be 480x300 pixels (standard CR80 ratio) |
| UI-ID-02 | Front Design | Front side shall display: photo, name, OSCA ID, barangay, city |
| UI-ID-03 | Back Design | Back side shall display: age, DOB, gender, date issued, QR code |
| UI-ID-04 | Customizable Labels | Each label shall have configurable font size and X/Y position |
| UI-ID-05 | Print Layout | Print view shall optimize layout for physical card printing |

---

## 11. System Constraints

| # | Constraint | Description |
|---|-----------|-------------|
| SC-01 | **No Internet Required** | System must operate in 100% offline/air-gapped environments |
| SC-02 | **Local Network Only** | Deployment is restricted to local area network (LAN) via Apache/XAMPP |
| SC-03 | **Single Municipality** | System is designed for single-tenant use (Pagsanjan, Laguna only) |
| SC-04 | **Windows Primary** | Primary development and deployment target is Windows 10/11 with XAMPP |
| SC-05 | **PHP 8.2+ Required** | Backend requires PHP 8.2 or higher with specific extensions (pdo_mysql, pdo_sqlite, mbstring, openssl, fileinfo, gd, zip, xml, curl) |
| SC-06 | **Node.js 18+ Required** | Frontend build requires Node.js 18 LTS, 20 LTS, or 22+ |
| SC-07 | **MySQL/MariaDB Default** | Default database is MySQL/MariaDB via XAMPP; SQLite supported as fallback |
| SC-08 | **Max Upload Size** | Document uploads are limited to 10MB per file; backup imports limited to 500MB |
| SC-09 | **Browser Limitation** | No native mobile app; must use modern web browser (Chrome, Edge, Firefox) |
| SC-10 | **Data Volume** | System is optimized for up to ~10,000 senior citizen records |
| SC-11 | **Storage Dependency** | Uploaded files (photos, documents) are stored locally on the server filesystem |
| SC-12 | **No Cloud Backup** | Backup is local-only; no automated cloud backup or off-site replication |

---

## 12. System Assumptions

| # | Assumption |
|---|-----------|
| SA-01 | The target deployment machine will have XAMPP (Apache, MySQL/MariaDB, PHP 8.2+) installed |
| SA-02 | The target deployment machine will have Node.js 18+ and Composer 2.x installed |
| SA-03 | The office has a functioning local area network (LAN) for multi-user access |
| SA-04 | At least one staff member will be designated as system administrator |
| SA-05 | Staff members have basic computer literacy (browser usage, file management) |
| SA-06 | Senior citizens accessing the self-service portal will have assistance from staff if needed |
| SA-07 | The municipal government will provide the necessary hardware (server PC, client PCs) |
| SA-08 | Default passwords will be changed immediately after initial deployment |
| SA-09 | Regular database backups will be performed by the designated administrator |
| SA-10 | The system will be used primarily during office hours (8:00 AM - 5:00 PM) |
| SA-11 | Internet connectivity may be unavailable or unreliable at the deployment site |
| SA-12 | The client has provided or will provide the official municipal/province logos for reports |
| SA-13 | The 16 barangay names of Pagsanjan, Laguna are fixed and will not change during system lifecycle |
| SA-14 | Senior citizen data will be entered in English/Filipino (no multi-language support required) |

---

## 13. Requirement Priorities

Requirements are classified using the following priority levels:

| Priority | Definition |
|----------|-----------|
| **P1 - Critical** | Must be implemented for the system to be functional. System cannot go live without these. |
| **P2 - High** | Essential for core workflows. Significant impact on usability if omitted. |
| **P3 - Medium** | Important for completeness and user satisfaction. Can be deferred to later phase. |
| **P4 - Low** | Nice-to-have features. Minimal impact on core functionality if omitted. |

### Priority Distribution

| Priority | Count | Examples |
|----------|-------|---------|
| P1 - Critical | 18 | Authentication, CRUD operations, Approval workflow, ID card generation, Offline operation |
| P2 - High | 22 | Search/Filter, Batch printing, Reports, Audit logs, Backup/Restore, RBAC |
| P3 - Medium | 18 | Dashboard charts, Self-service portal, Log filtering, Account management |
| P4 - Low | 8 | Auto age calculation, Async report generation, Print station account, Log auto-delete |

---

## 14. Requirement IDs

All requirements are assigned unique identifiers following the convention: `[Module]-[Number]`

### ID Convention

| Prefix | Module |
|--------|--------|
| FR-AUTH | Authentication & Account Management |
| FR-REG | Member Registry |
| FR-APR | Approval Workflow |
| FR-ID | Digital ID Card Studio |
| FR-PRT | Batch Printing |
| FR-CAM | Smart Camera with AI |
| FR-DASH | Dashboard & Statistics |
| FR-RPT | Reports & Excel Export |
| FR-LOG | System Logs (Audit Trail) |
| FR-BKP | Database Backup & Restore |
| FR-USR | User/Account Administration |
| FR-SRV | Senior Citizen Self-Service Portal |
| FR-ARC | Archive / Deleted Records |
| NFR-PERF | Non-Functional: Performance |
| NFR-REL | Non-Functional: Reliability |
| NFR-USE | Non-Functional: Usability |
| NFR-MAINT | Non-Functional: Maintainability |
| NFR-COMPAT | Non-Functional: Compatibility |
| SEC-CONF | Security: Confidentiality |
| SEC-INTG | Security: Integrity |
| SEC-AVAIL | Security: Availability |
| UI | User Interface |
| SC | System Constraints |
| SA | System Assumptions |

### Complete Requirement Count

| Category | Count |
|----------|-------|
| Functional Requirements (FR) | 66 |
| Non-Functional Requirements (NFR) | 19 |
| Security Requirements (SEC) | 16 |
| User Interface Requirements (UI) | 19 |
| System Constraints (SC) | 12 |
| System Assumptions (SA) | 14 |
| **TOTAL** | **146** |

---

## 15. Requirement Validation

Each requirement shall be validated against the following criteria before acceptance:

### 15.1 Validation Criteria

| # | Criterion | Description |
|---|----------|-------------|
| V-01 | **Completeness** | Each requirement is fully stated without ambiguity |
| V-02 | **Consistency** | No requirement conflicts with another requirement |
| V-03 | **Feasibility** | Each requirement can be implemented within project constraints |
| V-04 | **Testability** | Each requirement has at least one verifiable test case |
| V-05 | **Traceability** | Each requirement can be traced to a stakeholder need |

### 15.2 Validation Methods

| Method | Applicable Requirements | Description |
|--------|------------------------|-------------|
| **Code Review** | All FR, NFR, SEC | Review implementation against requirement specification |
| **Functional Testing** | FR-AUTH, FR-REG, FR-APR, FR-ID, FR-PRT, FR-CAM, FR-DASH, FR-RPT, FR-LOG, FR-BKP, FR-USR, FR-SRV, FR-ARC | Execute test cases for each functional module |
| **Performance Testing** | NFR-PERF-01 through NFR-PERF-07 | Measure response times, concurrent users, and cache behavior |
| **Security Testing** | SEC-CONF, SEC-INTG, SEC-AVAIL | Attempt unauthorized access, injection attacks, and data corruption |
| **Usability Testing** | NFR-USE, UI | User acceptance testing with actual OSCA staff |
| **Compatibility Testing** | NFR-COMPAT | Test on Chrome, Edge, Firefox; Windows, macOS, Linux |
| **Offline Testing** | SEC-AVAIL-01, SEC-AVAIL-02, SC-01 | Disconnect from internet and verify all features work |
| **Backup/Recovery Testing** | NFR-REL-04, FR-BKP | Perform full backup and restore cycle, verify data integrity |

### 15.3 Acceptance Thresholds

| Metric | Threshold |
|--------|-----------|
| Requirements Implemented | 100% of P1 and P2 requirements |
| Test Pass Rate | >= 95% of all test cases |
| Critical Defects | 0 open critical defects |
| Performance Targets | All NFR-PERF targets met |
| Security Audit | No high or critical vulnerabilities |

---

## 16. Requirement Traceability

### 16.1 Traceability Matrix: Requirements to Stakeholder Needs

| Stakeholder Need | Requirements |
|-----------------|-------------|
| **Centralized member registry** | FR-REG-01 through FR-REG-14, FR-AUTH-01, FR-AUTH-03 |
| **Fast member search** | FR-REG-05, FR-REG-06, FR-REG-07, FR-REG-08, NFR-PERF-01 |
| **Digital ID card production** | FR-ID-01 through FR-ID-06, FR-PRT-01 through FR-PRT-05 |
| **Professional ID photos** | FR-CAM-01 through FR-CAM-04, FR-REG-09 |
| **Approval workflow** | FR-APR-01 through FR-APR-06 |
| **Demographic reports** | FR-RPT-01 through FR-RPT-06, FR-DASH-01 through FR-DASH-08 |
| **Data security** | SEC-CONF-01 through SEC-CONF-07, SEC-INTG-01 through SEC-INTG-07 |
| **Audit trail** | FR-LOG-01 through FR-LOG-07 |
| **Offline capability** | SEC-AVAIL-01, SEC-AVAIL-02, SC-01, NFR-COMPAT-01 |
| **Multi-user access** | NFR-PERF-05, FR-USR-01 through FR-USR-07, RBAC requirements |
| **Data backup & recovery** | FR-BKP-01 through FR-BKP-06, NFR-REL-04 |
| **Senior citizen self-service** | FR-SRV-01 through FR-SRV-05 |
| **Easy deployment & transfer** | NFR-MAINT-01, NFR-MAINT-02, SC-02, SC-04 |

### 16.2 Traceability Matrix: Requirements to System Modules

| Module | Requirements |
|--------|-------------|
| **Authentication** | FR-AUTH-01 through FR-AUTH-07 |
| **Member Registry** | FR-REG-01 through FR-REG-14 |
| **Approval Workflow** | FR-APR-01 through FR-APR-06 |
| **Digital ID Studio** | FR-ID-01 through FR-ID-06 |
| **Batch Printing** | FR-PRT-01 through FR-PRT-05 |
| **Smart Camera** | FR-CAM-01 through FR-CAM-04 |
| **Dashboard** | FR-DASH-01 through FR-DASH-08 |
| **Reports** | FR-RPT-01 through FR-RPT-06 |
| **Audit Trail** | FR-LOG-01 through FR-LOG-07 |
| **Backup & Restore** | FR-BKP-01 through FR-BKP-06 |
| **Account Admin** | FR-USR-01 through FR-USR-07 |
| **Senior Portal** | FR-SRV-01 through FR-SRV-05 |
| **Archive** | FR-ARC-01 through FR-ARC-03 |

### 16.3 Traceability Matrix: Requirements to Test Areas

| Test Area | Requirements |
|-----------|-------------|
| **Unit Tests** | FR-REG (model validation), FR-AUTH (token logic), FR-APR (status transitions) |
| **Integration Tests** | FR-APR-05 (reconciliation), FR-BKP-03 (normalization), FR-LOG (activity logging) |
| **API Tests** | All FR endpoints (42 API routes) |
| **UI Tests** | UI-V-01 through UI-V-14, UI-ID-01 through UI-ID-05 |
| **Performance Tests** | NFR-PERF-01 through NFR-PERF-07 |
| **Security Tests** | SEC-CONF, SEC-INTG, SEC-AVAIL |

---

## 17. Client Approval/Confirmation

### 17.1 Document Approval

This System Requirements Specification has been reviewed and approved by the following stakeholders:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Project Sponsor / Municipal Mayor** | ___________________ | ___________________ | ____/____/________ |
| **OSCA Head / Client Representative** | ___________________ | ___________________ | ____/____/________ |
| **Municipal IT Officer** | ___________________ | ___________________ | ____/____/________ |
| **Project Lead / Systems Analyst** | ___________________ | ___________________ | ____/____/________ |
| **Lead Developer** | ___________________ | ___________________ | ____/____/________ |

### 17.2 Scope Confirmation

By signing below, the client confirms:

- [ ] All functional requirements listed in Section 7 accurately represent the desired system behavior
- [ ] The project scope defined in Section 3 is agreed upon (inclusions and exclusions)
- [ ] The target users identified in Section 4 are the intended user groups
- [ ] The system constraints in Section 11 are acceptable and understood
- [ ] The requirement priorities in Section 13 reflect the client's preferences
- [ ] Any changes after approval will follow a formal change request process

### 17.3 Change Log

| Version | Date | Author | Description of Changes |
|---------|------|--------|----------------------|
| 1.0 | September 01, 2026 | Development Team | Initial SRS document |
| | | | |
| | | | |

---

## 18. Appendices

### Appendix A: Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Framework | Laravel | 12.x |
| Backend Language | PHP | 8.2+ |
| Frontend Framework | React | 19.x |
| Frontend Language | TypeScript | Latest |
| Build Tool | Vite | 6.x |
| CSS Framework | Tailwind CSS | Latest |
| Database | MySQL / MariaDB / SQLite | XAMPP 8.2+ |
| Authentication | Laravel Sanctum | Latest |
| AI/ML (Camera) | MediaPipe Selfie Segmentation | Self-hosted |
| Report Generation | Maatwebsite/Excel | Latest |
| Package Manager (PHP) | Composer | 2.x |
| Package Manager (JS) | npm | 10.x |

### Appendix B: Database Schema Summary

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | System user accounts (Admin, Staff) | Has many activity_logs |
| `seniors` | Senior citizen master records | Has many family_members, senior_documents, requests |
| `family_members` | Family member details | Belongs to seniors (CASCADE delete) |
| `senior_documents` | Uploaded documents (photos, certificates) | Belongs to seniors (CASCADE delete) |
| `requests` | Approval workflow requests | Belongs to seniors, actioned by users |
| `activity_logs` | Audit trail of all operations | Belongs to users |
| `personal_access_tokens` | Sanctum API tokens | Polymorphic (User, Senior) |

### Appendix C: API Endpoints Summary

| Module | Endpoint Count | Key Endpoints |
|--------|---------------|---------------|
| Authentication | 6 | POST /api/login, POST /api/register, POST /api/logout |
| Senior Citizens | 15 | GET/POST /api/seniors, GET/PUT/DELETE /api/seniors/{id} |
| Approval Requests | 4 | GET /api/requests, PUT /api/requests/{id}/approve |
| User Management | 4 | GET/POST /api/users, PUT/DELETE /api/users/{id} |
| Activity Logs | 3 | GET /api/activity-logs, DELETE /api/activity-logs |
| Backup | 2 | GET /api/backup/export, POST /api/backup/import |
| Reports | 1 | GET /api/reports/senior-citizens |
| **Total** | **~42** | |


*End of System Requirements Specification*
