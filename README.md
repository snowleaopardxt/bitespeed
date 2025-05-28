# Bitespeed Identity Reconciliation Service

This service identifies and links customer contacts based on their email and phone numbers. It helps consolidate contact information from multiple purchases, maintaining a history by linking secondary contacts to a primary record.

---

## Key Features

*   Identifies and links contacts using email or phone.
*   Manages primary and secondary contact relationships.
*   Consolidates contact details for a single customer.
*   Provides a `/identify` API endpoint.
*   Built with Node.js, TypeScript, and TypeORM for PostgreSQL.

## Getting Started

Follow these steps to get the project running locally.

### Prerequisites

*   Node.js (v14+)
*   PostgreSQL database
*   npm or yarn

### Setup

1.  Clone the repository:
    ```bash
    git clone <Your Repository URL Here>
    cd bitespeed
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up your PostgreSQL database:
    *   Create a database named `bitespeed`.
    *   Ensure it's accessible.

4.  Create a `.env` file in the project root with your database credentials and server port:
    ```dotenv
    DB_HOST=your_db_host
    DB_PORT=your_db_port # e.g., 5432
    DB_USERNAME=your_db_username
    DB_PASSWORD=your_db_password
    DB_DATABASE=bitespeed
    PORT=3000 # or any available port
    ```
    *(Do not commit `.env` to Git. It's in `.gitignore`)*

5.  Build the project:
    ```bash
    npm run build
    ```

6.  Start the server:
    ```bash
    npm start
    ```

The server will listen on the port specified in your `.env` file.

For development with hot-reloading, use:
```bash
npm run dev
```

## API Endpoint

The primary API endpoint is `/identify`.

### `POST /identify`

Processes incoming contact information and returns consolidated details.

*   **URL:** `<Your Deployed Endpoint URL Here>/identify`
*   **Method:** `POST`
*   **Content-Type:** `application/json`

**Request Body Example:**

```json
{
    "email": "test@example.com",
    "phoneNumber": "1234567890"
}
```

*Note: Provide at least an `email` or a `phoneNumber`.*

**Successful Response (HTTP 200):**

```json
{
    "contact": {
        "primaryContatctId": 1,
        "emails": ["primary@example.com","secondary@example.com"],
        "phoneNumbers": ["1234567890","0987654321"],
        "secondaryContactIds": [2, 3]
    }
}
```

## Running Tests

Run the test suite to verify the linking logic:

```bash
npm test
```

Ensure your database is accessible for tests.

---

## Deployment

This service is suitable for deployment on platforms supporting Node.js web services and PostgreSQL, such as Render.com or similar services.

---

## License

MIT License - see `LICENSE.md` 