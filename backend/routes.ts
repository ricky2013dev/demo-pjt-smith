import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  transactions,
  transactionDataVerified,
  callCommunications,
  patients,
  ifCallTransactionList,
  ifCallCoverageCodeList,
  ifCallMessageList,
  coverageByCode,
  insurances
} from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import axios from "axios";
import { readFileSync } from "fs";
import { join } from "path";
import { encrypt, decrypt, maskSensitiveData } from "./crypto";
import multer from "multer";
import { processInsuranceCard } from "./ocr";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed test users if they don't exist
  const seedTestUsers = async () => {
    try {
      const dentalUser = await storage.getUserByEmail("dental@smithai.com");
      if (!dentalUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          email: "dental@smithai.com",
          username: "dental_admin",
          password: hashedPassword,
          role: "dental",
          dataSource: null
        });
      }

      const insuranceUser = await storage.getUserByEmail("insurance@smithai.com");
      if (!insuranceUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          email: "insurance@smithai.com",
          username: "insurance_admin",
          password: hashedPassword,
          role: "insurance",
          dataSource: null
        });
      }

      const adminUser = await storage.getUserByEmail("admin@smithai.com");
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          email: "admin@smithai.com",
          username: "admin",
          password: hashedPassword,
          role: "admin",
          dataSource: null
        });
      }
    } catch (error) {
    }
  };

  // Seed test users on startup
  await seedTestUsers();

  // Authentication routes
  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: User login
   *     description: Authenticate user with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: dental@smithai.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: admin123
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Email and password required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Store user in session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      (req.session as any).userEmail = user.email;

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  /**
   * @openapi
   * /api/auth/logout:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: User logout
   *     description: Log out the current user and destroy session
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *       500:
   *         description: Failed to logout
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  /**
   * @openapi
   * /api/auth/verify:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Verify session
   *     description: Verify the current user session and return user information
   *     responses:
   *       200:
   *         description: Session verified
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated or user not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to verify session
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          username: user.username,
          dataSource: user.dataSource
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify session" });
    }
  });

  // Middleware to check if user is admin
  const requireAdmin = (req: any, res: any, next: any) => {
    const userRole = req.session?.userRole;
    if (userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  // User management routes (admin only)
  /**
   * @openapi
   * /api/users:
   *   get:
   *     tags:
   *       - User Management
   *     summary: Get all users (Admin only)
   *     description: Retrieve all users in the system (admin access required)
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *       403:
   *         description: Admin access required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to fetch users
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords to the client
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json({ success: true, users: safeUsers });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  /**
   * @openapi
   * /api/users:
   *   post:
   *     tags:
   *       - User Management
   *     summary: Create a new user (Admin only)
   *     description: Create a new user account (admin access required)
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - username
   *               - password
   *               - role
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: newuser@smithai.com
   *               username:
   *                 type: string
   *                 example: newuser
   *               password:
   *                 type: string
   *                 format: password
   *                 example: password123
   *               role:
   *                 type: string
   *                 enum: [admin, dental, insurance]
   *                 example: dental
   *               dataSource:
   *                 type: string
   *                 nullable: true
   *                 example: null
   *     responses:
   *       200:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error or user already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Admin access required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const { email, username, password, role, dataSource } = req.body;

      if (!email || !username || !password || !role) {
        return res.status(400).json({ error: "Email, username, password, and role are required" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        role,
        dataSource: dataSource || null
      });

      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { email, username, role, dataSource } = req.body;

      // Check if trying to update to existing email
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail && existingEmail.id !== id) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }

      // Check if trying to update to existing username
      if (username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername && existingUsername.id !== id) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }

      const updates: any = {};
      if (email) updates.email = email;
      if (username) updates.username = username;
      if (role) updates.role = role;
      if (dataSource !== undefined) updates.dataSource = dataSource;

      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deleting own account
      const currentUserId = (req.session as any)?.userId;
      if (id === currentUserId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.put("/api/users/:id/password", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.updateUserPassword(id, hashedPassword);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // Get all patients for a specific user (Admin only)
  app.get("/api/admin/users/:userId/patients", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all patients for this user
      const patients = await storage.getPatientsByUserId(userId);

      // Get all related data for each patient
      const patientsWithData = await Promise.all(patients.map(async (patient) => {
        const [telecoms, addresses, insurances] = await Promise.all([
          storage.getPatientTelecoms(patient.id),
          storage.getPatientAddresses(patient.id),
          storage.getPatientInsurances(patient.id),
        ]);

        return {
          ...patient,
          telecoms,
          addresses,
          insurances,
        };
      }));

      res.json({ success: true, patients: patientsWithData });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Configure multer for insurance card file uploads (in-memory only, HIPAA compliant)
  const upload = multer({
    storage: multer.memoryStorage(), // In-memory only, never persist to disk
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
      files: 1 // Single file only
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        cb(new Error('Only JPEG, PNG, and PDF files are supported'));
      } else {
        cb(null, true);
      }
    }
  });

  // Helper function to generate next patient ID in format P0000001
  const generateNextPatientId = async (userId: string): Promise<string> => {
    // Query ALL patients globally (not just for current user) since patient IDs are globally unique
    const allPatients = await db.select({ id: patients.id }).from(patients);

    if (allPatients.length === 0) {
      return 'P0000001';
    }

    // Extract all numeric IDs from existing patient IDs
    const numericIds = allPatients
      .map(p => p.id)
      .filter(id => id.startsWith('P'))
      .map(id => parseInt(id.substring(1), 10))
      .filter(num => !isNaN(num));

    // Find the highest ID number
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;

    // Generate next ID with zero-padding (7 digits total: P + 0000001)
    const nextId = maxId + 1;
    return `P${nextId.toString().padStart(7, '0')}`;
  };

  // Patient management routes
  /**
   * @openapi
   * /api/patients:
   *   get:
   *     tags:
   *       - Patients
   *     summary: Get all patients
   *     description: Retrieve all patients for the authenticated user with their complete data including telecoms, addresses, insurance, appointments, and treatments
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Patients retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 patients:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Patient'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to fetch patients
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/patients", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const patients = await storage.getPatientsByUserId(userId);

      // Get all related data for each patient
      const patientsWithData = await Promise.all(patients.map(async (patient) => {
        const [telecoms, addresses, insurances, appointments, treatments, verificationStatus, coverageDetail] = await Promise.all([
          storage.getPatientTelecoms(patient.id),
          storage.getPatientAddresses(patient.id),
          storage.getPatientInsurances(patient.id),
          storage.getPatientAppointments(patient.id),
          storage.getPatientTreatments(patient.id),
          storage.getPatientVerificationStatus(patient.id),
          storage.getCoverageDetailByPatientId(patient.id)
        ]);

        let procedures: any[] = [];
        if (coverageDetail) {
          procedures = await storage.getProceduresByCoverageId(coverageDetail.id);
        }

        // Transform addresses from DB format (line1, line2) to client format (line: string[])
        const transformedAddresses = addresses.map(addr => ({
          line: [addr.line1, addr.line2].filter(Boolean) as string[],
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode
        }));

        // Transform insurances from DB format to client format
        // DB: flat fields → Client: nested coverage object
        const transformedInsurances = insurances.map(ins => ({
          id: ins.id,
          type: ins.type,
          provider: ins.provider,
          policyNumber: ins.policyNumber ? '************' : null, // Masked (HIPAA)
          policyNumberEncrypted: !!ins.policyNumber,
          groupNumber: ins.groupNumber ? '********' : null, // Masked (HIPAA)
          groupNumberEncrypted: !!ins.groupNumber,
          subscriberName: ins.subscriberName,
          subscriberId: ins.subscriberId ? '**********' : null, // Masked (HIPAA)
          subscriberIdEncrypted: !!ins.subscriberId,
          relationship: ins.relationship,
          effectiveDate: ins.effectiveDate,
          expirationDate: ins.expirationDate,
          coverage: {
            deductible: ins.deductible || '',
            deductibleMet: ins.deductibleMet || '',
            maxBenefit: ins.maxBenefit || '',
            preventiveCoverage: ins.preventiveCoverage || '',
            basicCoverage: ins.basicCoverage || '',
            majorCoverage: ins.majorCoverage || ''
          }
        }));

        // Transform patient from DB format to client format
        // DB: { givenName, familyName } → Client: { name: { given: string[], family: string } }
        const givenNames = patient.givenName ? patient.givenName.split(' ') : [];

        // Mask sensitive data (HIPAA-compliant) - don't send decrypted data
        // Mask telecom data (phone, email)
        const maskedTelecoms = telecoms.map(t => ({
          system: t.system,
          value: t.system === 'phone' ? '(***) ***-****' : t.system === 'email' ? '****@****.***' : t.value,
          encrypted: t.system === 'phone' || t.system === 'email' // Mark as encrypted for UI
        }));

        return {
          id: patient.id,
          active: patient.active,
          name: {
            given: givenNames,
            family: patient.familyName
          },
          gender: patient.gender,
          birthDate: patient.birthDate ? '****-**-**' : null, // Masked (HIPAA)
          birthDateEncrypted: !!patient.birthDate,
          ssn: patient.ssn ? '***-**-****' : null, // Masked (HIPAA)
          ssnEncrypted: !!patient.ssn,
          telecom: maskedTelecoms,
          address: transformedAddresses,
          insurance: transformedInsurances,
          appointments,
          treatments,
          coverage: coverageDetail ? {
            annual_maximum: coverageDetail.annualMaximum ? parseFloat(coverageDetail.annualMaximum) : 0,
            annual_used: coverageDetail.annualUsed ? parseFloat(coverageDetail.annualUsed) : 0,
            deductible: coverageDetail.deductible ? parseFloat(coverageDetail.deductible) : 0,
            deductible_met: coverageDetail.deductibleMet ? parseFloat(coverageDetail.deductibleMet) : 0,
            procedures: procedures.map(p => ({
              code: p.code,
              name: p.name,
              category: p.category,
              coverage: p.coverage || '',
              estimated_cost: p.estimatedCost || '',
              patient_pays: p.patientPays || ''
            }))
          } : undefined,
          verificationStatus
        };
      }));

      res.json({ success: true, patients: patientsWithData });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  /**
   * @openapi
   * /api/patients:
   *   post:
   *     tags:
   *       - Patients
   *     summary: Create a new patient
   *     description: Create a new patient record with optional telecoms, addresses, insurance, appointments, and treatments
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - patient
   *             properties:
   *               patient:
   *                 type: object
   *                 properties:
   *                   active:
   *                     type: boolean
   *                     example: true
   *                   name:
   *                     type: object
   *                     properties:
   *                       given:
   *                         type: array
   *                         items:
   *                           type: string
   *                         example: ["John", "Michael"]
   *                       family:
   *                         type: string
   *                         example: "Doe"
   *                   gender:
   *                     type: string
   *                     enum: [male, female, other]
   *                     example: male
   *                   birthDate:
   *                     type: string
   *                     format: date
   *                     example: "1990-05-15"
   *                   ssn:
   *                     type: string
   *                     example: "123-45-6789"
   *               telecoms:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     system:
   *                       type: string
   *                       enum: [phone, email]
   *                     value:
   *                       type: string
   *               addresses:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     line:
   *                       type: array
   *                       items:
   *                         type: string
   *                     city:
   *                       type: string
   *                     state:
   *                       type: string
   *                     postalCode:
   *                       type: string
   *               insurances:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/Insurance'
   *     responses:
   *       200:
   *         description: Patient created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 patient:
   *                   type: object
   *       400:
   *         description: Patient data is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/patients", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const { patient, telecoms, addresses, insurances, appointments, treatments, verificationStatus } = req.body;

      if (!patient) {
        return res.status(400).json({ error: "Patient data is required" });
      }

      // Auto-generate patient ID in format P0000001
      const patientId = await generateNextPatientId(userId);

      // Encrypt sensitive data (HIPAA-compliant) before storing
      const encryptedBirthDate = patient.birthDate ? encrypt(patient.birthDate) : null;
      const encryptedSSN = patient.ssn ? encrypt(patient.ssn) : null;

      // Transform patient from client format to DB format
      // Client: { name: { given: string[], family: string } } → DB: { givenName, familyName }
      const newPatient = await storage.createPatient({
        id: patientId,
        userId,
        active: patient.active,
        givenName: patient.name?.given?.join(' ') || patient.givenName || '',
        familyName: patient.name?.family || patient.familyName || '',
        gender: patient.gender,
        birthDate: encryptedBirthDate,
        ssn: encryptedSSN
      });

      // Create related data
      if (telecoms && Array.isArray(telecoms)) {
        await Promise.all(telecoms.map(t => storage.createPatientTelecom({ ...t, patientId: newPatient.id })));
      }

      if (addresses && Array.isArray(addresses)) {
        // Transform addresses from client format (line: string[]) to DB format (line1, line2)
        await Promise.all(addresses.map(a => storage.createPatientAddress({
          patientId: newPatient.id,
          line1: a.line?.[0] || null,
          line2: a.line?.[1] || null,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode
        })));
      }

      if (insurances && Array.isArray(insurances)) {
        // Transform insurances from client format (nested coverage) to DB format (flat fields)
        // Encrypt HIPAA-sensitive fields (policyNumber, groupNumber, subscriberId)
        await Promise.all(insurances.map(i => storage.createInsurance({
          patientId: newPatient.id,
          type: i.type,
          provider: i.provider,
          policyNumber: i.policyNumber ? encrypt(i.policyNumber) : null,
          groupNumber: i.groupNumber ? encrypt(i.groupNumber) : null,
          subscriberName: i.subscriberName,
          subscriberId: i.subscriberId ? encrypt(i.subscriberId) : null,
          relationship: i.relationship,
          effectiveDate: i.effectiveDate,
          expirationDate: i.expirationDate,
          deductible: i.coverage?.deductible || null,
          deductibleMet: i.coverage?.deductibleMet || null,
          maxBenefit: i.coverage?.maxBenefit || null,
          preventiveCoverage: i.coverage?.preventiveCoverage || null,
          basicCoverage: i.coverage?.basicCoverage || null,
          majorCoverage: i.coverage?.majorCoverage || null
        })));
      }

      if (appointments && Array.isArray(appointments)) {
        await Promise.all(appointments.map(a => storage.createAppointment({ ...a, patientId: newPatient.id })));
      }

      if (treatments && Array.isArray(treatments)) {
        await Promise.all(treatments.map(t => storage.createTreatment({ ...t, patientId: newPatient.id })));
      }

      if (verificationStatus) {
        await storage.createVerificationStatus({ ...verificationStatus, patientId: newPatient.id });
      }

      // Create a 'Waiting' API transaction for the new patient
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const apiRequestId = `REQ-${timestamp}-API`;
      const patientFullName = `${patient.name?.given?.join(' ') || ''} ${patient.name?.family || ''}`.trim();

      const waitingApiTransaction = {
        requestId: apiRequestId,
        patientId: newPatient.id,
        patientName: patientFullName || 'Unknown Patient',
        type: 'API',
        method: 'POST /api/benefits/query',
        startTime: '', // Empty - waiting to start
        status: 'Waiting',
        insuranceProvider: insurances && insurances.length > 0 ? insurances[0].provider : '-',
        fetchStatus: 'pending',
        saveStatus: 'pending'
      };

      await db.insert(transactions).values(waitingApiTransaction);

      res.json({ success: true, patient: newPatient });
    } catch (error) {
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  // Fetch PMS - Create sample patients with upcoming appointments
  app.post("/api/patients/fetch-pms", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;

      // Sample patient data
      const samplePatients = [
        {
          patient: {
            name: { given: ['Emily'], family: 'Rodriguez' },
            gender: 'female',
            birthDate: '1990-03-15',
            ssn: '123-45-6789',
            active: true
          },
          telecoms: [
            { system: 'phone', value: '(555) 234-5678' },
            { system: 'email', value: 'emily.rodriguez@email.com' }
          ],
          addresses: [
            {
              line: ['456 Oak Avenue', 'Apt 12'],
              city: 'San Francisco',
              state: 'CA',
              postalCode: '94102'
            }
          ],
          insurances: [
            {
              type: 'Dental',
              provider: 'Delta Dental',
              policyNumber: 'DD123456789',
              groupNumber: 'GRP001',
              subscriberName: 'Emily Rodriguez',
              subscriberId: 'ER123456',
              relationship: 'Self',
              effectiveDate: '2024-01-01',
              expirationDate: '2024-12-31',
              coverage: {
                deductible: '50.00',
                deductibleMet: '0.00',
                maxBenefit: '2000.00',
                preventiveCoverage: '100',
                basicCoverage: '80',
                majorCoverage: '50'
              }
            }
          ],
          appointmentTypes: ['Routine Cleaning', 'Dental Exam']
        },
        {
          patient: {
            name: { given: ['Michael'], family: 'Chen' },
            gender: 'male',
            birthDate: '1985-07-22',
            ssn: '987-65-4321',
            active: true
          },
          telecoms: [
            { system: 'phone', value: '(555) 876-5432' },
            { system: 'email', value: 'michael.chen@email.com' }
          ],
          addresses: [
            {
              line: ['789 Pine Street'],
              city: 'Los Angeles',
              state: 'CA',
              postalCode: '90001'
            }
          ],
          insurances: [
            {
              type: 'Dental',
              provider: 'MetLife',
              policyNumber: 'ML987654321',
              groupNumber: 'GRP002',
              subscriberName: 'Michael Chen',
              subscriberId: 'MC987654',
              relationship: 'Self',
              effectiveDate: '2024-01-01',
              expirationDate: '2024-12-31',
              coverage: {
                deductible: '100.00',
                deductibleMet: '50.00',
                maxBenefit: '1500.00',
                preventiveCoverage: '100',
                basicCoverage: '70',
                majorCoverage: '50'
              }
            }
          ],
          appointmentTypes: ['Filling', 'X-Ray']
        },
        {
          patient: {
            name: { given: ['Sarah'], family: 'Thompson' },
            gender: 'female',
            birthDate: '1995-11-08',
            ssn: '456-78-9012',
            active: true
          },
          telecoms: [
            { system: 'phone', value: '(555) 345-6789' },
            { system: 'email', value: 'sarah.thompson@email.com' }
          ],
          addresses: [
            {
              line: ['321 Maple Drive'],
              city: 'San Diego',
              state: 'CA',
              postalCode: '92101'
            }
          ],
          insurances: [
            {
              type: 'Dental',
              provider: 'Cigna',
              policyNumber: 'CG456789012',
              groupNumber: 'GRP003',
              subscriberName: 'Sarah Thompson',
              subscriberId: 'ST456789',
              relationship: 'Self',
              effectiveDate: '2024-01-01',
              expirationDate: '2024-12-31',
              coverage: {
                deductible: '75.00',
                deductibleMet: '25.00',
                maxBenefit: '1800.00',
                preventiveCoverage: '100',
                basicCoverage: '80',
                majorCoverage: '60'
              }
            }
          ],
          appointmentTypes: ['Consultation', 'Root Canal']
        }
      ];

      const createdPatients = [];

      // Create each sample patient
      for (const sampleData of samplePatients) {
        const patientId = await generateNextPatientId(userId);

        // Encrypt sensitive data
        const encryptedBirthDate = encrypt(sampleData.patient.birthDate);
        const encryptedSSN = encrypt(sampleData.patient.ssn);

        // Create patient
        const newPatient = await storage.createPatient({
          id: patientId,
          userId,
          active: sampleData.patient.active,
          givenName: sampleData.patient.name.given.join(' '),
          familyName: sampleData.patient.name.family,
          gender: sampleData.patient.gender,
          birthDate: encryptedBirthDate,
          ssn: encryptedSSN
        });

        // Create telecoms
        await Promise.all(sampleData.telecoms.map(t =>
          storage.createPatientTelecom({ ...t, patientId: newPatient.id })
        ));

        // Create addresses
        await Promise.all(sampleData.addresses.map(a =>
          storage.createPatientAddress({
            patientId: newPatient.id,
            line1: a.line[0] || null,
            line2: a.line[1] || null,
            city: a.city,
            state: a.state,
            postalCode: a.postalCode
          })
        ));

        // Create insurances
        await Promise.all(sampleData.insurances.map(i =>
          storage.createInsurance({
            patientId: newPatient.id,
            type: i.type,
            provider: i.provider,
            policyNumber: encrypt(i.policyNumber),
            groupNumber: encrypt(i.groupNumber),
            subscriberName: i.subscriberName,
            subscriberId: encrypt(i.subscriberId),
            relationship: i.relationship,
            effectiveDate: i.effectiveDate,
            expirationDate: i.expirationDate,
            deductible: i.coverage.deductible,
            deductibleMet: i.coverage.deductibleMet,
            maxBenefit: i.coverage.maxBenefit,
            preventiveCoverage: i.coverage.preventiveCoverage,
            basicCoverage: i.coverage.basicCoverage,
            majorCoverage: i.coverage.majorCoverage
          })
        ));

        // Create 1 upcoming appointment on Tuesday after 1 week
        const today = new Date();
        const oneWeekLater = new Date(today);
        oneWeekLater.setDate(today.getDate() + 7);

        // Find the next Tuesday after 1 week
        // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
        const dayOfWeek = oneWeekLater.getDay();
        const daysUntilTuesday = dayOfWeek <= 2 ? (2 - dayOfWeek) : (9 - dayOfWeek);
        const nextTuesday = new Date(oneWeekLater);
        nextTuesday.setDate(oneWeekLater.getDate() + daysUntilTuesday);

        const appointment = {
          patientId: newPatient.id,
          date: nextTuesday.toISOString().split('T')[0],
          time: '09:00',
          type: sampleData.appointmentTypes[0],
          status: 'scheduled',
          provider: 'Dr. Smith'
        };

        await storage.createAppointment(appointment);

        // Create verification status
        await storage.createVerificationStatus({
          patientId: newPatient.id,
          fetchPMS: 'pending',
          documentAnalysis: 'pending',
          apiVerification: 'pending',
          callCenter: 'pending',
          saveToPMS: 'pending'
        });

        // Create a 'Waiting' API transaction
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const apiRequestId = `REQ-${timestamp}-${patientId}-API`;
        const patientFullName = `${sampleData.patient.name.given.join(' ')} ${sampleData.patient.name.family}`;

        await db.insert(transactions).values({
          requestId: apiRequestId,
          patientId: newPatient.id,
          patientName: patientFullName,
          type: 'API',
          method: 'POST /api/benefits/query',
          startTime: '',
          status: 'Waiting',
          insuranceProvider: sampleData.insurances[0].provider,
          fetchStatus: 'pending',
          saveStatus: 'pending'
        });

        createdPatients.push(newPatient);
      }

      res.json({
        success: true,
        patientsCreated: createdPatients.length,
        patients: createdPatients
      });
    } catch (error: any) {
      console.error("Failed to fetch PMS data:", error);
      res.status(500).json({
        error: "Failed to fetch PMS data",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Update patient
  app.put("/api/patients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      const updates = req.body;

      // Verify patient exists and belongs to current user
      const existingPatient = await storage.getPatientById(id);
      if (!existingPatient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      if (existingPatient.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Prepare updates with encryption for sensitive fields
      const patientUpdates: any = {};

      // Transform name from client format to DB format if provided
      if (updates.name) {
        if (updates.name.given) {
          patientUpdates.givenName = updates.name.given.filter(Boolean).join(' ');
        }
        if (updates.name.family) {
          patientUpdates.familyName = updates.name.family;
        }
      }

      // Handle other fields
      if (updates.gender !== undefined) patientUpdates.gender = updates.gender;
      if (updates.active !== undefined) patientUpdates.active = updates.active;

      // Encrypt sensitive fields
      if (updates.birthDate) {
        patientUpdates.birthDate = encrypt(updates.birthDate);
      }
      if (updates.ssn) {
        // Prevent re-encrypting the mask
        if (updates.ssn !== 'XXX-XX-XXXX' && updates.ssn !== '***-**-****') {
          patientUpdates.ssn = encrypt(updates.ssn);
        }
      }

      // Update patient in database
      const updatedPatient = await storage.updatePatient(id, patientUpdates);

      if (!updatedPatient) {
        return res.status(500).json({ error: "Failed to update patient" });
      }

      // Handle insurance updates if provided
      if (updates.insurance && Array.isArray(updates.insurance)) {
        // Get existing insurances for this patient
        const existingInsurances = await storage.getPatientInsurances(id);

        // Update or create insurance records
        for (const insuranceData of updates.insurance) {
          // Find matching existing insurance by type (Primary/Secondary)
          const existingInsurance = existingInsurances.find(i => i.type === insuranceData.type);

          if (existingInsurance) {
            // Update existing insurance
            await storage.updateInsurance(existingInsurance.id, {
              provider: insuranceData.provider,
              policyNumber: insuranceData.policyNumber === '************'
                ? existingInsurance.policyNumber // Keep existing encrypted value
                : (insuranceData.policyNumber ? encrypt(insuranceData.policyNumber) : null),
              groupNumber: insuranceData.groupNumber === '********'
                ? existingInsurance.groupNumber // Keep existing encrypted value
                : (insuranceData.groupNumber ? encrypt(insuranceData.groupNumber) : null),
              subscriberName: insuranceData.subscriberName,
              subscriberId: insuranceData.subscriberId === '**********'
                ? existingInsurance.subscriberId // Keep existing encrypted value
                : (insuranceData.subscriberId ? encrypt(insuranceData.subscriberId) : null),
              relationship: insuranceData.relationship,
              effectiveDate: insuranceData.effectiveDate,
              expirationDate: insuranceData.expirationDate,
              deductible: insuranceData.coverage?.deductible || null,
              deductibleMet: insuranceData.coverage?.deductibleMet || null,
              maxBenefit: insuranceData.coverage?.maxBenefit || null,
              preventiveCoverage: insuranceData.coverage?.preventiveCoverage || null,
              basicCoverage: insuranceData.coverage?.basicCoverage || null,
              majorCoverage: insuranceData.coverage?.majorCoverage || null
            });
          } else {
            // Create new insurance
            await storage.createInsurance({
              patientId: id,
              type: insuranceData.type,
              provider: insuranceData.provider,
              policyNumber: insuranceData.policyNumber ? encrypt(insuranceData.policyNumber) : null,
              groupNumber: insuranceData.groupNumber ? encrypt(insuranceData.groupNumber) : null,
              subscriberName: insuranceData.subscriberName,
              subscriberId: insuranceData.subscriberId ? encrypt(insuranceData.subscriberId) : null,
              relationship: insuranceData.relationship,
              effectiveDate: insuranceData.effectiveDate,
              expirationDate: insuranceData.expirationDate,
              deductible: insuranceData.coverage?.deductible || null,
              deductibleMet: insuranceData.coverage?.deductibleMet || null,
              maxBenefit: insuranceData.coverage?.maxBenefit || null,
              preventiveCoverage: insuranceData.coverage?.preventiveCoverage || null,
              basicCoverage: insuranceData.coverage?.basicCoverage || null,
              majorCoverage: insuranceData.coverage?.majorCoverage || null
            });
          }
        }
      }

      res.json({ success: true, patient: updatedPatient });
    } catch (error) {
      res.status(500).json({ error: "Failed to update patient" });
    }
  });

  app.get("/api/patients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const patient = await storage.getPatientById(id);

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Get all related data
      const [telecoms, addresses, insurances, appointments, treatments, verificationStatus, coverageDetail] = await Promise.all([
        storage.getPatientTelecoms(patient.id),
        storage.getPatientAddresses(patient.id),
        storage.getPatientInsurances(patient.id),
        storage.getPatientAppointments(patient.id),
        storage.getPatientTreatments(patient.id),
        storage.getPatientVerificationStatus(patient.id),
        storage.getCoverageDetailByPatientId(patient.id)
      ]);

      let procedures: any[] = [];
      if (coverageDetail) {
        procedures = await storage.getProceduresByCoverageId(coverageDetail.id);
      }

      // Transform addresses from DB format (line1, line2) to client format (line: string[])
      const transformedAddresses = addresses.map(addr => ({
        line: [addr.line1, addr.line2].filter(Boolean) as string[],
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode
      }));

      // Transform insurances from DB format to client format
      // DB: flat fields → Client: nested coverage object
      // Mask sensitive fields (HIPAA-compliant)
      const transformedInsurances = insurances.map(ins => ({
        id: ins.id, // Include insurance ID for decryption
        type: ins.type,
        provider: ins.provider,
        policyNumber: ins.policyNumber ? '************' : null, // Masked (HIPAA)
        policyNumberEncrypted: !!ins.policyNumber,
        groupNumber: ins.groupNumber ? '********' : null, // Masked (HIPAA)
        groupNumberEncrypted: !!ins.groupNumber,
        subscriberName: ins.subscriberName,
        subscriberId: ins.subscriberId ? '**********' : null, // Masked (HIPAA)
        subscriberIdEncrypted: !!ins.subscriberId,
        relationship: ins.relationship,
        effectiveDate: ins.effectiveDate,
        expirationDate: ins.expirationDate,
        coverage: {
          deductible: ins.deductible || '',
          deductibleMet: ins.deductibleMet || '',
          maxBenefit: ins.maxBenefit || '',
          preventiveCoverage: ins.preventiveCoverage || '',
          basicCoverage: ins.basicCoverage || '',
          majorCoverage: ins.majorCoverage || ''
        }
      }));

      // Transform patient from DB format to client format
      // DB: { givenName, familyName } → Client: { name: { given: string[], family: string } }
      const givenNames = patient.givenName ? patient.givenName.split(' ') : [];

      // Mask sensitive data (HIPAA-compliant)
      // Mask telecom data (phone, email)
      const maskedTelecoms = telecoms.map(t => ({
        system: t.system,
        value: t.system === 'phone' ? '(***) ***-****' : t.system === 'email' ? '****@****.***' : t.value,
        encrypted: t.system === 'phone' || t.system === 'email' // Mark as encrypted for UI
      }));

      res.json({
        success: true,
        patient: {
          id: patient.id,
          active: patient.active,
          name: {
            given: givenNames,
            family: patient.familyName
          },
          gender: patient.gender,
          birthDate: patient.birthDate ? '****-**-**' : null, // Masked (HIPAA)
          birthDateEncrypted: !!patient.birthDate,
          ssn: patient.ssn ? '***-**-****' : null, // Masked (HIPAA)
          ssnEncrypted: !!patient.ssn,
          telecom: maskedTelecoms,
          address: transformedAddresses,
          insurance: transformedInsurances,
          appointments,
          treatments,

          coverage: coverageDetail ? {
            annual_maximum: coverageDetail.annualMaximum ? parseFloat(coverageDetail.annualMaximum) : 0,
            annual_used: coverageDetail.annualUsed ? parseFloat(coverageDetail.annualUsed) : 0,
            deductible: coverageDetail.deductible ? parseFloat(coverageDetail.deductible) : 0,
            deductible_met: coverageDetail.deductibleMet ? parseFloat(coverageDetail.deductibleMet) : 0,
            procedures: procedures.map(p => ({
              code: p.code,
              name: p.name,
              category: p.category,
              coverage: p.coverage || '',
              estimated_cost: p.estimatedCost || '',
              patient_pays: p.patientPays || ''
            }))
          } : undefined,
          verificationStatus
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  // Decrypt sensitive patient data endpoint (HIPAA-compliant)
  /**
   * @openapi
   * /api/patients/{id}/decrypt:
   *   post:
   *     tags:
   *       - Patients
   *     summary: Decrypt sensitive patient data
   *     description: Decrypt HIPAA-protected patient fields (birthDate, phone, email, ssn) - requires authentication and ownership verification
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - field
   *             properties:
   *               field:
   *                 type: string
   *                 enum: [birthDate, phone, email, ssn]
   *                 example: birthDate
   *     responses:
   *       200:
   *         description: Field decrypted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 field:
   *                   type: string
   *                 value:
   *                   type: string
   *       400:
   *         description: Invalid field specified
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Patient not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/patients/:id/decrypt", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { field } = req.body;

      // List of allowed sensitive fields
      const allowedFields = ['birthDate', 'phone', 'email', 'ssn', 'address'];

      if (!field || !allowedFields.includes(field)) {
        return res.status(400).json({ error: "Invalid field specified" });
      }

      const patient = await storage.getPatientById(id);

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Verify patient belongs to current user
      const userId = (req.session as any)?.userId;
      if (patient.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Decrypt the requested field
      let decryptedValue = null;

      try {
        switch (field) {
          case 'birthDate':
            if (patient.birthDate) {
              decryptedValue = decrypt(patient.birthDate);
            }
            break;

          case 'phone':
          case 'email':
            // Fetch telecoms to get phone/email
            const telecoms = await storage.getPatientTelecoms(patient.id);
            const telecom = telecoms.find(t => t.system === field);
            if (telecom?.value) {
              // For now, telecoms are not encrypted, but we can encrypt them in the future
              // If they were encrypted, we would decrypt here
              decryptedValue = telecom.value;
            }
            break;

          case 'ssn':
            // Decrypt SSN (HIPAA-sensitive)
            if (patient.ssn) {
              decryptedValue = decrypt(patient.ssn);
            }
            break;

          case 'address':
            // Fetch patient's address (HIPAA-sensitive)
            const addresses = await storage.getPatientAddresses(patient.id);
            if (addresses && addresses.length > 0) {
              const addr = addresses[0];
              const line = addr.line1 ? (addr.line2 ? `${addr.line1}, ${addr.line2}` : addr.line1) : '';
              decryptedValue = line ? `${line}, ${addr.city}, ${addr.state} ${addr.postalCode}` : `${addr.city}, ${addr.state} ${addr.postalCode}`;
            }
            break;

          default:
            return res.status(400).json({ error: "Field not supported" });
        }
      } catch (error) {
        return res.status(500).json({ error: "Failed to decrypt data" });
      }

      res.json({
        success: true,
        field,
        value: decryptedValue
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to decrypt patient data" });
    }
  });

  // Decrypt sensitive insurance data endpoint (HIPAA-compliant)
  app.post("/api/patients/:id/insurance/:insuranceId/decrypt", requireAuth, async (req, res) => {
    try {
      const { id, insuranceId } = req.params;
      const { field } = req.body;

      // List of allowed sensitive insurance fields
      const allowedFields = ['policyNumber', 'groupNumber', 'subscriberId'];

      if (!field || !allowedFields.includes(field)) {
        return res.status(400).json({ error: "Invalid field specified" });
      }

      const patient = await storage.getPatientById(id);

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Verify patient belongs to current user
      const userId = (req.session as any)?.userId;
      if (patient.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get insurance record
      const insurances = await storage.getPatientInsurances(id);
      const insurance = insurances.find(ins => ins.id === insuranceId);

      if (!insurance) {
        return res.status(404).json({ error: "Insurance not found" });
      }

      // Decrypt the requested field
      let decryptedValue = null;

      try {
        switch (field) {
          case 'policyNumber':
            if (insurance.policyNumber) {
              decryptedValue = decrypt(insurance.policyNumber);
            }
            break;

          case 'groupNumber':
            if (insurance.groupNumber) {
              decryptedValue = decrypt(insurance.groupNumber);
            }
            break;

          case 'subscriberId':
            if (insurance.subscriberId) {
              decryptedValue = decrypt(insurance.subscriberId);
            }
            break;

          default:
            return res.status(400).json({ error: "Field not supported" });
        }
      } catch (error) {
        return res.status(500).json({ error: "Failed to decrypt data" });
      }

      res.json({
        success: true,
        field,
        value: decryptedValue
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to decrypt insurance data" });
    }
  });

  // OCR endpoint for insurance card scanning
  /**
   * @openapi
   * /api/patients/{id}/insurance-card-ocr:
   *   post:
   *     tags:
   *       - Patients
   *     summary: OCR scan insurance card
   *     description: Upload and process an insurance card image using OCR to extract patient and insurance information
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - insuranceCardImage
   *             properties:
   *               insuranceCardImage:
   *                 type: string
   *                 format: binary
   *                 description: Insurance card image (JPEG, PNG, or PDF, max 10MB)
   *     responses:
   *       200:
   *         description: Insurance card processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 extractedData:
   *                   type: object
   *                   properties:
   *                     firstName:
   *                       type: string
   *                     lastName:
   *                       type: string
   *                     middleName:
   *                       type: string
   *                     provider:
   *                       type: string
   *                     policyNumber:
   *                       type: string
   *                     groupNumber:
   *                       type: string
   *                     subscriberId:
   *                       type: string
   *                 confidence:
   *                   type: number
   *                   description: OCR confidence score
   *       400:
   *         description: Insurance card image is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: OCR processing failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/patients/:id/insurance-card-ocr",
    requireAuth,
    upload.single('insuranceCardImage'),
    async (req, res) => {
      try {
        const { id } = req.params;
        const userId = (req.session as any)?.userId;

        // Verify ownership
        const patient = await storage.getPatientById(id);
        if (!patient || patient.userId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }

        if (!req.file) {
          return res.status(400).json({ error: "Insurance card image is required" });
        }


        // Process OCR
        const { extractedData, confidence } = await processInsuranceCard(req.file.buffer);

        // Update patient name
        await storage.updatePatient(id, {
          givenName: `${extractedData.firstName} ${extractedData.middleName || ''}`.trim(),
          familyName: extractedData.lastName
        });

        // Update or create insurance
        const existingInsurances = await storage.getPatientInsurances(id);
        const primaryInsurance = existingInsurances.find(i => i.type === 'Primary');

        if (primaryInsurance) {
          // Update existing primary insurance
          await storage.updateInsurance(primaryInsurance.id, {
            provider: extractedData.provider,
            policyNumber: extractedData.policyNumber ? encrypt(extractedData.policyNumber) : null,
            groupNumber: extractedData.groupNumber ? encrypt(extractedData.groupNumber) : null,
            subscriberId: extractedData.subscriberId ? encrypt(extractedData.subscriberId) : null,
            subscriberName: `${extractedData.firstName} ${extractedData.lastName}`
          });
        } else {
          // Create new primary insurance
          await storage.createInsurance({
            patientId: id,
            type: 'Primary',
            provider: extractedData.provider,
            policyNumber: extractedData.policyNumber ? encrypt(extractedData.policyNumber) : null,
            groupNumber: extractedData.groupNumber ? encrypt(extractedData.groupNumber) : null,
            subscriberId: extractedData.subscriberId ? encrypt(extractedData.subscriberId) : null,
            subscriberName: `${extractedData.firstName} ${extractedData.lastName}`,
            relationship: 'Self',
            effectiveDate: null,
            expirationDate: null,
            deductible: null,
            deductibleMet: null,
            maxBenefit: null,
            preventiveCoverage: null,
            basicCoverage: null,
            majorCoverage: null
          });
        }

        res.json({ success: true, extractedData, confidence });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process insurance card' });
      }
    }
  );

  app.delete("/api/patients/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      const userRole = (req.session as any)?.userRole;

      // Verify patient exists
      const patient = await storage.getPatientById(id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      // Check if user has permission (owner or admin)
      if (patient.userId !== userId && userRole !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete patient (cascade deletes will handle all related data)
      const success = await storage.deletePatient(id);

      if (!success) {
        return res.status(500).json({ error: "Failed to delete patient" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete patient" });
    }
  });

  // Appointment routes
  /**
   * @openapi
   * /api/patients/{id}/appointments:
   *   post:
   *     tags:
   *       - Appointments
   *     summary: Create a new appointment
   *     description: Create a new appointment for a patient
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               date:
   *                 type: string
   *                 format: date
   *                 example: "2025-12-30"
   *               time:
   *                 type: string
   *                 example: "10:00 AM"
   *               type:
   *                 type: string
   *                 example: "Cleaning"
   *               status:
   *                 type: string
   *                 default: "scheduled"
   *                 example: "scheduled"
   *               provider:
   *                 type: string
   *                 example: "Dr. Smith"
   *     responses:
   *       200:
   *         description: Appointment created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 appointment:
   *                   type: object
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Patient not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/patients/:id/appointments", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      const appointmentData = req.body;

      // Verify patient exists and belongs to current user
      const patient = await storage.getPatientById(id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      if (patient.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create appointment
      const appointment = await storage.createAppointment({
        patientId: id,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type,
        status: appointmentData.status || 'scheduled',
        provider: appointmentData.provider
      });

      res.json({ success: true, appointment });
    } catch (error) {
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.put("/api/patients/:id/appointments/:appointmentId", requireAuth, async (req, res) => {
    try {
      const { id, appointmentId } = req.params;
      const userId = (req.session as any)?.userId;
      const updates = req.body;

      // Verify patient exists and belongs to current user
      const patient = await storage.getPatientById(id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      if (patient.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update appointment
      const appointment = await storage.updateAppointment(appointmentId, updates);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json({ success: true, appointment });
    } catch (error) {
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/patients/:id/appointments/:appointmentId", requireAuth, async (req, res) => {
    try {
      const { id, appointmentId } = req.params;
      const userId = (req.session as any)?.userId;

      // Verify patient exists and belongs to current user
      const patient = await storage.getPatientById(id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      if (patient.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete appointment
      const success = await storage.deleteAppointment(appointmentId);
      if (!success) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Transaction routes
  /**
   * @openapi
   * /api/transactions:
   *   get:
   *     tags:
   *       - Transactions
   *     summary: Get all transactions
   *     description: Retrieve all transactions for the authenticated user
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Transactions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 transactions:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Transaction'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to fetch transactions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  /**
   * @openapi
   * /api/transactions:
   *   post:
   *     tags:
   *       - Transactions
   *     summary: Create a new transaction
   *     description: Create a new transaction record with optional verified data and call communications
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               requestId:
   *                 type: string
   *                 description: Request ID (auto-generated if not provided)
   *                 example: "REQ-2025-12-27-12-30-00"
   *               patientId:
   *                 type: string
   *                 nullable: true
   *                 description: Associated patient ID
   *               status:
   *                 type: string
   *                 description: Transaction status
   *               dataVerified:
   *                 type: array
   *                 description: Array of verified data items
   *                 items:
   *                   type: string
   *               callCommunications:
   *                 type: array
   *                 description: Array of call communication records
   *                 items:
   *                   type: object
   *     responses:
   *       200:
   *         description: Transaction created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 transaction:
   *                   $ref: '#/components/schemas/Transaction'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to create transaction
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 details:
   *                   type: string
   */
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const transactionData = req.body;


      // Verify patient belongs to current user if patientId is provided
      if (transactionData.patientId) {
        const patient = await storage.getPatientById(transactionData.patientId);
        if (!patient || patient.userId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Generate request ID if not provided
      if (!transactionData.requestId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        transactionData.requestId = `REQ-${timestamp}`;
      }

      // Remove dataVerified and callCommunications from main transaction data
      const { dataVerified, callCommunications: comms, ...txnData } = transactionData;


      // Insert transaction
      const [transaction] = await db.insert(transactions).values(txnData).returning();

      // Insert verified data items if provided
      if (dataVerified && Array.isArray(dataVerified)) {
        for (const item of dataVerified) {
          await db.insert(transactionDataVerified).values({
            transactionId: transaction.id,
            item
          });
        }
      }

      // Insert call communications if provided
      if (comms && Array.isArray(comms)) {
        for (const comm of comms) {
          await db.insert(callCommunications).values({
            transactionId: transaction.id,
            ...comm
          });
        }
      }

      res.json({ success: true, transaction });
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to create transaction",
        details: error.message
      });
    }
  });

  app.get("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransactionById(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json({ success: true, transaction });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.put("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      const transactionData = req.body;


      // Verify transaction exists
      const existingTransaction = await storage.getTransactionById(id);
      if (!existingTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Verify patient belongs to current user if patientId is in the transaction
      if (existingTransaction.patientId) {
        const patient = await storage.getPatientById(existingTransaction.patientId);
        if (!patient || patient.userId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Remove dataVerified and callCommunications from main transaction data
      const { dataVerified, callCommunications: comms, ...txnData } = transactionData;

      // Update transaction
      const [updatedTransaction] = await db.update(transactions)
        .set(txnData)
        .where(eq(transactions.id, id))
        .returning();


      // Delete existing verified data items and insert new ones if provided
      if (dataVerified && Array.isArray(dataVerified)) {
        await db.delete(transactionDataVerified).where(eq(transactionDataVerified.transactionId, id));
        for (const item of dataVerified) {
          await db.insert(transactionDataVerified).values({
            transactionId: id,
            item
          });
        }
      }

      // Delete existing call communications and insert new ones if provided
      if (comms && Array.isArray(comms)) {
        await db.delete(callCommunications).where(eq(callCommunications.transactionId, id));
        for (const comm of comms) {
          await db.insert(callCommunications).values({
            transactionId: id,
            ...comm
          });
        }
      }

      // Auto-create CALL transaction when API transaction is updated to SUCCESS
      if (existingTransaction.type === 'API' &&
          txnData.status === 'SUCCESS' &&
          existingTransaction.status !== 'SUCCESS') {

        // Generate new request ID for CALL transaction
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const callRequestId = `REQ-${timestamp}-CALL`;

        const callTransactionData = {
          requestId: callRequestId,
          patientId: existingTransaction.patientId,
          patientName: existingTransaction.patientName,
          type: 'CALL',
          method: 'Insurance Verification Call',
          startTime: '', // Empty - waiting to start
          status: 'Waiting',
          insuranceProvider: existingTransaction.insuranceProvider || '-',
          fetchStatus: 'pending',
          saveStatus: 'pending'
        };

        // Insert CALL transaction and get the ID
        const [newCallTransaction] = await db.insert(transactions).values(callTransactionData).returning();

        // Populate interface tables when CALL transaction with 'Waiting' status is created
        if (newCallTransaction && existingTransaction.patientId) {
          // Get patient's primary insurance
          const patientInsurances = await db.select()
            .from(insurances)
            .where(eq(insurances.patientId, existingTransaction.patientId));

          const primaryInsurance = patientInsurances.find(i => i.type === 'Primary') || patientInsurances[0];

          // 1. Insert into if_call_transaction_list with insurance information
          const [ifCallTxn] = await db.insert(ifCallTransactionList).values({
            transactionId: newCallTransaction.id,
            requestId: newCallTransaction.requestId,
            patientId: newCallTransaction.patientId,
            patientName: newCallTransaction.patientName,
            insuranceProvider: newCallTransaction.insuranceProvider,
            policyNumber: primaryInsurance?.policyNumber || null, // Already encrypted
            groupNumber: primaryInsurance?.groupNumber || null, // Already encrypted
            subscriberId: primaryInsurance?.subscriberId || null, // Already encrypted
            phoneNumber: newCallTransaction.phoneNumber || null,
            startTime: newCallTransaction.startTime,
            endTime: newCallTransaction.endTime || null,
            duration: newCallTransaction.duration || null,
            status: newCallTransaction.status,
            insuranceRep: newCallTransaction.insuranceRep || null,
            transcript: newCallTransaction.transcript || null
          }).returning();

          // 2. Copy coverage_by_code records to if_call_coverage_code_list
          const coverageCodes = await db.select()
            .from(coverageByCode)
            .where(eq(coverageByCode.patientId, existingTransaction.patientId));

          for (const code of coverageCodes) {
            await db.insert(ifCallCoverageCodeList).values({
              ifCallTransactionId: ifCallTxn.id,
              saiCode: code.saiCode,
              refInsCode: code.refInsCode,
              category: code.category,
              fieldName: code.fieldName,
              preStepValue: code.preStepValue,
              verified: code.verifiedBy === 'API' ? true : code.verified,
              verifiedBy: code.verifiedBy,
              coverageData: code.coverageData
            });
          }

          // 3. Copy callCommunications from the API transaction to if_call_message_list
          const apiCommunications = await db.select()
            .from(callCommunications)
            .where(eq(callCommunications.transactionId, id));

          for (const comm of apiCommunications) {
            await db.insert(ifCallMessageList).values({
              ifCallTransactionId: ifCallTxn.id,
              timestamp: comm.timestamp,
              speaker: comm.speaker,
              message: comm.message,
              type: comm.type
            });
          }
        }
      }

      res.json({ success: true, transaction: updatedTransaction });
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to update transaction",
        details: error.message
      });
    }
  });

  app.get("/api/transactions/:id/communications", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const communications = await storage.getCallCommunicationsByTransactionId(id);
      res.json({ success: true, communications });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  app.get("/api/transactions/:id/verified-data", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const verifiedData = await storage.getTransactionDataVerifiedByTransactionId(id);
      res.json({ success: true, verifiedData });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified data" });
    }
  });

  // Load dental codes
  const dentalCodesPath = join(process.cwd(), "mockupdata", "common_dental_cdt_codes.json");
  const dentalCodes = JSON.parse(readFileSync(dentalCodesPath, "utf-8"));

  const STEDI_API_KEY = process.env.STEDI_API_KEY;
  const STEDI_BASE_URL = "https://healthcare.us.stedi.com/2024-04-01";

  // Helper function to call Stedi Eligibility API
  async function checkEligibility(subscriber: any, provider: any, encounter: any, tradingPartnerServiceId: string = "CIGNA") {
    // Format date of birth to YYYYMMDD format if it's in YYYY-MM-DD format
    const formattedSubscriber = {
      ...subscriber,
      dateOfBirth: subscriber.dateOfBirth?.replace(/-/g, '')
    };

    const response = await axios.post(
      `${STEDI_BASE_URL}/change/medicalnetwork/eligibility/v3`,
      {
        tradingPartnerServiceId,
        subscriber: formattedSubscriber,
        provider,
        encounter
      },
      {
        headers: {
          Authorization: STEDI_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  }

  // Check if general benefits already cover a procedure
  function isCoveredInGeneral(generalBenefits: any, procedureCode: string) {
    if (!generalBenefits || !generalBenefits.benefits) return false;
    return generalBenefits.benefits.some(
      (b: any) =>
        b.service?.toUpperCase() === procedureCode.toUpperCase() ||
        (b.serviceTypeCode === "35") // fallback for broad dental coverage
    );
  }

  // Mock dental benefits data for testing
  const getMockDentalBenefits = () => ({
    general: {
      benefits: [
        {
          service: "Dental - Preventive",
          status: "active",
          percentageCovered: "100",
          copayAmount: "$0"
        },
        {
          service: "Dental - Basic",
          status: "active",
          percentageCovered: "80",
          copayAmount: "$25"
        },
        {
          service: "Dental - Major",
          status: "active",
          percentageCovered: "50",
          copayAmount: "$100"
        }
      ]
    },
    procedures: dentalCodes.data.procedures.slice(0, 20).map((code: any) => ({
      code: code.code,
      description: code.description,
      category: code.category,
      benefit: {
        percentageCovered: code.category.toLowerCase().includes("preventive") ? "100" : "80"
      }
    }))
  });

  // Stedi dental benefits route
  /**
   * @openapi
   * /api/stedi/dental-benefits:
   *   post:
   *     tags:
   *       - Stedi Integration
   *     summary: Check dental benefits via Stedi API
   *     description: Query Stedi eligibility API for dental benefits including general coverage and procedure-specific benefits
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - subscriber
   *               - provider
   *             properties:
   *               subscriber:
   *                 type: object
   *                 properties:
   *                   memberId:
   *                     type: string
   *                     example: "12345678"
   *                   firstName:
   *                     type: string
   *                     example: "John"
   *                   lastName:
   *                     type: string
   *                     example: "Doe"
   *                   dateOfBirth:
   *                     type: string
   *                     format: date
   *                     example: "1990-01-15"
   *               provider:
   *                 type: object
   *                 properties:
   *                   npi:
   *                     type: string
   *                     example: "1234567890"
   *                   organizationName:
   *                     type: string
   *                     example: "Smith Dental Practice"
   *     responses:
   *       200:
   *         description: Dental benefits retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     general:
   *                       type: object
   *                       description: General dental coverage information
   *                     procedures:
   *                       type: array
   *                       description: Procedure-specific coverage details
   *                       items:
   *                         type: object
   *                         properties:
   *                           code:
   *                             type: string
   *                           description:
   *                             type: string
   *                           category:
   *                             type: string
   *                           benefit:
   *                             type: object
   *                 note:
   *                   type: string
   *                   description: Additional information (e.g., when using mock data)
   *       400:
   *         description: Missing required fields
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   *       500:
   *         description: Stedi API error or configuration issue
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   */
  app.post("/api/stedi/dental-benefits", async (req, res) => {
    try {
      const { subscriber, provider } = req.body;

      if (!subscriber || !provider) {
        return res.status(400).json({
          success: false,
          error: "Subscriber and provider information are required"
        });
      }

      if (!STEDI_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "STEDI_API_KEY is not configured"
        });
      }

      try {
        // 1️⃣ General dental coverage (STC 35)
        const generalBenefits = await checkEligibility(
          subscriber,
          provider,
          { serviceTypeCodes: ["35"] },
          "CIGNA"
        );

        const combinedResults = {
          general: generalBenefits,
          procedures: []
        };

        // 2️⃣ Loop CDT codes, skip if covered by general benefits
        for (const item of dentalCodes.data.procedures) {
          const covered = isCoveredInGeneral(generalBenefits, item.code);

          let procedureBenefit = null;
          if (!covered) {
            procedureBenefit = await checkEligibility(
              subscriber,
              provider,
              {
                serviceTypeCodes: ["35"],
                procedureCode: item.code
              },
              "CIGNA"
            );
          }

          (combinedResults.procedures as any[]).push({
            code: item.code,
            description: item.description,
            category: item.category,
            benefit: procedureBenefit?.benefits || (covered ? "Covered in STC 35" : null)
          });
        }

        res.json({ success: true, data: combinedResults });
      } catch (stediError: any) {
        // If Stedi API fails, return mock data for testing UI
        res.json({
          success: true,
          data: getMockDentalBenefits(),
          note: "Mock data - Stedi API test case not found. Use real test credentials for production."
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Save coverage by code data
  /**
   * @openapi
   * /api/coverage-by-code/{patientId}:
   *   post:
   *     tags:
   *       - Coverage
   *     summary: Save coverage by code data
   *     description: Save procedure-specific coverage data for a patient (requires Data Mode and STEDI Test to be enabled)
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: patientId
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - coverageData
   *               - dataMode
   *               - stediTest
   *             properties:
   *               coverageData:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                     name:
   *                       type: string
   *                     category:
   *                       type: string
   *                     coverage:
   *                       type: string
   *                     estimated_cost:
   *                       type: string
   *                     patient_pays:
   *                       type: string
   *               dataMode:
   *                 type: boolean
   *                 example: true
   *               stediTest:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Coverage data saved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid request or data mode/stedi test not enabled
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   */
  app.post("/api/coverage-by-code/:patientId", requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const userId = (req.session as any)?.userId;
      const { coverageData, dataMode, stediTest } = req.body;

      // Check if data mode is enabled and STEDI test is on
      if (!dataMode || !stediTest) {
        return res.status(400).json({
          success: false,
          error: "Coverage by code data can only be saved when Data Mode is ON and STEDI Test is ON"
        });
      }

      if (!coverageData || !Array.isArray(coverageData)) {
        return res.status(400).json({
          success: false,
          error: "Invalid coverage data format"
        });
      }

      // Verify patient belongs to current user
      const patient = await storage.getPatientById(patientId);
      if (!patient || patient.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }

      await storage.saveCoverageByCode(patientId, userId, coverageData);

      res.json({
        success: true,
        message: "Coverage by code data saved successfully"
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get coverage by code data for a patient
  /**
   * @openapi
   * /api/coverage-by-code/{patientId}:
   *   get:
   *     tags:
   *       - Coverage
   *     summary: Get coverage by code data
   *     description: Retrieve saved procedure-specific coverage data for a patient
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: patientId
   *         required: true
   *         schema:
   *           type: string
   *         description: Patient ID
   *     responses:
   *       200:
   *         description: Coverage data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   *       500:
   *         description: Failed to fetch coverage data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   */
  app.get("/api/coverage-by-code/:patientId", requireAuth, async (req, res) => {
    try {
      const { patientId } = req.params;
      const userId = (req.session as any)?.userId;

      // Verify patient belongs to current user
      const patient = await storage.getPatientById(patientId);
      if (!patient || patient.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied"
        });
      }

      const data = await storage.getCoverageByCodeForPatient(patientId, userId);

      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Admin Interface Table Management Endpoints
  // Get all interface transactions
  app.get("/api/admin/interface/transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions = await db.select().from(ifCallTransactionList).orderBy(ifCallTransactionList.createdAt);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get interface coverage codes (optionally filtered by transaction ID)
  app.get("/api/admin/interface/coverage-codes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { transactionId } = req.query;
      let query = db.select().from(ifCallCoverageCodeList);

      if (transactionId && typeof transactionId === 'string') {
        query = query.where(eq(ifCallCoverageCodeList.ifCallTransactionId, transactionId));
      }

      const coverageCodes = await query.orderBy(ifCallCoverageCodeList.createdAt);
      res.json(coverageCodes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get interface messages (optionally filtered by transaction ID)
  app.get("/api/admin/interface/messages", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { transactionId } = req.query;
      let query = db.select().from(ifCallMessageList);

      if (transactionId && typeof transactionId === 'string') {
        query = query.where(eq(ifCallMessageList.ifCallTransactionId, transactionId));
      }

      const messages = await query.orderBy(ifCallMessageList.createdAt);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete interface transaction
  app.delete("/api/admin/interface/transactions/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(ifCallTransactionList).where(eq(ifCallTransactionList.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete interface coverage code
  app.delete("/api/admin/interface/coverage/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(ifCallCoverageCodeList).where(eq(ifCallCoverageCodeList.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete interface message
  app.delete("/api/admin/interface/messages/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(ifCallMessageList).where(eq(ifCallMessageList.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
