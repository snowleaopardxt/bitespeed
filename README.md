# 🔬 Bitespeed Identity Reconciliation Service

This service is designed to solve the challenge of identifying and linking customer contacts across multiple purchases, even when they use different email addresses or phone numbers. It consolidates contact information and maintains primary/secondary relationships in a relational database.

---

## ✨ Features

*   **Intelligent Linking:** Identifies and links contacts based on shared email or phone numbers.
*   **Primary/Secondary Management:** Tracks relationships, promoting the oldest contact as primary.
*   **Data Consolidation:** Provides a unified view of all contact information (emails, phone numbers) for a linked group.
*   **RESTful API:** Exposes a simple `/identify` endpoint for integration.
*   **Scalable Stack:** Built with Node.js, TypeScript, and TypeORM for a PostgreSQL database.

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing.

### Prerequisites

*   Node.js (v14 or higher)
*   A PostgreSQL database instance (local or cloud, e.g., [Neon](https://neon.tech/))
*   npm or yarn package manager

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
    *   Ensure your database is accessible.

4.  Create a `.env` file in the root directory with your database credentials and desired port:
    ```dotenv
    DB_HOST=your_db_host
    DB_PORT=your_db_port # e.g., 5432
    DB_USERNAME=your_db_username
    DB_PASSWORD=your_db_password
    DB_DATABASE=bitespeed
    PORT=3000 # or 3001
    ```
    *(Note: Do not commit your `.env` file to Git. It's already included in `.gitignore`)*

5.  Build the TypeScript project:
    ```bash
    npm run build
    ```

6.  Start the server:
    ```bash
    npm start
    ```

The server will run on the port specified in your `.env` file (defaulting to 3000).

For development with hot-reloading:
```bash
npm run dev
```

## 💡 API Usage

The service exposes a single endpoint for contact identification.

### `POST /identify`

Identifies and consolidates contact information based on the provided email and/or phone number.

*   **URL:** `<Your Deployed Endpoint URL Here>/identify` (Replace with the actual URL once deployed)
*   **Method:** `POST`
*   **Body:** `application/json`

**Request Body Example:**

```json
{
    "email": "example@email.com",
    "phoneNumber": "1234567890"
}
```

*Note: At least one of `email` or `phoneNumber` must be provided.* The `phoneNumber` should be sent as a string.

**Response Body Example (HTTP 200):**

```json
{
    "contact": {
        "primaryContatctId": 1,
        "emails": ["primary@email.com","secondary@email.com"],
        "phoneNumbers": ["1234567890","0987654321"],
        "secondaryContactIds": [2, 3]
    }
}
```

## ✅ Running Tests

To ensure the contact linking logic is functioning correctly, run the test suite:

```bash
npm test
```

Make sure your database is accessible for the tests to run.

---

## Deployment

This application can be deployed to services like Render.com. Ensure environment variables for the database connection are configured on the hosting platform.

---

## Contributing

Feel free to fork the repository and contribute!

---

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

--- 