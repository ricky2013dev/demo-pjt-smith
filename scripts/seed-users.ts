import { db } from "../backend/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface TestUser {
  email: string;
  username: string;
  password: string;
  role: "dental" | "insurance" | "admin";
}

const getTestUsersFromEnv = (): TestUser[] => {
  const testUsers: TestUser[] = [];

  // Dental user
  if (process.env.SEED_DENTAL_EMAIL && process.env.SEED_DENTAL_USERNAME && process.env.SEED_DENTAL_PASSWORD) {
    testUsers.push({
      email: process.env.SEED_DENTAL_EMAIL,
      username: process.env.SEED_DENTAL_USERNAME,
      password: process.env.SEED_DENTAL_PASSWORD,
      role: "dental"
    });
  }

  // Insurance user
  if (process.env.SEED_INSURANCE_EMAIL && process.env.SEED_INSURANCE_USERNAME && process.env.SEED_INSURANCE_PASSWORD) {
    testUsers.push({
      email: process.env.SEED_INSURANCE_EMAIL,
      username: process.env.SEED_INSURANCE_USERNAME,
      password: process.env.SEED_INSURANCE_PASSWORD,
      role: "insurance"
    });
  }

  // Admin user
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_USERNAME && process.env.SEED_ADMIN_PASSWORD) {
    testUsers.push({
      email: process.env.SEED_ADMIN_EMAIL,
      username: process.env.SEED_ADMIN_USERNAME,
      password: process.env.SEED_ADMIN_PASSWORD,
      role: "admin"
    });
  }

  return testUsers;
};

const seedTestUsers = async () => {
  const testUsers = getTestUsersFromEnv();

  if (testUsers.length === 0) {
    console.log("No seed users configured in environment variables. Skipping.");
    return;
  }

  console.log(`Seeding ${testUsers.length} test user(s)...`);

  for (const user of testUsers) {
    try {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (existingUser.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.insert(users).values({
          email: user.email,
          username: user.username,
          password: hashedPassword,
          role: user.role,
          stediMode: "mockup"
        });
        console.log(`Created ${user.role} user: ${user.email}`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    } catch (error) {
      console.error(`Failed to create user ${user.email}:`, error);
    }
  }

  console.log("Seed complete.");
};

seedTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
