# Happy Valley: Booking, Acceptance, and Availability Logic

This document explains the core business logic governing how bookings are created, how statuses change, and how staff availability is managed.

---

## 1. Booking Creation Logic
When a user (Client or Admin) creates a booking, the system performs several checks and calculations:

- **Service & Staff Validation**: 
    - The system checks if the selected service exists.
    - If a staff member is assigned, it verifies that the staff member is actually authorized to perform that specific service.
- **Conflict Management**:
    - **One Staff per Day**: A staff member can only have **one** active booking (`scheduled`, `confirmed`, or `inProgress`) per day. If they are already booked for the selected date, the creation will fail with a "Conflict" error.
- **Pricing & Fees**:
    - **Base Price**: Initialized to 0 (to be updated later by Admin if needed).
    - **Booking Fee**: 
        - **Regular Users**: Charged a flat **$150** booking fee.
        - **Premium Users**: If the user has an `active` subscription, the booking fee is **$0**.
- **Initial Status**:
    - If a staff member is assigned during creation: Status = `scheduled`.
    - If no staff is assigned: Status = `requested`.
- **Auto-Availability**:
    - If a staff is assigned, the system automatically marks that staff member as **booked** for that specific date in the `Availability` module.

---

## 2. Status & Acceptance Flow
Bookings transition through various states, often triggering automatic time-tracking:

| Status | Meaning | Automatic Actions |
| :--- | :--- | :--- |
| `requested` | User requested a service, but no staff is assigned yet. | Default state. |
| `scheduled` | Staff has been assigned to the booking. | Status changes automatically when `staff` field is populated. |
| `inProgress` | The service is currently being performed. | Automatically sets `startTime` to the current system time (HH:mm). |
| `completed` | The service is finished. | Automatically sets `endTime` to the current system time (HH:mm). |
| `cancelled` | The booking was aborted. | If this was the only booking for the staff on that day, the date is marked as **available** again. |

- **Notifications**: Every time a booking status changes, the system sends a notification to the client.

---

## 3. Availability Logic
Availability is managed at the daily level for each staff member.

- **Normalization**: All dates are normalized to the start of the day (00:00:00) to ensure consistency.
- **Upsert Logic**: When a booking is made or cancelled, the system "upserts" (updates or inserts) a record in the `Availability` collection.
- **Check Availability**:
    - If no record exists for a staff member on a specific date, they are assumed to be **Available**.
    - If a record exists with `isBooked: true`, they are **Unavailable**.

---

## 4. Role-Based Permissions

- **Clients**: Can create bookings, view their own bookings, and chat with the Kitchen Restock AI.
- **Staff**: Can view bookings assigned to them and update the status of those bookings (e.g., mark as `inProgress` or `completed`).
- **Admins**: Have full control. Can assign staff, update prices, modify fees, and delete bookings.
