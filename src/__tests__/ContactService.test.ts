import { ContactService } from "../services/ContactService";
import { AppDataSource } from "../data-source";
import { Repository, In } from "typeorm";
import { Contact } from "../entities/Contact";

describe("ContactService", () => {
    let contactService: ContactService;

    beforeAll(async () => {
        // Initialize database connection for tests
        if (!AppDataSource.isInitialized) {
             try {
                await AppDataSource.initialize();
             } catch (error) {
                console.error("Error during database initialization in beforeAll:", error);
                throw error; // Re-throw the error to fail the test suite
             }
        }
        contactService = new ContactService();
    });

    afterAll(async () => {
        // Close database connection after tests
        if (AppDataSource.isInitialized) {
             try {
                await AppDataSource.destroy();
             } catch (error) {
                console.error("Error during database destruction in afterAll:", error);
                // Don't re-throw here, as other cleanup might still be needed
             }
        }
    });

    beforeEach(async () => {
        // Clear the database before each test
        try {
            await AppDataSource.getRepository(Contact).clear();
        } catch (error) {
            console.error("Error during repository clear in beforeEach:", error);
             throw error; // Re-throw the error to fail the test
        }
    });

    it("should create a new primary contact", async () => {
        const result = await contactService.identify({
            email: "test1@example.com",
            phoneNumber: "111111"
        });

        expect(result.contact.primaryContatctId).toBeDefined();
        expect(result.contact.emails).toEqual(["test1@example.com"]);
        expect(result.contact.phoneNumbers).toEqual(["111111"]);
        expect(result.contact.secondaryContactIds).toHaveLength(0);

        const contactsInDb = await AppDataSource.getRepository(Contact).find();
        expect(contactsInDb).toHaveLength(1);
        expect(contactsInDb[0].email).toBe("test1@example.com");
        expect(contactsInDb[0].phoneNumber).toBe("111111");
        expect(contactsInDb[0].linkPrecedence).toBe("primary");
        expect(contactsInDb[0].linkedId).toBeNull();
    });

    it("should link by email", async () => {
        // Create initial primary contact
        const initial = await contactService.identify({
            email: "primary@example.com",
            phoneNumber: "111111"
        });

        // Identify with matching email, new phone
        const result = await contactService.identify({
            email: "primary@example.com",
            phoneNumber: "222222"
        });

        const primaryId = initial.contact.primaryContatctId;

        expect(result.contact.primaryContatctId).toBe(primaryId);
        expect(result.contact.emails).toEqual(["primary@example.com"]);
        expect(result.contact.phoneNumbers).toEqual(["111111", "222222"]);
        expect(result.contact.secondaryContactIds).toHaveLength(1);

        const contactsInDb = await AppDataSource.getRepository(Contact).find({ order: { createdAt: "ASC" } });
        expect(contactsInDb).toHaveLength(2);
        expect(contactsInDb[0].linkPrecedence).toBe("primary");
        expect(contactsInDb[1].linkPrecedence).toBe("secondary");
        expect(contactsInDb[1].linkedId).toBe(primaryId);
        expect(result.contact.secondaryContactIds).toContain(contactsInDb[1].id);
    });

    it("should link by phone", async () => {
        // Create initial primary contact
        const initial = await contactService.identify({
            email: "primary@example.com",
            phoneNumber: "111111"
        });

        // Identify with matching phone, new email
        const result = await contactService.identify({
            email: "secondary@example.com",
            phoneNumber: "111111"
        });

        const primaryId = initial.contact.primaryContatctId;

        expect(result.contact.primaryContatctId).toBe(primaryId);
        expect(result.contact.emails).toEqual(["primary@example.com", "secondary@example.com"]);
        expect(result.contact.phoneNumbers).toEqual(["111111"]);
        expect(result.contact.secondaryContactIds).toHaveLength(1);

        const contactsInDb = await AppDataSource.getRepository(Contact).find({ order: { createdAt: "ASC" } });
        expect(contactsInDb).toHaveLength(2);
        expect(contactsInDb[0].linkPrecedence).toBe("primary");
        expect(contactsInDb[1].linkPrecedence).toBe("secondary");
        expect(contactsInDb[1].linkedId).toBe(primaryId);
        expect(result.contact.secondaryContactIds).toContain(contactsInDb[1].id);
    });

    it("should link two primaries", async () => {
        // Create first primary contact
        const primary1 = await contactService.identify({
            email: "george@hillvalley.edu",
            phoneNumber: "919191"
        });

        // Create second primary contact
        const primary2 = await contactService.identify({
            email: "biffsucks@hillvalley.edu",
            phoneNumber: "717171"
        });

        // Introduce a request that links the two primaries
        const result = await contactService.identify({
            email: "george@hillvalley.edu",
            phoneNumber: "717171"
        });

        // The older primary should remain primary
        const olderPrimaryId = primary1.contact.primaryContatctId;

        expect(result.contact.primaryContatctId).toBe(olderPrimaryId);
        expect(result.contact.emails).toEqual(["george@hillvalley.edu", "biffsucks@hillvalley.edu"]);
        expect(result.contact.phoneNumbers).toEqual(["919191", "717171"]);
        expect(result.contact.secondaryContactIds).toHaveLength(1);

        const contactsInDb = await AppDataSource.getRepository(Contact).find({ order: { createdAt: "ASC" } });
        expect(contactsInDb).toHaveLength(2);

        const finalPrimary = contactsInDb.find(c => c.id === olderPrimaryId);
        const finalSecondary = contactsInDb.find(c => c.id !== olderPrimaryId);

        expect(finalPrimary!.linkPrecedence).toBe("primary");
        expect(finalPrimary!.linkedId).toBeNull();

        expect(finalSecondary!.linkPrecedence).toBe("secondary");
        expect(finalSecondary!.linkedId).toBe(olderPrimaryId);
        expect(result.contact.secondaryContactIds).toContain(finalSecondary!.id);
    });

    it("should handle subsequent requests for a linked group", async () => {
        // Create first primary
        await contactService.identify({
            email: "p1@example.com",
            phoneNumber: "111"
        });

        // Link a secondary
        const linked = await contactService.identify({
            email: "s1@example.com",
            phoneNumber: "111"
        });

        const primaryId = linked.contact.primaryContatctId;
        const secondaryId = linked.contact.secondaryContactIds[0];

        // Request using the secondary contact's details
        const result = await contactService.identify({
            email: "s1@example.com",
            phoneNumber: "111"
        });

        expect(result.contact.primaryContatctId).toBe(primaryId);
        expect(result.contact.emails).toEqual(["p1@example.com", "s1@example.com"]);
        expect(result.contact.phoneNumbers).toEqual(["111"]);
        expect(result.contact.secondaryContactIds).toEqual([secondaryId]);

        // Add a new email to the group
        const result2 = await contactService.identify({
            email: "s2@example.com",
            phoneNumber: "111"
        });

        expect(result2.contact.primaryContatctId).toBe(primaryId);
        expect(result2.contact.emails).toEqual(["p1@example.com", "s1@example.com", "s2@example.com"]);
        expect(result2.contact.phoneNumbers).toEqual(["111"]);
        expect(result2.contact.secondaryContactIds).toHaveLength(2);
        expect(result2.contact.secondaryContactIds).toContain(secondaryId);
        // Check that a new secondary contact was created for s2@example.com
        const contactsInDb = await AppDataSource.getRepository(Contact).find({ where: { email: "s2@example.com" } });
        expect(contactsInDb).toHaveLength(1);
        expect(contactsInDb[0].linkPrecedence).toBe("secondary");
        expect(contactsInDb[0].linkedId).toBe(primaryId);
        expect(result2.contact.secondaryContactIds).toContain(contactsInDb[0].id);
    });
}); 