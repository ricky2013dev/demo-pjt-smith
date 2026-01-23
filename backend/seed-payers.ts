
import { storage } from "./storage";

const PAYER_LIST = [
    {
        payerId: "60054",
        name: "Aetna Dental"
    },
    {
        payerId: "AMERI",
        name: "Ameritas Dental"
    },
    {
        payerId: "84056",
        name: "Blue Cross Blue Shield of Texas (Dental)"
    },
    {
        payerId: "PNMDV",
        name: "Cigna Dental"
    },
    {
        payerId: "52158",
        name: "Delta Dental Insurance Co"
    },
    {
        payerId: "39046",
        name: "Guardian Dental"
    },
    {
        payerId: "93693",
        name: "Humana Dental"
    },
    {
        payerId: "11180",
        name: "MetLife Dental"
    },
    {
        payerId: "66035",
        name: "Principal Financial Group (Dental)"
    },
    {
        payerId: "65083",
        name: "United Concordia"
    },
    {
        payerId: "52133",
        name: "UnitedHealthcare Dental"
    }
];

export async function seedPayers() {
    try {
        console.log("Seeding payers...");
        await storage.seedPayers(PAYER_LIST);
        console.log("Payers seeded successfully.");
    } catch (error) {
        console.error("Error seeding payers:", error);
    }
}
