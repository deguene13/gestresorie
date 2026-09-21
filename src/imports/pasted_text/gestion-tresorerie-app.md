plese and put all in french:

Create a professional web and mobile application called "Gestion des Trésoreries".

This application is an enterprise-grade treasury management system designed to manage financial flows, purchasing processes, supplier invoices, payments, and cash tracking with full auditability and role-based access.

---

STARTING POINT (VERY IMPORTANT):

The first screen must be an Authentication page (Login / Sign up).

* Clean and modern fintech design
* Email and password fields
* Login button
* Forgot password
* Create account
* After login → redirect to Dashboard
GLOBAL DESIGN REQUIREMENTS:

* SaaS / ERP style interface (professional, structured)
* Responsive (desktop + mobile)
* Use dashboards, tables, forms, workflow timelines
* Clear navigation:

  * Web: Sidebar
  * Mobile: Bottom navigation

---

MODULE 1: USER MANAGEMENT

* Create, edit, deactivate users

* Assign roles:

  * Admin
  * Procurement Manager
  * Accountant
  * Approver
  * Supplier

* Features:

  * Secure authentication
  * Password reset (email)
  * Session management
  * Audit log (user actions)

Screens:

* User list
* User detail
* Role management MODULE 2: PURCHASE ORDERS (BDC)

* Create BDC:

  * Supplier
  * Items
  * Quantity
  * Unit price

* Features:

  * Automatic numbering
  * Timestamp
  * Approval workflow before sending
  * Send to supplier
  * Status:
    Draft, Pending, Approved, Sent, Received, Closed

* Ability to edit/cancel before confirmation

* Full history

Screens:

* BDC list (table)
* Create BDC form
* BDC detail with workflow timeline

---

MODULE 3: DELIVERY MANAGEMENT

* Create Delivery Note (BL)

* Link to BDC

* Auto comparison:

  * Ordered vs received quantities

* Detect discrepancies:

  * Missing items
  * Partial delivery
  * Extra items

* Validate conformity

* Generate signed receipt

Screens:

* Delivery list
* Delivery detail (comparison UI)

---
MODULE 4: SUPPLIER INVOICES

* Upload or create invoice

* Three-way matching:
  Invoice ↔ BDC ↔ Delivery

* Detect anomalies:

  * Amount mismatch
  * Quantity errors

* Workflow:

  * Verification
  * Approval

* Status:
  Received, Under review, Approved, Rejected, Pending payment, Paid

Screens:

* Invoice list
* Invoice detail
* Validation interface

---

MODULE 5: PAYMENT PROCESS

* Create payment request from approved invoice

* Select method:

  * Cash
  * Check
  * Bank transfer

* Approval workflow (DG or hierarchy)

* Record:

  * Amount
  * Date
  * Reference

* Auto close invoice after payment

* Alerts for overdue payments

Screens:

* Payment requests
* Approval screen (DG)
* Payment confirmation

---

MODULE 6: OUTGOING INVOICING (CLIENT SIDE)

* Create client invoices

* Manage products/services catalog

* Track payments:

  * Unpaid
  * Partial
  * Paid

* Generate delivery notes

* Automatic reminders for late payments

Screens:

* Client invoices list
* Invoice detail
* Payment tracking

---

MODULE 7: OTHER COLLECTIONS

* Record non-sales inflows:

  * Loan
  * Investment
  * Grant

* Fields:

  * Source
  * Amount
  * Currency
  * Date
  * Conditions

* Workflow:

  * Submission → Approval → Integration

* Attach documents:

  * Contracts
  * Agreements

* Status:
  Draft, Pending, Approved, Integrated, Rejected

Screens:

* Collection list
* Create entry
* Detail with documents

---

MODULE 8: OTHER DISBURSEMENTS

* Manual expense requests:

  * Reason
  * Amount
  * Beneficiary
  * Payment method

* Categories:

  * Service
  * Expense reimbursement
  * Cash advance

* Approval workflow:

  * Simple or multi-level (DAF + DG)

* Attach proof (mandatory)

* Status:
  Draft, Pending, Approved, Paid, Rejected, Archived

Screens:

* Request list
* Create request
* Approval workflow

---

MODULE 9: DASHBOARD & ANALYTICS

* Treasury balance

* Pending invoices

* Upcoming payments

* Monthly inflows/outflows

* KPIs:

  * Number of BDC
  * Payment delay
  * Delivery compliance rate

* Charts:

  * Line charts
  * Bar charts
  * Pie charts

* Filters:

  * Date
  * Supplier
  * Client

* Export:

  * PDF
  * Excel
  * CSV

---

UI/UX REQUIREMENTS:

* Components:

  * Cards (KPIs)
  * Tables (data)
  * Badges (status)
  * Timeline (workflow)

* Colors:

  * Green → Approved / Incoming
  * Red → Rejected / Outgoing
  * Yellow → Pending
  * Blue → Actions

* Include workflow visualization:
  BDC → Delivery → Invoice → Validation → Payment

---

MOBILE VERSION:

* Simplified dashboard
* Transaction list
* Create request
* Approval screens
* Notifications

---

OUTPUT EXPECTATION:

* Full UI screens for web and mobile
* Clean and structured layouts
* Reusable components
* SaaS-level professional design
* Realistic financial data examples
