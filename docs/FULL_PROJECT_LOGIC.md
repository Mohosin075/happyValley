# Happy Valley: Full Project Logic & Architecture

This document providing a comprehensive overview of how the Happy Valley project works, covering authentication, service management, bookings, payments, and subscriptions.

---

## 1. System Architecture
Happy Valley is a service-based platform built with:
- **Backend**: Node.js, Express, TypeScript.
- **Database**: MongoDB (Mongoose) for structured data and transactional integrity.
- **Payments**: Stripe Checkout for sessions and webhooks for fulfillment.
- **Notifications**: Internal notification system for status updates and payment receipts.

---

## 2. User & Authentication Logic
The system uses a role-based access control (RBAC) model with four primary roles: `SUPER_ADMIN`, `ADMIN`, `CLIENT`, and `STAFF`.

### Authentication Flow
- **Standard Login**: Email/Password with JWT-based sessions.
- **Forgot Password**: OTP-based verification sent via email.
- **Onboarding (Staff)**: Admins create staff accounts. 
    - The system generates a **random 8-digit temporary password**.
    - This password is sent to the staff member via email.
    - Staff are automatically linked to the selected services during creation.

---

## 3. Service & Staff Management
Services are the core offerings (e.g., Grocery, Kitchen Cleaning).

- **Service-Staff Link**: Each service has a list of authorized `staff`. Conversely, each staff member profile tracks which `services` they can perform.
- **Staff Metrics**: The system dynamically calculates staff performance:
    - **Average Rating**: Aggregated from approved client reviews.
    - **Completed Jobs**: Counted from `completed` booking records.

---

## 4. Booking & Availability System
This is the most complex part of the system, managing dates and staff assignments.

### Logic Highlights:
- **Daily Lock**: A staff member can only have **one job per day**. 
- **Creation**: 
    - If staff is assigned: Status = `scheduled`.
    - If no staff: Status = `requested`.
- **Status Transitions**:
    - `requested` → `scheduled` (Staff assigned)
    - `scheduled` → `inProgress` (Auto-records `startTime`)
    - `inProgress` → `completed` (Auto-records `endTime`)
- **Availability Module**: A separate collection tracks `isBooked` status for staff/date pairs to prevent overbooking.

---

## 5. Subscription & Premium Logic
Happy Valley offers a premium subscription model.

- **Status Check**: The system validates subscription status via Stripe API on every relevant request.
- **Core Benefit**: 
    - **Premium Users**: Pay **$0** Booking Fee.
    - **Regular Users**: Pay a flat **$150** Booking Fee.
- **Usage Tracking**: Subscriptions track session counts and reset periods.

---

## 6. Billing, Payments & Invoices
The system supports both immediate payments and monthly invoicing.

### Payment Types:
1.  **Booking Fee**: Paid upfront for regular users.
2.  **Service Charge**: Multi-tier pricing based on service details.
3.  **Monthly Invoices**: The most common flow for professional clients.

### Invoice Generation:
- **Aggregate Jobs**: The system finds all `completed` jobs for a user that haven't been invoiced yet.
- **Monthly Batch**: It groups these jobs into a single `Invoice` document (e.g., "2025-12").
- **Fulfillment**: Once the Stripe invoice session is paid, all associated jobs are marked as `paid` simultaneously.

---

## 7. Kitchen Restock AI (Specialized Flow)
A unique module for automated grocery restocking.

- **Chat Interface**: Clients chat with an AI assistant to build a restock list.
- **Order Reuse**: Clients can view past orders and "reuse" them to quickly generate new restock sessions.
- **Drafts**: Orders start as `draft` and move to `confirmed` after the AI conversation is finished.
