import { Contact } from "../entities/Contact";
import { AppDataSource } from "../data-source";
import { Repository } from "typeorm";

interface IdentifyRequest {
    email?: string;
    phoneNumber?: string;
}

interface IdentifyResponse {
    contact: {
        primaryContatctId: number;
        emails: string[];
        phoneNumbers: string[];
        secondaryContactIds: number[];
    };
}

export class ContactService {
    private contactRepository: Repository<Contact>;

    constructor() {
        this.contactRepository = AppDataSource.getRepository(Contact);
    }

    async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
        const { email, phoneNumber } = request;

        const findConditions: any[] = [];
        if (email) {
            findConditions.push({ email: email });
        }
        if (phoneNumber) {
            findConditions.push({ phoneNumber: phoneNumber });
        }

        // This validation should ideally happen before calling the service
        if (findConditions.length === 0) {
             throw new Error("Either email or phoneNumber must be provided");
        }

        // Find contacts matching either email or phone, ordered by creation date
        const matchingContacts = await this.contactRepository.find({
            where: findConditions,
            order: { createdAt: "ASC" }
        });

        // If no matching contacts, create a new primary
        if (matchingContacts.length === 0) {
            const newContact = await this.contactRepository.save({
                email,
                phoneNumber,
                linkPrecedence: "primary"
            });

            return {
                contact: {
                    primaryContatctId: newContact.id,
                    emails: [newContact.email].filter(Boolean) as string[],
                    phoneNumbers: [newContact.phoneNumber].filter(Boolean) as string[],
                    secondaryContactIds: []
                }
            };
        }

        // Determine the true primary contact for the group
        let primaryContact = matchingContacts.find(c => c.linkPrecedence === "primary");

        if (!primaryContact) {
             // If no existing primary among matches, the oldest matched contact becomes the primary
            primaryContact = matchingContacts[0];
            // Ensure this contact is marked as primary in DB if needed
            if (primaryContact.linkPrecedence !== "primary") {
                 await this.contactRepository.update(primaryContact.id, { linkPrecedence: "primary", linkedId: null });
                 primaryContact.linkPrecedence = "primary"; // Update object in memory
                 primaryContact.linkedId = null; // Update object in memory
            }

             // Any other matched contacts that were primary should become secondary
             const secondaryUpdates = matchingContacts
                 .filter(c => c.id !== primaryContact!.id && c.linkPrecedence !== "secondary")
                 .map(c => ({
                     id: c.id,
                     linkPrecedence: "secondary" as "secondary",
                     linkedId: primaryContact!.id
                 }));

             if(secondaryUpdates.length > 0) {
                  await this.contactRepository.save(secondaryUpdates);
             }
             // Update objects in memory
             secondaryUpdates.forEach(update => {
                  const contactToUpdate = matchingContacts.find(c => c.id === update.id);
                  if(contactToUpdate) { // Should always find
                       contactToUpdate.linkPrecedence = "secondary";
                       contactToUpdate.linkedId = primaryContact!.id;
                  }
             });

        } else {
             // Existing primary found. Link any other matched contacts to this primary.
             // Also handle if a younger primary was linked - it becomes secondary.
             const contactsToMakeSecondary = matchingContacts
                 .filter(c => c.id !== primaryContact!.id && (c.linkPrecedence === "primary" || c.linkedId !== primaryContact!.id)) // Filter contacts that need linking or demoting
                 .map(c => ({
                     id: c.id,
                     linkPrecedence: "secondary" as "secondary",
                     linkedId: primaryContact!.id
                 }));

             if(contactsToMakeSecondary.length > 0) {
                  await this.contactRepository.save(contactsToMakeSecondary);
             }
              // Update objects in memory
             contactsToMakeSecondary.forEach(update => {
                  const contactToUpdate = matchingContacts.find(c => c.id === update.id);
                  if(contactToUpdate) { // Should always find
                       contactToUpdate.linkPrecedence = "secondary";
                       contactToUpdate.linkedId = primaryContact!.id;
                  }
             });
        }

        // Find all contacts related to the determined primary (including itself and its secondaries)
        const allRelatedContacts = await this.contactRepository.find({
             where: [
                 { id: primaryContact.id },
                 { linkedId: primaryContact.id }
             ],
             order: { createdAt: "ASC" } // Maintain chronological order
        });

        // Check if the incoming email/phone are new to this linked group
        const emailAlreadyExistsInGroup = email ? allRelatedContacts.some(c => c.email === email) : true; // Assume exists if no email provided in request
        const phoneAlreadyExistsInGroup = phoneNumber ? allRelatedContacts.some(c => c.phoneNumber === phoneNumber) : true; // Assume exists if no phone provided in request

        // If either is new, create a new secondary contact unless an exact duplicate already exists in the group
        if (!emailAlreadyExistsInGroup || !phoneAlreadyExistsInGroup) {
             const exactMatchExists = allRelatedContacts.some(c => c.email === email && c.phoneNumber === phoneNumber); // Prevent duplicate secondary

             if (!exactMatchExists) {
                 const newSecondaryContact = await this.contactRepository.save({
                     email,
                     phoneNumber,
                     linkedId: primaryContact.id,
                     linkPrecedence: "secondary"
                 });
                 // Add the new contact to our list for consolidation
                 allRelatedContacts.push(newSecondaryContact);
             }
        }

        // Collect all unique emails and phone numbers from the final set of related contacts
        const emails = Array.from(new Set(allRelatedContacts.map(c => c.email).filter(Boolean))) as string[];
        const phoneNumbers = Array.from(new Set(allRelatedContacts.map(c => c.phoneNumber).filter(Boolean))) as string[];

        // Sort collected emails and phone numbers by the creation date of their corresponding contacts for consistent output
        const sortedEmails = emails.sort((a, b) => {
            const contactA = allRelatedContacts.find(c => c.email === a);
            const contactB = allRelatedContacts.find(c => c.email === b);
            // If a contact isn't found (shouldn't happen with .filter(Boolean)), handle gracefully.
            if (!contactA || !contactB) return 0;
            return contactA.createdAt.getTime() - contactB.createdAt.getTime();
        });

        const sortedPhoneNumbers = phoneNumbers.sort((a, b) => {
            const contactA = allRelatedContacts.find(c => c.phoneNumber === a);
            const contactB = allRelatedContacts.find(c => c.phoneNumber === b);
             // If a contact isn't found, handle gracefully.
            if (!contactA || !contactB) return 0;
            return contactA.createdAt.getTime() - contactB.createdAt.getTime();
        });

        // Get all secondary contact IDs related to the primary
        const secondaryContactIds = allRelatedContacts
            .filter(c => c.id !== primaryContact!.id)
            .map(c => c.id);

        // Ensure primary contact's email and phone (if they exist) are first in the final list
        const finalEmails = primaryContact.email ? [primaryContact.email, ...sortedEmails.filter(e => e !== primaryContact.email)] : sortedEmails;
        const finalPhoneNumbers = primaryContact.phoneNumber ? [primaryContact.phoneNumber, ...sortedPhoneNumbers.filter(p => p !== primaryContact.phoneNumber)] : sortedPhoneNumbers;


        return {
            contact: {
                primaryContatctId: primaryContact.id,
                emails: finalEmails,
                phoneNumbers: finalPhoneNumbers,
                secondaryContactIds: secondaryContactIds
            }
        };
    }
} 