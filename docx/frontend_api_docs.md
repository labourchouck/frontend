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
    "subcategoryId": "64d0f...",
    "durationDays": 1
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
    "type": "SCHEDULED",
    "locationText": "Sector 14, Gurugram",
    "lat": 28.4595,
    "lng": 77.0266,
    "paymentMethod": "CASH",
    "notes": "Pani ki pipe leak ho rahi hai",
    "durationKind": "few_hours",
    "durationDays": 1,
    "timeSlot": "9:00 AM – 12:00 PM",
    "imageNames": [
      "https://res.cloudinary.com/labourchowck/image/upload/v12345/job-posters/abcd.jpg"
    ]
  }
  ```
- **New Payload Fields Explained:**
  - `lat`, `lng`: Exact coordinates of the customer (Required for zone broadcast).
  - `notes`: (Optional) Text description of the job.
  - `durationKind`: `few_hours`, `full_day`, or `multi_day`.
  - `durationDays`: Number of days (defaults to 1). Multiplies the base price.
  - `timeSlot`: Required if `type` is `SCHEDULED` (e.g., "9:00 AM – 12:00 PM").
  - `imageNames`: Array of Cloudinary image URLs uploaded via the Media API.
- **Response:** See `frontend_api_responses.json` (`create_booking_response`)

## Zone Management & Flash Broadcast APIs

### 5. Admin Zone Settings
Allows the admin to configure the geographical radius (in kilometers) for broadcasting bookings to labourers.
- **Endpoint:** `GET /api/v1/admin/zones/settings` | `PUT /api/v1/admin/zones/settings`
- **Auth:** `Admin` (Bearer Token)
- **PUT Request Body:**
  ```json
  {
    "bookingBroadcastRadius": 10
  }
  ```

### 6. Admin Zone Statistics
Retrieves analytics for the broadcast system, including average broadcast radius and eligible labourer counts.
- **Endpoint:** `GET /api/v1/admin/zones/statistics`
- **Auth:** `Admin` (Bearer Token)
- **Response:**
  ```json
  {
    "data": {
      "totalBookings": 150,
      "totalEligibleLabourers": 450,
      "bookingsWithNoLabourers": 5,
      "avgRadius": 12.5,
      "broadcastSuccessRate": 96.67,
      "activeLabourCount": 320
    }
  }
  ```

### 7. Labour Location & Status Sync
Allows the labourer app to sync their current GPS coordinates for zone matching, and toggle their online availability.
- **Endpoint 1 (Coordinates):** `POST /api/v1/labour/location/update`
  - **Body:** `{ "latitude": 22.7196, "longitude": 75.8577 }`
- **Endpoint 2 (Online Toggle):** `POST /api/v1/labour/location/status`
  - **Body:** `{ "availabilityStatus": "offline" }` (Options: `available`, `busy`, `offline`)
- **Auth:** `Labour` / `Contractor` (Bearer Token)

### 8. Accept Broadcast (FCFS)
Allows a labourer to accept a flash broadcast. The system uses First-Come, First-Serve.
- **Endpoint:** `POST /api/v1/broadcasts/:bookingId/accept`
- **Auth:** `Labour` / `Contractor` (Bearer Token)
- **Response:** Success if first, `409 Conflict` if another labourer already accepted it.

---

## Technical Notes for Frontend Developers:
1. **Cloudinary Uploads:** Before calling `createBooking`, if the user has photos, upload them as `multipart/form-data` to `POST /api/v1/uploads/media?folder=job-posters`. Extract the `data.asset.url` from the response and pass them as an array to `imageNames` in `createBooking`.
2. **GST Calculation:** The GST is calculated dynamically on the backend as `(basePrice * durationDays + platformFee) * gstPercentage / 100`. You just need to display the `taxes` field returned by the `/calculate-bill` endpoint. 
3. **Online Payment Fulfillment:** The backend automatically credits the labourer's self-wallet when a job is marked `COMPLETED` and the `paymentMethod` was `ONLINE`. You don't need to manually trigger any wallet endpoints for this.
4. **Flash Broadcast:** Broadcasts are now fired to ALL eligible labourers within the configured radius simultaneously. The first one to call the accept API gets the job.

### 9. Update Booking Status (Labour Only)
Labourers use this API to progress the job status.
- **Endpoint:** `PUT /api/v1/bookings/:id/status`
- **Auth:** `Labour` (Bearer Token)
- **Body for EN_ROUTE or CANCELLED:**
  ```json
  { "status": "EN_ROUTE" }
  ```
- **Body for STARTED (Requires Start OTP from Customer):**
  ```json
  { "status": "STARTED", "otp": "4921" }
  ```
- **Body for COMPLETED (Requires Completion OTP from Customer):**
  ```json
  { "status": "COMPLETED", "otp": "8390" }
  ```
- **Note:** Customers can see the `startOtp` and `completionOtp` in their `GET /api/v1/bookings/:id` API response. Labourers cannot see the OTP via the API; they must physically ask the customer.

---

## WebSocket (Socket.io) Events

The frontend must connect to the backend WebSocket server and listen for real-time events. Ensure you pass the user's JWT token during connection:
```javascript
const socket = io(BACKEND_URL, { auth: { token: 'YOUR_JWT_TOKEN' } })
```

### 1. Events for Customers (`Role: USER`)
- **`BOOKING_BROADCAST_STARTED`**
  - **Description:** Fired when the system finds eligible labourers and starts broadcasting.
  - **Payload:** `{ bookingId: "...", radiusKm: 10, eligibleCount: 5 }`
- **`BOOKING_ACCEPTED`**
  - **Description:** Fired when a labourer accepts the broadcast.
  - **Payload:** `{ bookingId: "...", laborId: "..." }`
  - **Action:** Fetch labourer details and update UI.
- **`BOOKING_STATUS_UPDATE`**
  - **Description:** Fired when the labourer updates the booking status (e.g., `EN_ROUTE`, `STARTED`, `COMPLETED`).
  - **Payload:** `{ bookingId: "...", status: "..." }`
  - **Action:** Update the job tracking progress bar.

### 2. Events for Labourers (`Role: LABOUR`)
- **`BOOKING_RECEIVED`**
  - **Description:** Fired when a flash broadcast falls within the labourer's radius and they are matched.
  - **Payload:** 
    ```json
    {
      "bookingId": "...",
      "basePrice": 800,
      "laborShare": 723.24,
      "address": { "locationText": "Sector 14...", "coordinates": [75.8, 22.7] },
      "type": "INSTANT",
      "timeoutMs": 60000
    }
    ```
  - **Action:** Show the "Accept/Reject" popup screen. The labourer has `timeoutMs` to respond using `POST /api/v1/broadcasts/:bookingId/accept`.
- **`BOOKING_EXPIRED`**
  - **Description:** Fired when another labourer accepted the job first, or the broadcast timed out.
  - **Payload:** `{ bookingId: "..." }`
  - **Action:** Remove the broadcast popup from the screen immediately.


# Frontend Integration Plan: Individual Booking Flow

This plan outlines the steps to replace the dummy local storage logic in `IndividualBookingFlowPage.jsx` with the fully operational real-time backend API and WebSockets we just built.

## Proposed Changes

### 1. New API Endpoints Integration (`bookingsApi.js`)
We will create or update RTK Query endpoints (or Axios calls) in `bookingsApi.js` for:
- `calculateBill`: `POST /api/v1/bookings/calculate`
- `createBooking`: `POST /api/v1/bookings`
- `getBookingStatus`: `GET /api/v1/bookings/:id` (for fetching OTPs and live status)

### 2. Remove Dummy Data (`IndividualBookingFlowPage.jsx`)
#### [MODIFY] `src/pages/app/booking/IndividualBookingFlowPage.jsx`
- Completely remove `simulateAccept()`, `loadIndividualBookings`, `saveIndividualBookings`, and `createIndividualBookingRecord` imports.
- Stop using the old `/workforce/requests` API mutation.

### 3. Step 3: Summary / Bill Calculation
#### [MODIFY] `src/pages/app/booking/IndividualBookingFlowPage.jsx`
- When the user reaches the "Summary" step, we will call the new `/api/v1/bookings/calculate` API to fetch the exact `taxes`, `platformFee`, and `totalAmount` calculated dynamically by the backend, rather than estimating it on the frontend.

### 4. Step 4: Booking Creation & Searching
#### [MODIFY] `src/pages/app/booking/IndividualBookingFlowPage.jsx`
- **Confirm Booking:** When the user clicks "Confirm Booking", call `POST /api/v1/bookings` with `paymentMethod`, `subcategoryId`, `type`, and `locationText`.
- **Searching State:** After creation, the frontend transitions to the `searching` step and connects to the **Socket.io** server.

### 5. WebSocket Integration (`useBookingSocket.js`)
#### [NEW] `src/hooks/useBookingSocket.js`
- Create a dedicated hook to listen to socket events.
- **`BOOKING_BROADCAST_STARTED`**: Update UI to show the search is actively scanning X km radius.
- **`BOOKING_ACCEPTED`**: Triggered when a labourer accepts the flash broadcast. Fetch the labourer details and transition the flow to `active`!
- **`BOOKING_STATUS_UPDATE`**: Update the step progress bar (EN_ROUTE, STARTED, COMPLETED) in real-time.

### 6. Job Tracking & OTP Display
#### [MODIFY] `src/pages/app/booking/IndividualBookingFlowPage.jsx` (Active Step)
- In the `active` state screen, we will fetch the booking details using the ID from the URL.
- We will display the `startOtp` and `completionOtp` prominently on the screen so the customer can read them out to the labourer.

## User Review Required
> [!IMPORTANT]
> The current dummy code allows picking a "Smart Match" vs "Manual Pick" of workers. Since our backend uses a purely radius-based **Flash Broadcast** (First-Come, First-Serve), we will remove the "Manual Pick" logic and route all bookings through the flash broadcast engine. Do you approve this UI simplification?
