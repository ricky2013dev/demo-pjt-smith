import { storage } from "./storage";
import { type InsertProvider } from "@shared/schema";

export async function seedProviders() {
    const providers: InsertProvider[] = [
        {
            name: "Provider Name",
            npiNumber: "1999999984",
            faxNumber: null,
            phoneNumber: null,
            address: null,
            taxNumber: null
        }
    ];

    await storage.seedProviders(providers);
}
