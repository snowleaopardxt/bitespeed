import "reflect-metadata";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { ContactService } from "./services/ContactService";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log("Database connection initialized");
    })
    .catch((error) => {
        console.error("Error during database initialization:", error);
    });

const contactService = new ContactService();

app.post("/identify", async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;
        
        // Validate request
        if (!email && !phoneNumber) {
            return res.status(400).json({
                error: "Either email or phoneNumber must be provided"
            });
        }

        const result = await contactService.identify({ email, phoneNumber });
        res.json(result);
    } catch (error) {
        console.error("Error in /identify endpoint:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 