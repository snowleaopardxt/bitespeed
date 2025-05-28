# Bitespeed Contact Identification Service

This service helps identify and link customer contacts across multiple purchases, even when they use different email addresses or phone numbers.

## Features

- Identifies and links customer contacts based on email or phone number
- Maintains primary and secondary contact relationships
- Consolidates contact information across multiple records
- RESTful API endpoint for contact identification

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a PostgreSQL database named "bitespeed"

4. Create a `.env` file in the root directory with the following variables:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=bitespeed
   PORT=3000
   ```

5. Build the project:
   ```bash
   npm run build
   ```

6. Start the server:
   ```bash
   npm start
   ```

For development with hot-reload:
```bash
npm run dev
```

## API Usage

### Identify Contact

**Endpoint:** `POST /identify`

**Request Body:**
```json
{
    "email": "example@email.com",
    "phoneNumber": "1234567890"
}
```

Note: At least one of `email` or `phoneNumber` must be provided.

**Response:**
```json
{
    "contact": {
        "primaryContatctId": 1,
        "emails": ["primary@email.com", "secondary@email.com"],
        "phoneNumbers": ["1234567890", "0987654321"],
        "secondaryContactIds": [2, 3]
    }
}
```

## Testing

Run the test suite:
```bash
npm test
``` 