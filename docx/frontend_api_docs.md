# Frontend API Docs for Booking Flow & System Settings

This document outlines the API endpoints that frontend developers need to use for the booking flow and admin system settings.

## Admin System Settings APIs

### 1. Update GST Percentage
Allows the admin to configure the GST tax percentage applied to bookings.
- **Endpoint:** `PATCH /api/v1/admin/settings/gst`
- **Auth:** `Admin` (Bearer Token)
- **Request Body:**
  ```json
  {
    "gstPercentage": 18
  }
  ```
- **Response:** See `frontend_api_responses.json` (`update_gst_response`)

### 2. Update Cancellation Penalty
Allows the admin to configure the fixed penalty amount charged to labourers if they cancel an accepted broadcast.
- **Endpoint:** `PATCH /api/v1/admin/settings/penalty`
- **Auth:** `Admin` (Bearer Token)
- **Request Body:**
  ```json
  {
    "cancellationPenalty": 50
  }
  ```
- **Response:** See `frontend_api_responses.json` (`update_penalty_response`)

## User Booking APIs

### 3. Calculate Bill
Calculates the breakdown of a booking before creation. It now dynamically applies the platform fee and the admin-configured GST percentage.
- **Endpoint:** `POST /api/v1/bookings/calculate`
- **Auth:** `User` (Bearer Token)
- **Request Body:**
  ```json
  {
    "subcategoryId": "64d0f..."
  }
  ```
- **Response Data Fields Updated:**
  The response now includes a `taxes` field in the calculation.
  - `basePrice`: Price of subcategory
  - `platformFee`: Flat or percentage fee of platform
  - `taxes`: Calculated from `(basePrice + platformFee) * gstPercentage / 100`
  - `totalAmount`: Final amount payable by customer (`basePrice + platformFee + taxes`)
- **Response:** See `frontend_api_responses.json` (`calculate_bill_response`)

### 4. Create Booking
Creates a new booking, applies GST automatically, and triggers the broadcast sequence.
- **Endpoint:** `POST /api/v1/bookings`
- **Auth:** `User` (Bearer Token)
- **Request Body:**
  ```json
  {
    "subcategoryId": "64d0f...",
    "type": "INSTANT",
    "locationText": "Sector 14, Gurugram",
    "paymentMethod": "CASH"
  }
  ```
- **Response:** See `frontend_api_responses.json` (`create_booking_response`)

---

## Technical Notes for Frontend Developers:
1. **GST Calculation:** The GST is calculated dynamically on the backend as `(basePrice + platformFee) * gstPercentage / 100`. You just need to display the `taxes` field returned by the `/calculate-bill` endpoint. 
2. **Online Payment Fulfillment:** The backend automatically credits the labourer's self-wallet when a job is marked `COMPLETED` and the `paymentMethod` was `ONLINE`. You don't need to manually trigger any wallet endpoints for this.
3. **Broadcast Ordering:** Broadcasts are now fired to eligible labourers ordered strictly by their requested price (`minAcceptedPrice` ascending) - so those who request lower prices get the job request first.

---

## WebSocket (Socket.io) Events

The frontend must connect to the backend WebSocket server and listen for real-time events. Ensure you pass the user's JWT token during connection:
```javascript
const socket = io(BACKEND_URL, { auth: { token: 'YOUR_JWT_TOKEN' } })
```

### 1. Events for Customers (`Role: USER`)
- **`BOOKING_ACCEPTED`**
  - **Description:** Fired when a labourer accepts the broadcast.
  - **Payload:** `{ bookingId: "...", laborId: "..." }`
  - **Action:** Fetch labourer details and update UI.
- **`BOOKING_STATUS_UPDATE`**
  - **Description:** Fired when the labourer updates the booking status (e.g., `EN_ROUTE`, `STARTED`, `COMPLETED`).
  - **Payload:** `{ bookingId: "...", status: "..." }`
  - **Action:** Update the job tracking progress bar.

### 2. Events for Labourers (`Role: LABOUR`)
- **`NEW_BROADCAST`**
  - **Description:** Fired when the labourer is selected in the broadcast queue.
  - **Payload:** 
    ```json
    {
      "bookingId": "...",
      "logId": "...",
      "basePrice": 800,
      "laborShare": 723.24,
      "address": { "locationText": "Sector 14..." },
      "type": "INSTANT",
      "timeoutMs": 30000
    }
    ```
  - **Action:** Show the "Accept/Reject" popup screen. The labourer has `timeoutMs` to respond using the `POST /api/v1/broadcasts/:logId/accept` or `reject` APIs.
