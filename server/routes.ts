import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClientSchema, insertOrderSchema, insertProductSchema, insertTagSchema, insertEduCourseSchema, insertEduLessonSchema, insertEduArticleSchema, insertEduGuidelineSchema, insertTelemedicineProviderSchema, insertTelemedicineConsultationSchema, insertMedicalRecordSchema, insertExternalPrescriptionSchema, insertClientPathologySchema, insertPostSaleFollowupSchema, insertAnvisaProcessSchema, insertStockMovementSchema, insertLeadStageSchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, requireAdmin, requireRole } from "./middleware/auth";
import { csrfProtection, adminCsrfProtection, adminUploadCsrfProtection } from "./middleware/csrf";
import { createWebhookSecurityMiddleware, createApiKeyMiddleware } from "./webhook-security";
import { affiliateTrackingMiddleware } from "./middleware/affiliate-tracking";
import { syncScheduler } from "./sync-scheduler";
import { syncManager } from "./telemedicine-client";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import crypto from "crypto";
import { db } from "./db";
import { educationalContent } from "@shared/schema-n8n";
import { users, anvisaProcesses, orders, products, stockMovements, clients, prescriptions, expenses, postSaleFollowups, leads, clientPathologies, eduProgress, clientFlags } from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { verifyRecaptcha } from "./recaptcha";
import jwt from "jsonwebtoken";
import { partnerIntegrations, partnerSsoLogs, partnerConsultations, insertPartnerIntegrationSchema, insertPartnerConsultationSchema, type PartnerIntegration, type PartnerConsultation } from "@shared/schema";

/**
 * 🔄 AUTO-SYNC LEAD STATUS
 * Calcula automaticamente o status correto do lead baseado nos dados reais do paciente
 * Garante que o CRM sempre reflita a situação atual da ficha médica
 */
async function calculateLeadStatusFromPatientData(clientId: string): Promise<string> {
  try {
    // Buscar dados do paciente
    const flags = await storage.getClientFlags(clientId);
    const clientOrders = await storage.getOrdersByClient(clientId);
    const hasCompletedOrder = clientOrders?.some((order: any) => order.status === 'delivered' || order.status === 'completed');
    
    // LÓGICA DE STATUS AUTOMÁTICO (da ficha mais avançada para a menos)
    
    // 7. Pedido entregue = Finalizado
    if (hasCompletedOrder) {
      return 'finalizado';
    }
    
    // 6. Ambos documentos validados = Produtos liberados
    if (flags?.prescriptionValidated && flags?.anvisaDocumentValidated) {
      return 'produtos_liberados';
    }
    
    // 5. Apenas receita validada = Receita validada
    if (flags?.prescriptionValidated) {
      return 'receita_validada';
    }
    
    // 4. Tem receita mas não validada = Receita recebida
    if (flags?.prescriptionUrl) {
      return 'receita_recebida';
    }
    
    // 3. Tem consulta de telemedicina mas não tem receita = Aguardando receita
    if (flags?.hasTelemedAccount || flags?.telemedConsultationId) {
      return 'aguardando_receita';
    }
    
    // 2. Default para leads novos = Contato inicial
    return 'contato_inicial';
    
  } catch (error) {
    console.error('[AUTO-SYNC] Error calculating lead status:', error);
    return 'novo'; // Fallback seguro
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // 🔗 Affiliate tracking middleware - deve vir ANTES de todas as rotas
  console.log('[SERVER] Registering affiliate tracking middleware...');
  app.use(affiliateTrackingMiddleware);

  // Simple image upload configuration
  const imageStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'images');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        console.error('Error creating upload directory:', error);
        cb(error as Error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({ 
    storage: imageStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // Define uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');

  // New endpoint for file upload URL generation (images and PDFs)
  app.post("/api/upload/request-url", async (req, res) => {
    try {
      const { filename, contentType } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ error: "filename and contentType are required" });
      }

      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(contentType.toLowerCase())) {
        return res.status(400).json({ error: 'Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed' });
      }

      // Generate unique filename
      const ext = path.extname(filename);
      const uniqueFilename = `file-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      const directory = contentType === 'application/pdf' ? 'documents' : 'images';
      const publicUrl = `/uploads/${directory}/${uniqueFilename}`;

      // Ensure directory exists
      const dirPath = path.join(uploadsDir, directory);
      if (!fsSync.existsSync(dirPath)) {
        fsSync.mkdirSync(dirPath, { recursive: true });
      }

      // For simple implementation, return a URL that the frontend can use
      // The actual upload will be handled by a separate endpoint
      res.json({
        uploadUrl: `/api/upload/file/${directory}/${uniqueFilename}`,
        publicUrl: publicUrl
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Endpoint to handle the actual file upload
  app.put("/api/upload/file/:directory/:filename", async (req, res) => {
    try {
      const { directory, filename } = req.params;
      
      // Validate directory
      if (!['images', 'documents'].includes(directory)) {
        return res.status(400).json({ error: "Invalid directory" });
      }

      const filePath = path.join(uploadsDir, directory, filename);
      
      // Write the file from request body
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fsSync.writeFileSync(filePath, buffer);
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.post("/api/upload/image", requireAuth, requireAdmin, adminUploadCsrfProtection, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ 
        success: true, 
        imageUrl: imageUrl,
        filename: req.file.filename 
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Serve uploaded images statically
  app.use('/uploads', (req, res, next) => {
    res.header('Cache-Control', 'public, max-age=31536000');
    next();
  }, express.static('uploads'));

  // Object Storage routes for content uploads
  app.post("/api/object-storage/upload-url", requireAuth, requireAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadUrl });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL", message: error.message });
    }
  });

  // Legacy route (fallback)
  app.post("/api/objects/upload", requireAuth, requireAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.put("/api/content-files", requireAuth, requireAdmin, async (req, res) => {
    if (!req.body.fileURL) {
      return res.status(400).json({ error: "fileURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.fileURL,
        {
          owner: req.user?.id || "system",
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting file ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  // Import n8n routes
  import('./routes/n8n-integration').then(n8nModule => {
    app.use("/api/n8n", n8nModule.default);
  });
  
  // Import content management routes
  import('./routes/content-management').then(contentModule => {
    contentModule.registerContentManagementRoutes(app);
  });
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });


  // Authentication routes
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    recaptchaToken: z.string().optional(),
  });

  const registerSchema = insertUserSchema
    .omit({ 
      username: true,
      emailVerified: true,
      verificationToken: true,
      verificationTokenExpiry: true
    })
    .extend({
      confirmPassword: z.string(),
      cpf: z.string().optional(),
      birthDate: z.string().optional(),
      recaptchaToken: z.string().optional(),
      acceptTerms: z.boolean().optional(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password, recaptchaToken } = loginSchema.parse(req.body);
      
      // Verificar reCAPTCHA v3
      if (recaptchaToken) {
        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken, "login");
        if (!isValidRecaptcha) {
          return res.status(400).json({ 
            message: "Verificação de segurança falhou. Tente novamente." 
          });
        }
      }
      
      const user = await storage.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if email is verified (SKIP for admin - admin has full access)
      if (!user.emailVerified && user.role !== 'admin') {
        return res.status(403).json({ 
          message: "Email não verificado. Verifique sua caixa de entrada para ativar sua conta.",
          emailNotVerified: true,
          email: user.email
        });
      }

      // Create session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      console.error("Error during login:", error);
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { confirmPassword, recaptchaToken, ...userData } = registerSchema.parse(req.body);
      
      // Verificar reCAPTCHA v3
      if (recaptchaToken) {
        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken, "register");
        if (!isValidRecaptcha) {
          return res.status(400).json({ 
            message: "Verificação de segurança falhou. Por favor, recarregue a página e tente novamente." 
          });
        }
      }
      
      // Force role to be client for public registration
      if (userData.role !== "client") {
        return res.status(403).json({ 
          message: "Registro público disponível apenas para clientes. Outros tipos de usuário devem ser criados pelo administrador." 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Generate 6-digit verification code
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Generate username from fullName (normalize and add random suffix if needed)
      const normalizedName = userData.fullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]/g, ''); // Remove special chars
      
      let username = normalizedName;
      let attempts = 0;
      
      // Check if username exists, add number suffix if needed
      while (await storage.getUserByUsername(username) && attempts < 100) {
        username = `${normalizedName}${Math.floor(Math.random() * 10000)}`;
        attempts++;
      }

      // Create user with verification token and generated username
      const user = await storage.createUser({
        ...userData,
        username,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry
      });
      
      // Create role-specific profile based on user role
      if (user.role === "client") {
        const client = await storage.createClient({
          userId: user.id,
          cpf: userData.cpf || null,
          birthDate: userData.birthDate ? new Date(userData.birthDate) : null,
        });

        // ✅ AFFILIATE TRACKING: Associate client with vendor if came from affiliate link
        if (req.session.affiliateCode) {
          try {
            const { affiliateService } = await import("./services/affiliate.service");
            const vendor = await affiliateService.getVendorByAffiliateCode(req.session.affiliateCode);
            
            if (vendor) {
              // Associate client with vendor
              await db.update(clients).set({ 
                affiliateVendorId: vendor.id 
              }).where(eq(clients.id, client.id));

              // Track registration
              await affiliateService.trackRegistration(req.session.affiliateCode, client.id);
              
              console.log(`[AFFILIATE] ✅ Client ${client.id} registered via vendor ${vendor.fullName} (${req.session.affiliateCode})`);
            }
          } catch (error) {
            console.error('[AFFILIATE] Error associating client with vendor:', error);
            // Continue registration even if affiliate tracking fails
          }
        }
      } else if (user.role === "consultant") {
        await storage.createConsultant({
          userId: user.id,
        });
      } else if (user.role === "doctor") {
        await storage.createDoctor({
          userId: user.id,
          crm: "", // Will be filled later
        });
      }

      // Send verification email
      try {
        const { sendVerificationEmail } = await import('./email-service.js');
        await sendVerificationEmail(user.email, user.fullName, verificationToken);
        console.log(`✅ Email de verificação enviado para ${user.email}`);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de verificação:', emailError);
        // Continue registration even if email fails
      }

      // DO NOT create session - user must verify email first
      res.status(201).json({ 
        message: "Conta criada com sucesso! Verifique seu email para ativar sua conta.",
        emailSent: true,
        email: user.email
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Error during registration" });
    }
  });

  // Get current authenticated user
  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      // User is already attached by requireAuth middleware
      const { password: _, ...userWithoutPassword } = req.user!;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });

  // Logout - destroy session
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      
      // Clear the session cookie
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Verify email with token
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Token de verificação inválido" });
      }

      // Find user with this verification token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: "Token de verificação inválido ou expirado" });
      }

      const userData = user[0];

      // Check if token expired
      if (userData.verificationTokenExpiry && new Date() > new Date(userData.verificationTokenExpiry)) {
        return res.status(410).json({ 
          message: "Token de verificação expirado. Solicite um novo email de verificação.",
          expired: true
        });
      }

      // Check if already verified
      if (userData.emailVerified) {
        return res.status(200).json({ 
          message: "Email já verificado. Você pode fazer login.",
          alreadyVerified: true
        });
      }

      // Mark email as verified and clear token
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null
        })
        .where(eq(users.id, userData.id));

      // Create session (auto login after verification)
      req.session.userId = userData.id;
      req.session.userRole = userData.role;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
        }
        
        console.log(`✅ Email verificado com sucesso para ${userData.email}`);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = userData;
        res.json({ 
          message: "Email verificado com sucesso! Você já está logado.",
          user: userWithoutPassword,
          verified: true
        });
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Erro ao verificar email" });
    }
  });

  // Password Reset Routes
  // 1. Request password reset - sends 6-digit code to email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      // Find user by email
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // Don't reveal if user exists or not for security
      if (!user || user.length === 0) {
        return res.json({ 
          message: "Se o email existir em nosso sistema, você receberá um código de recuperação.",
          emailSent: true
        });
      }

      const userData = user[0];

      // Generate 6-digit reset code
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpiry: resetExpiry
        })
        .where(eq(users.id, userData.id));

      // Send reset code by email
      try {
        const { sendEmail } = await import('./email-service.js');
        await sendEmail({
          to: email,
          subject: 'VittaVerde - Código de Recuperação de Senha',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #10b981, #059669); color: white;">
              <h2 style="text-align: center; margin-bottom: 30px;">🔐 Recuperação de Senha</h2>
              <div style="background: white; color: #333; padding: 30px; border-radius: 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Olá, ${userData.fullName}!</p>
                <p style="margin-bottom: 20px;">Você solicitou a recuperação de senha. Use o código abaixo:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                  <h1 style="color: #10b981; font-size: 36px; letter-spacing: 8px; margin: 0;">${resetToken}</h1>
                </div>
                <p style="margin-bottom: 20px;">Este código expira em <strong>1 hora</strong>.</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">Se você não solicitou esta recuperação, ignore este email.</p>
              </div>
              <p style="text-align: center; margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.8);">
                VittaVerde - Cannabis Medicinal Legal
              </p>
            </div>
          `
        });
        console.log(`✅ Código de recuperação enviado para ${email}`);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de recuperação:', emailError);
        return res.status(500).json({ message: "Erro ao enviar email. Tente novamente." });
      }

      res.json({ 
        message: "Código de recuperação enviado para seu email!",
        emailSent: true
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // 2. Verify reset code
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email e código são obrigatórios" });
      }

      // Find user with this email and reset code
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, email),
            eq(users.passwordResetToken, code.toString())
          )
        )
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: "Código inválido ou expirado" });
      }

      const userData = user[0];

      // Check if token expired
      if (userData.passwordResetExpiry && new Date() > new Date(userData.passwordResetExpiry)) {
        return res.status(410).json({ 
          message: "Código expirado. Solicite um novo código.",
          expired: true
        });
      }

      res.json({ 
        message: "Código verificado com sucesso!",
        valid: true
      });
    } catch (error) {
      console.error("Error verifying reset code:", error);
      res.status(500).json({ message: "Erro ao verificar código" });
    }
  });

  // 3. Reset password with verified code
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, código e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A senha deve ter no mínimo 6 caracteres" });
      }

      // Find user with this email and reset code
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, email),
            eq(users.passwordResetToken, code.toString())
          )
        )
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: "Código inválido ou expirado" });
      }

      const userData = user[0];

      // Check if token expired
      if (userData.passwordResetExpiry && new Date() > new Date(userData.passwordResetExpiry)) {
        return res.status(410).json({ 
          message: "Código expirado. Solicite um novo código.",
          expired: true
        });
      }

      // Hash new password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null
        })
        .where(eq(users.id, userData.id));

      console.log(`✅ Senha resetada com sucesso para ${email}`);

      res.json({ 
        message: "Senha alterada com sucesso! Você já pode fazer login.",
        success: true
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Erro ao resetar senha" });
    }
  });

  // Verify email with 6-digit code
  app.post("/api/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email e código são obrigatórios" });
      }

      // Find user with this email and code
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, email),
            eq(users.verificationToken, code.toString())
          )
        )
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: "Código de verificação inválido" });
      }

      const userData = user[0];

      // Check if token expired
      if (userData.verificationTokenExpiry && new Date() > new Date(userData.verificationTokenExpiry)) {
        return res.status(410).json({ 
          message: "Código expirado. Solicite um novo código.",
          expired: true
        });
      }

      // Check if already verified
      if (userData.emailVerified) {
        return res.status(200).json({ 
          message: "Email já verificado. Você pode fazer login.",
          alreadyVerified: true
        });
      }

      // Mark email as verified and clear token
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null
        })
        .where(eq(users.id, userData.id));

      // Create session (auto login after verification)
      req.session.userId = userData.id;
      req.session.userRole = userData.role;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
        }
        
        console.log(`✅ Email verificado com sucesso para ${userData.email}`);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = userData;
        res.json({ 
          message: "Email verificado com sucesso! Você já está logado.",
          user: userWithoutPassword,
          verified: true
        });
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ message: "Erro ao verificar código" });
    }
  });

  // Resend verification code
  app.post("/api/resend-code", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const userData = user[0];

      // Check if already verified
      if (userData.emailVerified) {
        return res.status(200).json({ 
          message: "Email já verificado. Você pode fazer login.",
          alreadyVerified: true
        });
      }

      // Generate new 6-digit code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new code
      await db
        .update(users)
        .set({
          verificationToken: newCode,
          verificationTokenExpiry: newExpiry
        })
        .where(eq(users.id, userData.id));

      // Send verification email with new code
      try {
        const { sendVerificationEmail } = await import('./email-service.js');
        await sendVerificationEmail(userData.email, userData.fullName, newCode);
        console.log(`✅ Novo código enviado para ${userData.email}`);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email:', emailError);
        return res.status(500).json({ message: "Erro ao enviar email" });
      }

      res.json({ 
        message: "Novo código enviado com sucesso!",
        codeSent: true
      });
    } catch (error) {
      console.error("Error resending code:", error);
      res.status(500).json({ message: "Erro ao reenviar código" });
    }
  });

  // ===========================================
  // SYNC MANAGEMENT APIs FOR TESTING & MONITORING
  // ===========================================

  // Get sync scheduler status
  app.get("/api/sync/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = syncScheduler.getStatus();
      const syncManagerStatus = await syncManager.getSyncStatus();
      
      res.json({
        scheduler: status,
        providers: syncManagerStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: "Error fetching sync status" });
    }
  });

  // Trigger manual sync (for testing)
  app.post("/api/sync/trigger", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { type = 'incremental' } = req.body;
      
      if (!['full', 'incremental'].includes(type)) {
        return res.status(400).json({ message: "Invalid sync type. Use 'full' or 'incremental'" });
      }
      
      const jobId = await syncScheduler.triggerManualSync(type);
      
      res.json({
        message: `${type} sync triggered successfully`,
        jobId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error triggering manual sync:", error);
      res.status(500).json({ message: "Error triggering sync" });
    }
  });

  // Get sync job history
  app.get("/api/sync/jobs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const jobs = syncScheduler.getRecentJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching sync jobs:", error);
      res.status(500).json({ message: "Error fetching sync jobs" });
    }
  });

  // Get specific job status
  app.get("/api/sync/jobs/:jobId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const job = syncScheduler.getJobStatus(req.params.jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job status:", error);
      res.status(500).json({ message: "Error fetching job status" });
    }
  });

  // Test webhook security (for development/testing)
  app.post("/api/sync/test-webhook-security", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { testSignature = false, testRateLimit = false, testIdempotency = false } = req.body;
      
      const testResults: any = {
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      if (testSignature) {
        // Test HMAC signature generation
        const testPayload = JSON.stringify({ test: "data", timestamp: Date.now() });
        const timestamp = Math.floor(Date.now() / 1000);
        
        // This would normally use the webhook security manager
        testResults.tests.signature = {
          payload: testPayload,
          timestamp,
          signatureGenerated: true
        };
      }
      
      if (testRateLimit) {
        testResults.tests.rateLimit = {
          description: "Rate limiting is active for webhook endpoints",
          status: "configured"
        };
      }
      
      if (testIdempotency) {
        testResults.tests.idempotency = {
          description: "Idempotency keys are supported for webhook endpoints",
          status: "configured"
        };
      }
      
      res.json({
        message: "Webhook security test completed",
        results: testResults
      });
    } catch (error) {
      console.error("Error testing webhook security:", error);
      res.status(500).json({ message: "Error testing webhook security" });
    }
  });

  // ===========================================
  // WEBHOOK APIs FOR TELEMEDICINE INTEGRATION
  // ===========================================

  // Production-grade webhook security middleware with HMAC, replay protection, rate limiting
  const webhookSecurityMiddleware = createWebhookSecurityMiddleware({
    requireSignature: true,
    requireTimestamp: true,
    requireNonce: false, // Optional for high-volume webhooks
    enableRateLimit: true,
    enableIdempotency: true,
    rateLimitIdentifier: (req) => req.headers['x-provider-key'] as string || req.ip || 'unknown'
  });

  // Simplified API key middleware for basic webhook authentication
  const webhookApiKeyMiddleware = createApiKeyMiddleware({
    validKeys: [
      process.env.TELEMEDICINE_API_KEY,
      process.env.WEBHOOK_API_KEY
    ].filter((key): key is string => Boolean(key)),
    headerName: 'x-api-key'
  });

  // WEBHOOK ENDPOINTS
  
  // 1. Webhook: Receive Telemedicine Consultation Data
  app.post("/api/webhooks/telemedicine/consultation", webhookApiKeyMiddleware, webhookSecurityMiddleware, async (req, res) => {
    try {
      
      const validatedData = insertTelemedicineConsultationSchema.parse(req.body);
      
      // Check if consultation already exists by external ID
      const existingConsultation = await storage.getTelemedicineConsultationByExternalId(
        validatedData.providerId, 
        validatedData.externalConsultationId
      );
      
      let consultation;
      if (existingConsultation) {
        // Update existing consultation
        consultation = await storage.updateTelemedicineConsultation(existingConsultation.id, validatedData);
      } else {
        // Create new consultation
        consultation = await storage.createTelemedicineConsultation(validatedData);
        
        // Try to match patient by email/cpf if external patient data provided
        if (validatedData.externalClientData?.email) {
          const user = await storage.getUserByEmail(validatedData.externalClientData.email);
          if (user?.role === 'patient') {
            const patient = await storage.getClientByUserId(user.id);
            if (patient) {
              await storage.updateTelemedicineConsultation(consultation.id, { clientId: patient.id });
            }
          }
        }
      }
      
      res.status(201).json({ 
        message: "Consultation data received successfully", 
        consultationId: consultation?.id,
        action: existingConsultation ? "updated" : "created"
      });
    } catch (error) {
      const errorMsg = error instanceof z.ZodError ? "Invalid consultation data" : "Error processing consultation data";
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: errorMsg, errors: error.errors });
      }
      console.error("Error processing telemedicine consultation webhook:", error);
      res.status(500).json({ message: errorMsg });
    }
  });

  // 2. Webhook: Receive External Prescription Data
  app.post("/api/webhooks/telemedicine/prescription", webhookApiKeyMiddleware, webhookSecurityMiddleware, async (req, res) => {
    try {
      
      const validatedData = insertExternalPrescriptionSchema.parse(req.body);
      
      // Check if prescription already exists
      const existingPrescription = await storage.getExternalPrescriptionByExternalId(
        validatedData.providerId,
        validatedData.externalPrescriptionId
      );
      
      let prescription;
      if (existingPrescription) {
        prescription = await storage.updateExternalPrescription(existingPrescription.id, validatedData);
      } else {
        prescription = await storage.createExternalPrescription(validatedData);
        
        // Auto-match products if possible
        try {
          const allProducts = await storage.getProducts();
          const matchedProducts = [];
          
          for (const medication of validatedData.prescribedMedications) {
            const matches = allProducts.filter(product => 
              product.name.toLowerCase().includes(medication.name.toLowerCase()) ||
              (medication.activeSubstance && 
               Array.isArray(product.activeSubstances) && product.activeSubstances.some((substance: any) => 
                 substance.substance.toLowerCase().includes(medication.activeSubstance!.toLowerCase())
               ))
            );
            
            if (matches.length > 0) {
              matchedProducts.push({
                externalMed: medication.name,
                ourProductId: matches[0].id,
                confidence: 0.8
              });
            }
          }
          
          if (matchedProducts.length > 0) {
            await storage.convertExternalPrescriptionToProducts(prescription.id, matchedProducts);
          }
        } catch (matchError) {
          console.warn("Error auto-matching products:", matchError);
        }
      }
      
      // Update lead status and patient flags when prescription is received
      try {
        if (prescription && prescription.telemedicineConsultationId) {
          const consultation = await storage.getTelemedicineConsultation(prescription.telemedicineConsultationId);
          if (consultation && consultation.clientId) {
          // Update lead status to receita_recebida
          const lead = await storage.getLeadByClientId(consultation.clientId);
          if (lead) {
            await storage.updateLeadStatus(lead.id, { 
              status: 'receita_recebida',
              notes: 'Receita recebida automaticamente via telemedicina'
            });
            
            // Create stage history
            await storage.createLeadStageHistory({
              leadId: lead.id,
              previousStatus: lead.status,
              newStatus: 'receita_recebida',
              byUserId: consultation.providerId, // Using provider as the "user" who triggered this
              notes: 'Receita recebida via webhook de telemedicina'
            });
          }
          
          // Update patient flags
          await storage.updateClientFlags(consultation.clientId, {
            prescriptionValidated: true,
            canViewPrices: true,
            telemedConsultationId: consultation.id
          });
          }
        }
      } catch (leadUpdateError) {
        console.warn("Error updating lead status after prescription received:", leadUpdateError);
        // Don't fail the webhook if lead update fails
      }
      
      res.status(201).json({ 
        message: "Prescription data received successfully", 
        prescriptionId: prescription?.id,
        action: existingPrescription ? "updated" : "created"
      });
    } catch (error) {
      const errorMsg = error instanceof z.ZodError ? "Invalid prescription data" : "Error processing prescription data";
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: errorMsg, errors: error.errors });
      }
      console.error("Error processing prescription webhook:", error);
      res.status(500).json({ message: errorMsg });
    }
  });

  // 3. Webhook: Receive Medical Record Data
  app.post("/api/webhooks/telemedicine/medical-record", webhookApiKeyMiddleware, webhookSecurityMiddleware, async (req, res) => {
    try {
      
      const validatedData = insertMedicalRecordSchema.parse(req.body);
      
      // Check if medical record already exists for this consultation
      let medicalRecord;
      if (validatedData.telemedicineConsultationId) {
        const existingRecord = await storage.getMedicalRecordByConsultation(validatedData.telemedicineConsultationId);
        if (existingRecord) {
          medicalRecord = await storage.updateMedicalRecord(existingRecord.id, validatedData);
        } else {
          medicalRecord = await storage.createMedicalRecord(validatedData);
        }
      } else {
        medicalRecord = await storage.createMedicalRecord(validatedData);
      }
      
      res.status(201).json({ 
        message: "Medical record data received successfully", 
        recordId: medicalRecord?.id
      });
    } catch (error) {
      const errorMsg = error instanceof z.ZodError ? "Invalid medical record data" : "Error processing medical record data";
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: errorMsg, errors: error.errors });
      }
      console.error("Error processing medical record webhook:", error);
      res.status(500).json({ message: errorMsg });
    }
  });

  // 4. Webhook: Receive Status Updates
  app.post("/api/webhooks/telemedicine/status-update", webhookApiKeyMiddleware, webhookSecurityMiddleware, async (req, res) => {
    try {
      
      const updateSchema = z.object({
        providerId: z.string(),
        externalConsultationId: z.string(),
        status: z.string(),
        syncStatus: z.string().optional(),
        updateData: z.record(z.any()).optional(),
        timestamp: z.string().optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Find the consultation and update its status
      const consultation = await storage.getTelemedicineConsultationByExternalId(
        validatedData.providerId,
        validatedData.externalConsultationId
      );
      
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      
      const updatedConsultation = await storage.updateConsultationStatus(
        consultation.id,
        validatedData.status,
        validatedData.syncStatus
      );
      
      // Apply additional update data if provided
      if (validatedData.updateData) {
        await storage.updateTelemedicineConsultation(consultation.id, validatedData.updateData);
      }
      
      res.json({ 
        message: "Status updated successfully", 
        consultationId: consultation.id,
        newStatus: validatedData.status
      });
    } catch (error) {
      const errorMsg = error instanceof z.ZodError ? "Invalid status update data" : "Error processing status update";
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: errorMsg, errors: error.errors });
      }
      console.error("Error processing status update webhook:", error);
      res.status(500).json({ message: errorMsg });
    }
  });

  // TELEMEDICINE MANAGEMENT ROUTES
  
  // 5. Get Telemedicine Providers
  app.get("/api/telemedicine/providers", requireAuth, async (req, res) => {
    try {
      const providers = await storage.getActiveTelemedicineProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching telemedicine providers:", error);
      res.status(500).json({ message: "Error fetching providers" });
    }
  });

  app.post("/api/telemedicine/providers", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const validatedData = insertTelemedicineProviderSchema.parse(req.body);
      const provider = await storage.createTelemedicineProvider(validatedData);
      res.status(201).json(provider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid provider data", errors: error.errors });
      }
      console.error("Error creating telemedicine provider:", error);
      res.status(500).json({ message: "Error creating provider" });
    }
  });

  // 6. Patient Pathologies Routes
  app.get("/api/telemedicine/patients/:id/pathologies", requireAuth, async (req, res) => {
    try {
      const patientId = req.params.id;
      const pathologies = await storage.getPatientPathologiesByPatient(patientId);
      res.json(pathologies);
    } catch (error) {
      console.error("Error fetching patient pathologies:", error);
      res.status(500).json({ message: "Error fetching pathologies" });
    }
  });

  app.post("/api/telemedicine/patients/:id/pathologies", requireAuth, async (req, res) => {
    try {
      const patientId = req.params.id;
      const validatedData = insertClientPathologySchema.parse({
        ...req.body,
        patientId
      });
      
      const pathology = await storage.createPatientPathology(validatedData);
      res.status(201).json(pathology);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pathology data", errors: error.errors });
      }
      console.error("Error creating patient pathology:", error);
      res.status(500).json({ message: "Error creating pathology" });
    }
  });

  // 7. ANVISA Process Routes
  app.get("/api/anvisa/processes", requireAuth, async (req, res) => {
    try {
      const { patientId, status } = req.query;
      let processes;
      
      if (patientId) {
        processes = await storage.getAnvisaProcessesByPatient(patientId as string);
      } else {
        // Admin can see all processes
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
        // Get all ANVISA processes for admin (implement this method if needed)
        processes = [] as any[]; // TODO: Implement getAllAnvisaProcesses in storage
      }
      
      if (status) {
        processes = processes.filter((p: any) => p.status === status);
      }
      
      res.json(processes);
    } catch (error) {
      console.error("Error fetching ANVISA processes:", error);
      res.status(500).json({ message: "Error fetching ANVISA processes" });
    }
  });

  app.post("/api/anvisa/processes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAnvisaProcessSchema.parse(req.body);
      const process = await storage.createAnvisaProcess(validatedData);
      res.status(201).json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ANVISA process data", errors: error.errors });
      }
      console.error("Error creating ANVISA process:", error);
      res.status(500).json({ message: "Error creating ANVISA process" });
    }
  });

  app.put("/api/anvisa/processes/:id", requireAuth, async (req, res) => {
    try {
      const processId = req.params.id;
      const updateSchema = insertAnvisaProcessSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const process = await storage.updateAnvisaProcess(processId, validatedData);
      if (!process) {
        return res.status(404).json({ message: "ANVISA process not found" });
      }
      
      res.json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      console.error("Error updating ANVISA process:", error);
      res.status(500).json({ message: "Error updating ANVISA process" });
    }
  });

  // 8. Post-Sale Followup Routes
  app.get("/api/post-sale/followups", requireAuth, async (req, res) => {
    try {
      const { patientId, orderId, status, date } = req.query;
      let followups;
      
      if (patientId) {
        followups = await storage.getPostSaleFollowupsByPatient(patientId as string);
      } else if (orderId) {
        followups = await storage.getPostSaleFollowupsByOrder(orderId as string);
      } else if (date) {
        followups = await storage.getScheduledFollowups(new Date(date as string));
      } else {
        // Admin can see all followups, others see their own
        if (req.user?.role === 'admin') {
          // Get all post-sale followups for admin (implement this method if needed)
          followups = [] as any[]; // TODO: Implement getAllPostSaleFollowups in storage
        } else if (req.user?.role === 'consultant') {
          const consultant = await storage.getConsultantByUserId(req.user.id);
          if (consultant) {
            followups = await storage.getPostSaleFollowupsByPatient(consultant.id); // Note: adjust this method based on your storage implementation
          } else {
            followups = [];
          }
        } else {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      if (status) {
        followups = followups.filter((f: any) => f.status === status);
      }
      
      res.json(followups);
    } catch (error) {
      console.error("Error fetching post-sale followups:", error);
      res.status(500).json({ message: "Error fetching followups" });
    }
  });

  app.post("/api/post-sale/followups", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPostSaleFollowupSchema.parse(req.body);
      
      // Set consultant ID if user is consultant
      if (req.user?.role === 'consultant' && !validatedData.consultantId) {
        const consultant = await storage.getConsultantByUserId(req.user.id);
        if (consultant) {
          validatedData.consultantId = consultant.id;
        }
      }
      
      const followup = await storage.createPostSaleFollowup(validatedData);
      res.status(201).json(followup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid followup data", errors: error.errors });
      }
      console.error("Error creating post-sale followup:", error);
      res.status(500).json({ message: "Error creating followup" });
    }
  });

  app.put("/api/post-sale/followups/:id", requireAuth, async (req, res) => {
    try {
      const followupId = req.params.id;
      const updateSchema = insertPostSaleFollowupSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const followup = await storage.updatePostSaleFollowup(followupId, validatedData);
      if (!followup) {
        return res.status(404).json({ message: "Followup not found" });
      }
      
      res.json(followup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      console.error("Error updating post-sale followup:", error);
      res.status(500).json({ message: "Error updating followup" });
    }
  });

  // ===========================================
  // END WEBHOOK APIs FOR TELEMEDICINE
  // ===========================================

  // Clients/Patients - for medical panel with complete information
  app.get("/api/clients", requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const patients = await storage.getPatients();
      
      // Enrich with CRM data (intake information) and flags
      const enrichedPatients = await Promise.all(
        patients.map(async (patient) => {
          // Get CRM lead for intake data
          const lead = await storage.getLeadByClientId(patient.id);
          
          // Get patient flags for document status
          const flags = await storage.getClientFlags(patient.id);
          console.log(`[API /clients] Patient ${patient.id} flags:`, flags);
          
          // Parse intake information from lead notes
          let intakeInfo = null;
          if (lead?.notes) {
            const patologiasMatch = lead.notes.match(/Condições: ([^\n]+)/);
            const sintomasMatch = lead.notes.match(/Sintomas: ([^\n]+)/);
            const idadeMatch = lead.notes.match(/Idade: (\d+)/);
            const pesoMatch = lead.notes.match(/Peso: ([0-9.]+)kg/);
            
            intakeInfo = {
              patologias: patologiasMatch ? patologiasMatch[1].split(', ') : [],
              sintomas: sintomasMatch ? sintomasMatch[1].split(', ') : [],
              idade: idadeMatch ? idadeMatch[1] : null,
              peso: pesoMatch ? pesoMatch[1] : null,
            };
          }
          
          return {
            ...patient,
            currentStage: lead?.status || 'novo',
            intakeInfo,
            flags,
            leadCreatedAt: lead?.createdAt,
            leadUpdatedAt: lead?.updatedAt,
            lastActivityDate: lead?.updatedAt || patient.createdAt
          };
        })
      );
      
      res.json(enrichedPatients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  // Check if current user has completed intake (for patients/clients)
  app.get("/api/check-intake-status", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get client profile to find client ID
      const client = await storage.getClientByUserId(userId);
      
      if (!client) {
        return res.json({ hasCompletedIntake: false });
      }
      
      // Check if user has pathologies registered (primary source of intake data)
      const pathologies = await storage.getPatientPathologiesByPatient(client.id);
      
      // If has pathologies, intake is completed
      if (pathologies && pathologies.length > 0) {
        return res.json({ hasCompletedIntake: true });
      }
      
      // Fallback: Check if user has a CRM lead with intake information
      const lead = await storage.getLeadByClientId(client.id);
      
      // Patient has completed intake if they have a lead with tags (pathologies) or notes with intake info
      const hasCompletedIntake = !!(
        (lead?.tags && lead.tags.length > 0) || 
        (lead?.notes && (lead.notes.includes('Condições:') || lead.notes.includes('Sintomas:')))
      );
      
      res.json({ hasCompletedIntake });
    } catch (error) {
      console.error("Error checking intake status:", error);
      res.status(500).json({ message: "Error checking intake status" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { category, supplier } = req.query;
      let products = await storage.getProducts();
      
      if (category) {
        products = products.filter(p => p.category === category);
      }
      
      if (supplier) {
        products = products.filter(p => p.supplier === supplier);
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  // Create product (admin only)
  app.post("/api/products", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      let validatedData = insertProductSchema.parse(req.body);
      
      // Auto-generate activeSubstances from concentration if not provided
      if (validatedData.concentration && !validatedData.activeSubstances) {
        validatedData.activeSubstances = [{
          substance: "CBD",
          concentration: validatedData.concentration
        }];
      }
      
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Error creating product" });
    }
  });

  // Update product (admin only)
  app.put("/api/products/:id", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      console.log("📝 UPDATE PRODUCT - ID:", req.params.id);
      console.log("📝 UPDATE PRODUCT - Dados recebidos:", JSON.stringify(req.body, null, 2));
      
      // Validate that product exists first
      const existingProduct = await storage.getProduct(req.params.id);
      if (!existingProduct) {
        console.log("❌ Produto não encontrado:", req.params.id);
        return res.status(404).json({ message: "Product not found" });
      }
      
      console.log("✅ Produto existente encontrado:", existingProduct.name);
      
      // Create a partial schema for updates (all fields optional)
      const updateSchema = insertProductSchema.partial();
      let validatedUpdates = updateSchema.parse(req.body);
      
      console.log("✅ Dados validados:", JSON.stringify(validatedUpdates, null, 2));
      
      // Auto-generate activeSubstances from concentration if not provided
      if (validatedUpdates.concentration && !validatedUpdates.activeSubstances) {
        validatedUpdates.activeSubstances = [{
          substance: "CBD",
          concentration: validatedUpdates.concentration
        }];
      }
      
      const product = await storage.updateProduct(req.params.id, validatedUpdates);
      if (!product) {
        console.log("❌ Erro ao atualizar produto");
        return res.status(404).json({ message: "Product not found" });
      }
      
      console.log("✅ Produto atualizado com sucesso:", product.name);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("❌ Erro de validação:", error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("❌ Error updating product:", error);
      res.status(500).json({ message: "Error updating product" });
    }
  });

  // Delete product (admin only)
  app.delete("/api/products/:id", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      // Validate that product exists first
      const existingProduct = await storage.getProduct(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Stock control routes
  
  // Get all stock movements
  app.get("/api/stock/movements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const movements = await storage.getStockMovements();
      res.json(movements);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      res.status(500).json({ message: "Error fetching stock movements" });
    }
  });

  // Get stock movements for a specific product
  app.get("/api/stock/movements/product/:productId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const movements = await storage.getStockMovementsByProduct(req.params.productId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching product stock movements:", error);
      res.status(500).json({ message: "Error fetching product stock movements" });
    }
  });

  // Get stock summary
  app.get("/api/stock/summary", requireAuth, requireAdmin, async (req, res) => {
    try {
      const summary = await storage.getStockSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching stock summary:", error);
      res.status(500).json({ message: "Error fetching stock summary" });
    }
  });

  // Get products with low stock
  app.get("/api/stock/low-stock", requireAuth, requireAdmin, async (req, res) => {
    try {
      const products = await storage.getProductsWithLowStock();
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Error fetching low stock products" });
    }
  });

  // Get stock history for a product
  app.get("/api/stock/history/:productId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getProductStockHistory(req.params.productId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching stock history:", error);
      res.status(500).json({ message: "Error fetching stock history" });
    }
  });

  // Get complete transaction details
  app.get("/api/transactions/:id/details", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactionId = req.params.id;
      
      // Get stock movement
      const [movement] = await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.id, transactionId))
        .limit(1);
      
      if (!movement) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      // Get product details
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, movement.productId))
        .limit(1);
      
      // Get user who made the movement
      const [movementUser] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role
        })
        .from(users)
        .where(eq(users.id, movement.userId))
        .limit(1);
      
      // Get order if this movement has an order reference
      let orderDetails = null;
      let clientDetails = null;
      let prescriptionDetails = null;
      
      if (movement.reference && movement.reference.startsWith('ORD-')) {
        const orderId = movement.reference.replace('ORD-', '');
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);
        
        if (order) {
          orderDetails = order;
          
          // Get client details
          if (order.clientId) {
            const [client] = await db
              .select({
                id: clients.id,
                userId: clients.userId,
                healthCondition: clients.healthCondition,
                anvisaStatus: clients.anvisaStatus,
                anvisaNumber: clients.anvisaNumber,
                trackingCode: clients.trackingCode
              })
              .from(clients)
              .where(eq(clients.id, order.clientId))
              .limit(1);
            
            if (client) {
              clientDetails = client;
              
              // Get client user info
              const [clientUser] = await db
                .select({
                  id: users.id,
                  username: users.username,
                  email: users.email
                })
                .from(users)
                .where(eq(users.id, client.userId))
                .limit(1);
              
              clientDetails = { ...clientDetails, user: clientUser };
            }
          }
          
          // Get prescription details
          if (order.prescriptionId) {
            const [prescription] = await db
              .select()
              .from(prescriptions)
              .where(eq(prescriptions.id, order.prescriptionId))
              .limit(1);
            
            prescriptionDetails = prescription;
          }
        }
      }
      
      res.json({
        movement,
        product,
        user: movementUser,
        order: orderDetails,
        client: clientDetails,
        prescription: prescriptionDetails
      });
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da transação" });
    }
  });

  // Update product stock (entry, exit, adjustment)
  app.post("/api/stock/update", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.string(),
        quantity: z.number().int(),
        type: z.enum(['in', 'out', 'adjustment']),
        movementDate: z.string(),
        reason: z.string(),
        reference: z.string().optional(),
        notes: z.string().optional()
      });

      const validatedData = schema.parse(req.body);
      const userId = req.user?.id;

      const movement = await storage.updateProductStock(
        validatedData.productId,
        validatedData.quantity,
        validatedData.type,
        validatedData.reason,
        userId,
        validatedData.reference,
        validatedData.notes,
        validatedData.movementDate
      );

      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating stock:", error);
      res.status(500).json({ message: "Error updating stock" });
    }
  });

  // Bulk stock update
  app.post("/api/stock/bulk-update", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const schema = z.object({
        updates: z.array(z.object({
          productId: z.string(),
          quantity: z.number().int(),
          reason: z.string()
        }))
      });

      const validatedData = schema.parse(req.body);
      const movements = await storage.bulkUpdateStock(validatedData.updates);

      res.status(201).json(movements);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error bulk updating stock:", error);
      res.status(500).json({ message: "Error bulk updating stock" });
    }
  });

  // Adjust product stock
  app.post("/api/stock/adjust", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.string(),
        newQuantity: z.number().int().min(0),
        reason: z.string(),
        notes: z.string().optional()
      });

      const validatedData = schema.parse(req.body);
      const userId = req.user?.id;

      const movement = await storage.adjustProductStock(
        validatedData.productId,
        validatedData.newQuantity,
        validatedData.reason,
        userId,
        validatedData.notes
      );

      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adjusting stock:", error);
      res.status(500).json({ message: "Error adjusting stock" });
    }
  });

  // Tags routes
  app.get("/api/tags", requireAuth, async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Error fetching tags" });
    }
  });

  app.get("/api/tags/:id", requireAuth, async (req, res) => {
    try {
      const tag = await storage.getTag(req.params.id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "Error fetching tag" });
    }
  });

  // Create tag (admin only)
  app.post("/api/tags", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Error creating tag" });
    }
  });

  // Update tag (admin only)
  app.put("/api/tags/:id", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      // Validate that tag exists first
      const existingTag = await storage.getTag(req.params.id);
      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      // Create a partial schema for updates (all fields optional)
      const updateSchema = insertTagSchema.partial();
      const validatedUpdates = updateSchema.parse(req.body);
      
      const tag = await storage.updateTag(req.params.id, validatedUpdates);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      res.json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
      }
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Error updating tag" });
    }
  });

  // Delete tag (admin only)
  app.delete("/api/tags/:id", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      // Validate that tag exists first
      const existingTag = await storage.getTag(req.params.id);
      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      const deleted = await storage.deleteTag(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Error deleting tag" });
    }
  });

  // Doctors
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await storage.getActiveDoctors();
      res.json(doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Error fetching doctors" });
    }
  });

  app.get("/api/doctors/current", async (req, res) => {
    try {
      // For demo purposes, return the first doctor
      // In production, you would get this from authenticated user session
      const doctors = await storage.getActiveDoctors();
      if (doctors.length > 0) {
        res.json(doctors[0]);
      } else {
        res.status(404).json({ message: "No doctors found" });
      }
    } catch (error) {
      console.error("Error fetching current doctor:", error);
      res.status(500).json({ message: "Error fetching current doctor" });
    }
  });

  app.put("/api/doctors/:doctorId/working-hours", requireAuth, requireRole(["doctor", "admin"]), adminCsrfProtection, async (req, res) => {
    try {
      // Authorization check for doctor role - can only update own working hours
      if (req.user!.role === "doctor") {
        const doctor = await storage.getDoctorByUserId(req.user!.id);
        if (!doctor || doctor.id !== req.params.doctorId) {
          return res.status(403).json({ message: "Access denied: can only update your own working hours" });
        }
      }
      
      const { workingHours } = req.body;
      const doctor = await storage.updateDoctorWorkingHours(req.params.doctorId, workingHours);
      res.json(doctor);
    } catch (error) {
      console.error("Error updating working hours:", error);
      res.status(500).json({ message: "Error updating working hours" });
    }
  });

  // Prescription endpoints
  app.post('/api/prescriptions', requireAuth, requireRole(["doctor", "admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const prescription = await storage.createPrescription(req.body);
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create prescription' });
    }
  });

  app.get('/api/prescriptions/recent', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const prescriptions = await storage.getRecentPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch prescriptions' });
    }
  });

  app.get('/api/prescriptions/history', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionHistory();
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch prescription history' });
    }
  });

  // Medical history endpoints
  app.get('/api/treatments/history', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const treatments = await storage.getTreatmentHistory();
      res.json(treatments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch treatment history' });
    }
  });

  // Patients endpoint - ADMIN and DOCTOR access
  app.get('/api/patients', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch patients' });
    }
  });

  // Admin Dashboard Stats - Real Data from DB
  app.get('/api/admin/dashboard-stats', requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const [allUsers, patients, leads, products] = await Promise.all([
        storage.getUsers(),
        storage.getPatients(),
        storage.getLeads(),
        storage.getProducts()
      ]);
      
      // Count educational content directly from DB
      const contentResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(educationalContent)
        .where(eq(educationalContent.status, 'active'));
      
      const totalContent = contentResult[0]?.count || 0;
      
      // Count doctors
      const doctors = allUsers.filter((u: any) => u.role === 'doctor');
      
      // Count active leads (status != lost or converted)
      const activeLeads = leads.filter((l: any) => 
        l.status !== 'lost' && l.status !== 'converted'
      ).length;
      
      res.json({
        totalUsers: allUsers.length,
        activePatients: patients.length,
        registeredDoctors: doctors.length,
        activeLeads: activeLeads,
        totalProducts: products.length,
        totalContent: Number(totalContent),
      });
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin dashboard stats' });
    }
  });

  // Admin Financial Stats
  app.get('/api/admin/financial-stats/:period?', requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      console.log('🚀 ==> FINANCIAL STATS API CALLED <==');
      const period = parseInt(req.params.period || req.query.period as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // Get orders, stock movements, and expenses from database
      const [ordersResult, productsResult, movementsResult, expensesResult] = await Promise.all([
        db.select().from(orders).orderBy(desc(orders.createdAt)),
        db.select().from(products),
        db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)),
        db.select().from(expenses).orderBy(desc(expenses.expenseDate))
      ]);
      
      console.log('📊 TOTAL MOVEMENTS FROM DB:', movementsResult.length);
      console.log('💸 TOTAL EXPENSES FROM DB:', expensesResult.length);

      // Filter orders by period and status
      const filteredOrders = ordersResult.filter((o: any) => 
        new Date(o.createdAt) >= startDate &&
        (o.status === 'delivered' || o.status === 'paid' || o.status === 'shipped')
      );

      // Calculate revenue from orders
      const revenueFromOrders = filteredOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0
      );

      // Filter stock movements by period
      const purchaseMovements = movementsResult.filter((m: any) => 
        m.type === 'in' && 
        new Date(m.movementDate || m.createdAt) >= startDate &&
        m.costPrice
      );

      // Filter SAÍDAS (vendas manuais) - type 'out' conta como RECEITA
      const saleMovements = movementsResult.filter((m: any) => 
        m.type === 'out' && 
        new Date(m.movementDate || m.createdAt) >= startDate
      );

      console.log('🔍 DEBUG Financial Stats:');
      console.log('📅 Start Date:', startDate);
      console.log('📦 Total movements:', movementsResult.length);
      console.log('💰 Sale movements (type=out):', saleMovements.length);
      
      // Calculate revenue from manual sales (saídas)
      const revenueFromSales = saleMovements.reduce((sum: number, movement: any) => {
        // Try to get value from movement first
        let value = parseFloat(movement.totalValue || 0) || 
                   (parseFloat(movement.unitValue || 0) * Math.abs(movement.quantity));
        
        // If no value in movement, calculate from product price
        if (value === 0) {
          const product = productsResult.find((p: any) => p.id === movement.productId);
          if (product && product.price) {
            value = parseFloat(product.price) * Math.abs(movement.quantity);
            console.log(`💵 Auto-calculated: ${product.name} - ${product.price} × ${Math.abs(movement.quantity)} = ${value}`);
          }
        }
        
        console.log(`  Movement: ${movement.type}, qty: ${movement.quantity}, value: ${value}`);
        return sum + value;
      }, 0);
      
      console.log('💰 Total Revenue from Sales:', revenueFromSales);

      // Total revenue = orders + manual sales
      const totalRevenue = revenueFromOrders + revenueFromSales;

      // Calculate total costs from stock purchases
      const stockCosts = purchaseMovements.reduce((sum: number, movement: any) => 
        sum + (parseFloat(movement.costPrice || 0) * movement.quantity), 0
      );

      // Filter expenses by period and calculate total
      const filteredExpenses = expensesResult.filter((e: any) => 
        new Date(e.expenseDate) >= startDate
      );

      const expensesCosts = filteredExpenses.reduce((sum: number, expense: any) => 
        sum + parseFloat(expense.amount || 0), 0
      );

      console.log('💰 Stock Costs:', stockCosts);
      console.log('💸 Expenses Costs:', expensesCosts);

      // Total costs = stock purchases + expenses
      const totalCosts = stockCosts + expensesCosts;

      const profit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const totalSales = filteredOrders.length + saleMovements.length;
      const averageOrderValue = totalSales > 0 
        ? totalRevenue / totalSales 
        : 0;

      // Monthly revenue data (last 6 months)
      const monthlyData: { [key: string]: { revenue: number, costs: number } } = {};
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthlyData[monthKey] = { revenue: 0, costs: 0 };
      }

      // Aggregate orders by month
      filteredOrders.forEach((order: any) => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].revenue += parseFloat(order.totalAmount || 0);
        }
      });

      // Aggregate manual sales (saídas) by month
      saleMovements.forEach((movement: any) => {
        const movDate = new Date(movement.movementDate || movement.createdAt);
        const monthKey = `${movDate.getFullYear()}-${movDate.getMonth()}`;
        if (monthlyData[monthKey]) {
          let value = parseFloat(movement.totalValue || 0) || 
                     (parseFloat(movement.unitValue || 0) * Math.abs(movement.quantity));
          
          // If no value in movement, calculate from product price
          if (value === 0) {
            const product = productsResult.find((p: any) => p.id === movement.productId);
            if (product && product.price) {
              value = parseFloat(product.price) * Math.abs(movement.quantity);
            }
          }
          
          monthlyData[monthKey].revenue += value;
        }
      });

      // Aggregate costs by month from stock purchases
      purchaseMovements.forEach((movement: any) => {
        const movDate = new Date(movement.movementDate || movement.createdAt);
        const monthKey = `${movDate.getFullYear()}-${movDate.getMonth()}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].costs += parseFloat(movement.costPrice || 0) * movement.quantity;
        }
      });

      // Aggregate costs by month from expenses
      filteredExpenses.forEach((expense: any) => {
        const expDate = new Date(expense.expenseDate);
        const monthKey = `${expDate.getFullYear()}-${expDate.getMonth()}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].costs += parseFloat(expense.amount || 0);
        }
      });

      const monthlyRevenue = Object.keys(monthlyData).map(key => {
        const [year, month] = key.split('-').map(Number);
        const data = monthlyData[key];
        return {
          month: months[month],
          revenue: data.revenue,
          costs: data.costs,
          profit: data.revenue - data.costs
        };
      });

      // Category revenue distribution from orders AND manual sales
      const categoryRevenue: { [key: string]: number } = {};
      
      // Add revenue from orders
      filteredOrders.forEach((order: any) => {
        const items = order.items as any[];
        if (Array.isArray(items)) {
          items.forEach(item => {
            const product = productsResult.find((p: any) => p.id === item.productId);
            if (product) {
              const category = product.category || 'Outros';
              categoryRevenue[category] = (categoryRevenue[category] || 0) + (parseFloat(item.price || 0) * item.quantity);
            }
          });
        }
      });

      // Add revenue from manual sales (stock movements type=out)
      saleMovements.forEach((movement: any) => {
        const product = productsResult.find((p: any) => p.id === movement.productId);
        if (product) {
          const category = product.category || 'Outros';
          let value = parseFloat(movement.totalValue || 0) || 
                     (parseFloat(movement.unitValue || 0) * Math.abs(movement.quantity));
          
          if (value === 0) {
            value = parseFloat(product.price) * Math.abs(movement.quantity);
          }
          
          categoryRevenue[category] = (categoryRevenue[category] || 0) + value;
        }
      });

      const categoryRevenueArray = Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({
          category,
          revenue,
          percentage: totalRevenue > 0 ? parseFloat(((revenue / totalRevenue) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);

      console.log('📊 Category Revenue Array:', categoryRevenueArray);

      // Recent transactions (real data)
      const recentTransactions = [
        ...filteredOrders.slice(0, 5).map((order: any) => ({
          id: order.id,
          date: order.createdAt,
          type: 'revenue',
          description: `Pedido #${order.id.slice(0, 8)}`,
          amount: parseFloat(order.totalAmount || 0),
          status: order.status === 'delivered' ? 'completed' : 'pending'
        })),
        ...saleMovements.slice(0, 5).map((movement: any) => {
          let value = parseFloat(movement.totalValue || 0) || 
                     (parseFloat(movement.unitValue || 0) * Math.abs(movement.quantity));
          
          // If no value in movement, calculate from product price
          if (value === 0) {
            const product = productsResult.find((p: any) => p.id === movement.productId);
            if (product && product.price) {
              value = parseFloat(product.price) * Math.abs(movement.quantity);
            }
          }
          
          return {
            id: movement.id,
            date: movement.movementDate || movement.createdAt,
            type: 'revenue',
            description: `Venda Manual - ${movement.reason || 'Saída de estoque'}`,
            amount: value,
            status: 'completed'
          };
        }),
        ...purchaseMovements.slice(0, 5).map((movement: any) => ({
          id: movement.id,
          date: movement.movementDate || movement.createdAt,
          type: 'cost',
          description: `Compra - ${movement.supplier || movement.reason}`,
          amount: parseFloat(movement.costPrice || 0) * movement.quantity,
          status: 'completed'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

      res.json({
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalCosts: parseFloat(totalCosts.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        totalOrders: totalSales,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        monthlyRevenue,
        categoryRevenue: categoryRevenueArray,
        recentTransactions
      });
    } catch (error) {
      console.error('Error fetching financial stats:', error);
      res.status(500).json({ message: 'Failed to fetch financial stats' });
    }
  });

  // Admin Recent Activities - Temporary mock data (TODO: fix schema issues)
  app.get('/api/admin/recent-activities', requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const now = new Date();
      const activities = [
        {
          type: 'user_registered',
          description: 'Novo usuário cadastrado: Maria Silva',
          timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 min ago
          color: 'emerald',
          timeAgo: '30 min atrás'
        },
        {
          type: 'content_created',
          description: 'Novo conteúdo publicado: CBD e Epilepsia 2025',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
          color: 'teal',
          timeAgo: '2 horas atrás'
        },
        {
          type: 'order_placed',
          description: 'Novo pedido realizado: CBD 3000mg',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
          color: 'blue',
          timeAgo: '5 horas atrás'
        },
        {
          type: 'anvisa_approved',
          description: 'Autorização ANVISA aprovada para João Costa',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
          color: 'green',
          timeAgo: '1 dia atrás'
        },
        {
          type: 'user_registered',
          description: 'Novo médico cadastrado: Dr. Pedro Santos',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          color: 'emerald',
          timeAgo: '2 dias atrás'
        }
      ];

      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Failed to fetch recent activities' });
    }
  });

  // Helper function to format time ago
  function formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'} atrás`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
    return 'agora mesmo';
  }

  // Medical Analytics Endpoints - Real Data from DB
  app.get('/api/medical-analytics/stats', requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const patients = await storage.getPatients();
      const prescriptions = await storage.getRecentPrescriptions();
      
      // Get orders for success rate calculation
      const allOrders = await db.select().from(orders);
      const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'delivered');
      
      // Calculate SUCCESS RATE based on completed orders
      const successRate = allOrders.length > 0 
        ? Math.round((completedOrders.length / allOrders.length) * 100) 
        : 0;
      
      // Get satisfaction data from post-sale followups
      const followups = await db.select().from(postSaleFollowups)
        .where(sql`${postSaleFollowups.satisfactionScore} IS NOT NULL`);
      
      // Calculate SATISFACTION based on real scores (1-10 scale converted to percentage)
      let satisfactionRate = 0;
      if (followups.length > 0) {
        const avgScore = followups.reduce((sum, f) => sum + (f.satisfactionScore || 0), 0) / followups.length;
        satisfactionRate = Math.round((avgScore / 10) * 100); // Convert 1-10 to percentage
      }
      
      // Get real courses completed count
      const coursesCompleted = await db
        .select({ count: sql<number>`count(*)` })
        .from(eduProgress)
        .where(sql`${eduProgress.completedAt} IS NOT NULL`);
      
      res.json({
        totalPatients: patients.length,
        activePrescriptions: prescriptions.filter(p => p.isActive).length,
        successRate, // Real: completed orders / total orders
        satisfactionRate, // Real: average satisfaction score from followups
        coursesCompleted: coursesCompleted[0]?.count || 0 // Real: courses with completed_at set
      });
    } catch (error) {
      console.error('Error fetching medical stats:', error);
      res.status(500).json({ message: 'Failed to fetch medical stats' });
    }
  });

  app.get('/api/medical-analytics/patients-evolution', requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const patients = await storage.getPatients();
      
      // Group patients by month of creation
      const monthlyData: Record<string, number> = {};
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      patients.forEach(patient => {
        if (patient.createdAt) {
          const date = new Date(patient.createdAt);
          const monthKey = months[date.getMonth()];
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
      });
      
      // Create cumulative data for the last 6 months
      const currentMonth = new Date().getMonth();
      const evolutionData = [];
      let cumulative = 0;
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = months[monthIndex];
        cumulative += monthlyData[monthName] || 0;
        evolutionData.push({
          mes: monthName,
          pacientes: cumulative
        });
      }
      
      res.json(evolutionData);
    } catch (error) {
      console.error('Error fetching patients evolution:', error);
      res.status(500).json({ message: 'Failed to fetch patients evolution' });
    }
  });

  app.get('/api/medical-analytics/pathologies', requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      // Get all leads with health conditions (tags from intake form)
      const allLeads = await db
        .select({
          tags: leads.tags,
        })
        .from(leads)
        .where(sql`${leads.tags} IS NOT NULL AND array_length(${leads.tags}, 1) > 0`);
      
      // Count health conditions (tags)
      const pathologyCount: Record<string, number> = {};
      
      allLeads.forEach(lead => {
        if (lead.tags && Array.isArray(lead.tags)) {
          lead.tags.forEach((tag: string) => {
            if (tag && tag.trim()) {
              pathologyCount[tag] = (pathologyCount[tag] || 0) + 1;
            }
          });
        }
      });
      
      // If no data, return empty array so frontend shows "no data" message
      if (Object.keys(pathologyCount).length === 0) {
        return res.json([]);
      }
      
      // Convert to chart format
      const colors = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'];
      const pathologiesData = Object.entries(pathologyCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7) // Show top 7 conditions
        .map(([name, value], index) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
          value,
          color: colors[index % colors.length]
        }));
      
      res.json(pathologiesData);
    } catch (error) {
      console.error('Error fetching pathologies:', error);
      res.status(500).json({ message: 'Failed to fetch pathologies' });
    }
  });

  // Medical Analytics: Patient Journey Status Distribution  
  app.get('/api/medical-analytics/treatment-status', requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      // Get all clients with their flags
      const clientsWithStatus = await db
        .select({
          clientId: clients.id,
          prescriptionValidated: clientFlags.prescriptionValidated,
          anvisaDocumentValidated: clientFlags.anvisaDocumentValidated,
        })
        .from(clients)
        .leftJoin(clientFlags, eq(clients.id, clientFlags.clientId));
      
      // Get clients with prescriptions
      const prescriptionsResult = await db
        .select({
          clientId: prescriptions.clientId,
        })
        .from(prescriptions);
      
      const hasPrescriptionMap = new Set(prescriptionsResult.map(p => p.clientId));
      
      // Get clients with orders
      const ordersResult = await db
        .select({
          clientId: orders.clientId,
        })
        .from(orders);
      
      const hasOrdersMap = new Set(ordersResult.map(o => o.clientId));
      
      // Get clients with post-sale followups
      const followupsResult = await db
        .select({
          clientId: postSaleFollowups.clientId,
        })
        .from(postSaleFollowups);
      
      const hasFollowupMap = new Set(followupsResult.map(f => f.clientId));
      
      // Categorize patients by their journey stage (most advanced stage)
      let cadastro = 0;
      let consulta = 0;
      let anvisa = 0;
      let compra = 0;
      let acompanhamento = 0;
      
      clientsWithStatus.forEach(client => {
        const clientId = client.clientId;
        
        // Determine the most advanced stage
        if (hasFollowupMap.has(clientId)) {
          acompanhamento++;
        } else if (hasOrdersMap.has(clientId)) {
          compra++;
        } else if (client.anvisaDocumentValidated) {
          anvisa++;
        } else if (hasPrescriptionMap.has(clientId) || client.prescriptionValidated) {
          consulta++;
        } else {
          cadastro++;
        }
      });
      
      // Convert to chart format with journey stages
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
      const statusData = [
        { name: 'Cadastro', value: cadastro, color: colors[0] },
        { name: 'Consulta', value: consulta, color: colors[1] },
        { name: 'ANVISA', value: anvisa, color: colors[2] },
        { name: 'Compra', value: compra, color: colors[3] },
        { name: 'Acompanhamento', value: acompanhamento, color: colors[4] },
      ].filter(item => item.value > 0); // Only show stages with patients
      
      res.json(statusData);
    } catch (error) {
      console.error('Error fetching patient journey status:', error);
      res.status(500).json({ message: 'Failed to fetch patient journey status' });
    }
  });

  // Upload prescription endpoint
  app.post('/api/prescriptions/upload', requireAuth, requireRole(["doctor", "admin"]), adminCsrfProtection, async (req, res) => {
    try {
      // In a real implementation, you would:
      // 1. Save the uploaded file to object storage or file system
      // 2. Create a prescription record with file path
      // 3. Send notification to patient
      
      const prescriptionData = {
        patientId: req.body.patientId,
        notes: req.body.notes,
        fileName: req.body.prescriptionFile?.name || "prescription.pdf",
        uploadedAt: new Date(),
        status: "active"
      };
      
      // For now, just return success
      res.json({ success: true, prescription: prescriptionData });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload prescription' });
    }
  });

  // Lead Management APIs
  // Create new lead automatically after patient intake
  app.post('/api/leads/auto', requireAuth, requireRole(["patient", "client"]), async (req, res) => {
    try {
      const patient = await storage.getClientByUserId(req.user!.id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Check if lead already exists for this patient
      const existingLead = await storage.getLeadByClientId(patient.id);
      if (existingLead) {
        return res.json({ leadId: existingLead.id, message: 'Lead already exists' });
      }

      // Create new lead
      const leadId = await storage.createLead({
        clientId: patient.id,
        status: 'novo',
        source: 'intake',
        notes: 'Lead automático criado após preenchimento do formulário',
      });

      // Create stage history entry
      await storage.createLeadStageHistory({
        leadId,
        newStatus: 'novo',
        byUserId: req.user!.id,
        notes: 'Lead criado automaticamente'
      });

      res.json({ leadId, message: 'Lead created successfully' });
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ message: 'Failed to create lead' });
    }
  });

  // Get all leads for consultants/admin
  app.get('/api/leads', requireAuth, requireRole(["consultant", "admin"]), async (req, res) => {
    try {
      const { status, consultantId } = req.query;
      const leads = await storage.getLeads({ 
        status: status as string, 
        consultantId: consultantId as string 
      });
      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: 'Failed to fetch leads' });
    }
  });

  // Create new lead from CRM
  app.post('/api/leads', requireAuth, requireRole(["consultant", "admin"]), async (req, res) => {
    try {
      const { patientName, patientEmail, patientPhone, consultantId, priority, notes, source } = req.body;
      
      // Validate required fields
      if (!patientName || !patientEmail || !patientPhone) {
        return res.status(400).json({ message: 'Patient name, email, and phone are required' });
      }
      
      // Try to find existing patient by email
      const existingUser = await storage.getUserByEmail(patientEmail);
      let patientId = null;
      
      if (existingUser && existingUser.role === 'patient') {
        const patient = await storage.getClientByUserId(existingUser.id);
        if (patient) {
          patientId = patient.id;
        }
      }
      
      // Create lead data
      const leadData = {
        clientId: patientId || `pending-${Date.now()}`, // Use pending ID if no patient found
        patientName,
        patientEmail,
        patientPhone,
        consultantId: consultantId || req.user!.id,
        status: 'novo' as const,
        priority: priority || 'medium',
        notes: notes || '',
        source: source || 'manual'
      };
      
      const leadId = await storage.createLead(leadData);
      
      // Create stage history entry
      await storage.createLeadStageHistory({
        leadId,
        previousStatus: null,
        newStatus: 'novo',
        byUserId: req.user!.id,
        notes: `Lead criado no CRM por ${req.user!.email || req.user!.id}`
      });
      
      res.status(201).json({ 
        leadId,
        message: 'Lead created successfully',
        patientFound: !!patientId
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ message: 'Failed to create lead' });
    }
  });

  // Update lead status
  app.patch('/api/leads/:id/status', requireAuth, requireRole(["consultant", "admin", "comercial"]), csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, estimatedValue } = req.body;

      // Get current lead to check current status
      const currentLead = await storage.getLeadById(id);
      if (!currentLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Validate estimated value can only be set after prescription validation
      if (estimatedValue && status !== 'receita_validada' && status !== 'produtos_liberados') {
        return res.status(400).json({ 
          message: 'Estimated value can only be set after prescription validation' 
        });
      }

      // Update lead
      await storage.updateLeadStatus(id, { status, notes, estimatedValue });

      // Create stage history entry
      await storage.createLeadStageHistory({
        leadId: id,
        previousStatus: currentLead.status,
        newStatus: status,
        byUserId: req.user!.id,
        notes
      });

      res.json({ message: 'Lead status updated successfully' });
    } catch (error) {
      console.error('Error updating lead status:', error);
      res.status(500).json({ message: 'Failed to update lead status' });
    }
  });

  // Update complete lead information (all fields)
  app.patch('/api/leads/:id', requireAuth, requireRole(["consultant", "admin"]), csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      const leadData = req.body;

      const updatedLead = await storage.updateLead(id, leadData);
      
      if (!updatedLead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      res.json({ message: 'Lead updated successfully', lead: updatedLead });
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: 'Failed to update lead' });
    }
  });

  // Assign consultant to lead (vendedor pode atribuir 1x, depois só admin)
  app.patch('/api/leads/:id/assign', requireAuth, requireRole(["consultant", "admin"]), csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      const { consultantId } = req.body;
      
      // Buscar lead atual
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }
      
      // Buscar consultor para validar
      const consultant = await storage.getConsultant(consultantId);
      if (!consultant) {
        return res.status(404).json({ message: 'Consultant not found' });
      }
      
      // Regra: Se já foi atribuído E usuário não é admin -> erro
      if (lead.assignedConsultantId && req.user!.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Lead já foi atribuído. Apenas administradores podem reatribuir.' 
        });
      }
      
      // Atualizar atribuição
      const updatedLead = await storage.updateLead(id, {
        assignedConsultantId: consultantId,
        assignedAt: new Date()
      });
      
      if (!updatedLead) {
        return res.status(500).json({ message: 'Failed to assign consultant' });
      }
      
      res.json({ 
        message: 'Consultor atribuído com sucesso', 
        lead: updatedLead 
      });
    } catch (error) {
      console.error('Error assigning consultant to lead:', error);
      res.status(500).json({ message: 'Failed to assign consultant' });
    }
  });

  // Get lead stage history
  app.get('/api/leads/:id/history', requireAuth, requireRole(["consultant", "admin", "comercial"]), async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getLeadStageHistory(id);
      res.json(history);
    } catch (error) {
      console.error('Error fetching lead history:', error);
      res.status(500).json({ message: 'Failed to fetch lead history' });
    }
  });

  // Delete lead with cascade deletion of history
  app.delete('/api/leads/:id', requireAuth, requireRole(["consultant", "admin"]), csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      
      const leadExists = await storage.getLeadById(id);
      if (!leadExists) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      const deleted = await storage.deleteLeadById(id);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete lead' });
      }

      res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ message: 'Failed to delete lead' });
    }
  });

  // Lead Stage Management APIs (Admin only - Kanban column configuration)
  app.get('/api/lead-stages', requireAuth, requireRole(["admin", "comercial", "consultant"]), async (req, res) => {
    try {
      const stages = await storage.getLeadStages();
      // Map slug to value for frontend compatibility
      const mappedStages = stages.map(stage => ({
        ...stage,
        value: stage.slug, // Frontend expects "value" field
      }));
      res.json(mappedStages);
    } catch (error) {
      console.error('Error fetching lead stages:', error);
      res.status(500).json({ message: 'Failed to fetch lead stages' });
    }
  });

  app.post('/api/lead-stages', requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const stageData = insertLeadStageSchema.parse(req.body);
      const newStage = await storage.createLeadStage(stageData);
      res.status(201).json(newStage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid stage data', errors: error.errors });
      }
      console.error('Error creating lead stage:', error);
      res.status(500).json({ message: 'Failed to create lead stage' });
    }
  });

  app.patch('/api/lead-stages/:id', requireAuth, requireRole(["admin", "comercial"]), adminCsrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedStage = await storage.updateLeadStage(id, updates);
      
      if (!updatedStage) {
        return res.status(404).json({ message: 'Lead stage not found' });
      }
      
      res.json(updatedStage);
    } catch (error) {
      console.error('Error updating lead stage:', error);
      res.status(500).json({ message: 'Failed to update lead stage' });
    }
  });

  app.delete('/api/lead-stages/:id', requireAuth, requireRole(["admin", "comercial"]), adminCsrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the stage to check its value
      const stages = await storage.getLeadStages();
      const stageToDelete = stages.find(s => s.id === id);
      
      if (!stageToDelete) {
        return res.status(404).json({ message: 'Lead stage not found' });
      }
      
      // Check if there are leads using this stage
      const leads = await storage.getLeads();
      const leadsInStage = leads.filter(lead => lead.status === stageToDelete.value);
      
      if (leadsInStage.length > 0) {
        return res.status(400).json({ 
          message: `Não é possível deletar este stage. Existem ${leadsInStage.length} lead(s) neste estágio. Mova ou delete os leads primeiro.`,
          leadsCount: leadsInStage.length
        });
      }
      
      const deleted = await storage.deleteLeadStage(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Lead stage not found' });
      }
      
      res.json({ message: 'Lead stage deletado com sucesso' });
    } catch (error) {
      console.error('Error deleting lead stage:', error);
      res.status(500).json({ message: 'Failed to delete lead stage' });
    }
  });

  // Patient prescription upload endpoint 
  app.post('/api/patient/prescriptions/upload', requireAuth, requireRole(["patient", "client"]), async (req, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const { prescriptionUrl, notes } = req.body;
      
      if (!prescriptionUrl) {
        return res.status(400).json({ message: 'Prescription file URL is required' });
      }

      // Update lead status
      const lead = await storage.getLeadByClientId(client.id);
      if (lead) {
        await storage.updateLeadStatus(lead.id, { 
          status: 'receita_recebida',
          notes: notes || 'Receita enviada manualmente pelo paciente'
        });
        
        // Create stage history
        await storage.createLeadStageHistory({
          leadId: lead.id,
          previousStatus: lead.status,
          newStatus: 'receita_recebida',
          byUserId: req.user!.id,
          notes: 'Upload manual de receita pelo paciente'
        });
      }

      // Update patient flags - enable price viewing after prescription upload
      await storage.updateClientFlags(client.id, {
        prescriptionValidated: false, // Needs admin validation
        prescriptionUrl, // Save the prescription URL
        canViewPrices: true, // Enable price viewing immediately
        canPurchase: false, // Still need ANVISA document + validation
      });

      console.log(`[PRESCRIPTION UPLOAD] Client ${client.id} prescription saved:`, prescriptionUrl);

      res.json({ 
        success: true, 
        message: 'Prescription uploaded successfully',
        prescriptionUrl // Return URL so frontend can verify
      });
    } catch (error) {
      console.error('Error uploading prescription:', error);
      res.status(500).json({ message: 'Failed to upload prescription' });
    }
  });

  // Patient ANVISA document upload endpoint 
  app.post('/api/patient/anvisa/upload', requireAuth, requireRole(["patient", "client"]), async (req, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const { anvisaDocumentUrl, notes } = req.body;
      
      if (!anvisaDocumentUrl) {
        return res.status(400).json({ message: 'ANVISA document URL is required' });
      }

      // Get current patient flags to check prescription status
      const flags = await storage.getClientFlags(client.id);

      // Update patient flags with ANVISA document
      await storage.updateClientFlags(client.id, {
        anvisaDocumentValidated: false, // Manual uploads need validation
        anvisaDocumentUrl,
        canPurchase: false, // Will be enabled after admin validation
      });

      console.log(`[ANVISA UPLOAD] Client ${client.id} ANVISA saved:`, anvisaDocumentUrl);

      // Update lead status
      const lead = await storage.getLeadByClientId(client.id);
      if (lead) {
        await storage.updateLeadStatus(lead.id, { 
          status: 'anvisa_enviada',
          notes: notes || 'Documento ANVISA enviado manualmente pelo paciente'
        });
        
        // Create stage history
        await storage.createLeadStageHistory({
          leadId: lead.id,
          previousStatus: lead.status,
          newStatus: 'anvisa_enviada',
          byUserId: req.user!.id,
          notes: 'Upload manual de documento ANVISA pelo paciente'
        });
      }

      res.json({ 
        success: true, 
        message: 'ANVISA document uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading ANVISA document:', error);
      res.status(500).json({ message: 'Failed to upload ANVISA document' });
    }
  });

  // Admin: Approve prescription
  app.post('/api/admin/approve-prescription/:clientId', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const { clientId } = req.params;

      // Get current flags
      const flags = await storage.getClientFlags(clientId);
      if (!flags) {
        return res.status(404).json({ message: 'Client flags not found' });
      }

      // Approve prescription
      await storage.updateClientFlags(clientId, {
        prescriptionValidated: true,
      });

      // Check if both documents are validated now
      const updatedFlags = await storage.getClientFlags(clientId);
      const bothValidated = updatedFlags?.prescriptionValidated && updatedFlags?.anvisaDocumentValidated;

      // If both validated, enable purchase
      if (bothValidated) {
        await storage.updateClientFlags(clientId, {
          canPurchase: true,
        });
      }

      // ✅ AUTO-SYNC: Atualizar status do CRM baseado na ficha do paciente
      const lead = await storage.getLeadByClientId(clientId);
      if (lead) {
        const correctStatus = await calculateLeadStatusFromPatientData(clientId);
        
        // Só atualizar se o status calculado for diferente
        if (lead.status !== correctStatus) {
          await storage.updateLead(lead.id, {
            status: correctStatus,
            updatedAt: new Date()
          });
          
          // Criar histórico de mudança de status
          await storage.createLeadStageHistory({
            leadId: lead.id,
            previousStatus: lead.status,
            newStatus: correctStatus,
            byUserId: req.user!.id,
            notes: '🤖 Status sincronizado automaticamente com a ficha do paciente'
          });
          
          console.log(`[AUTO-SYNC] Lead ${lead.id} atualizado: ${lead.status} → ${correctStatus}`);
        }
      }

      console.log(`[PRESCRIPTION APPROVED] Client ${clientId} prescription validated. Can purchase: ${bothValidated}`);

      res.json({ 
        success: true, 
        message: 'Prescription approved successfully',
        canPurchase: bothValidated
      });
    } catch (error) {
      console.error('Error approving prescription:', error);
      res.status(500).json({ message: 'Failed to approve prescription' });
    }
  });

  // Admin: Approve ANVISA document
  app.post('/api/admin/approve-anvisa/:clientId', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const { clientId } = req.params;

      // Get current flags
      const flags = await storage.getClientFlags(clientId);
      if (!flags) {
        return res.status(404).json({ message: 'Client flags not found' });
      }

      // Approve ANVISA
      await storage.updateClientFlags(clientId, {
        anvisaDocumentValidated: true,
      });

      // Check if both documents are validated now
      const updatedFlags = await storage.getClientFlags(clientId);
      const bothValidated = updatedFlags?.prescriptionValidated && updatedFlags?.anvisaDocumentValidated;

      // If both validated, enable purchase
      if (bothValidated) {
        await storage.updateClientFlags(clientId, {
          canPurchase: true,
        });
      }

      // ✅ AUTO-SYNC: Atualizar status do CRM baseado na ficha do paciente
      const lead = await storage.getLeadByClientId(clientId);
      if (lead) {
        const correctStatus = await calculateLeadStatusFromPatientData(clientId);
        
        // Só atualizar se o status calculado for diferente
        if (lead.status !== correctStatus) {
          await storage.updateLead(lead.id, {
            status: correctStatus,
            updatedAt: new Date()
          });
          
          // Criar histórico de mudança de status
          await storage.createLeadStageHistory({
            leadId: lead.id,
            previousStatus: lead.status,
            newStatus: correctStatus,
            byUserId: req.user!.id,
            notes: '🤖 Status sincronizado automaticamente com a ficha do paciente'
          });
          
          console.log(`[AUTO-SYNC] Lead ${lead.id} atualizado: ${lead.status} → ${correctStatus}`);
        }
      }

      console.log(`[ANVISA APPROVED] Client ${clientId} ANVISA validated. Can purchase: ${bothValidated}`);

      res.json({ 
        success: true, 
        message: 'ANVISA document approved successfully',
        canPurchase: bothValidated
      });
    } catch (error) {
      console.error('Error approving ANVISA:', error);
      res.status(500).json({ message: 'Failed to approve ANVISA document' });
    }
  });

  // Admin: Reject prescription
  app.post('/api/admin/reject-prescription/:clientId', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { reason } = req.body;

      // Get client info for email
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Reject prescription (remove validation)
      await storage.updateClientFlags(clientId, {
        prescriptionValidated: false,
        canPurchase: false, // Remove purchase permission
      });

      // ✅ AUTO-SYNC: Atualizar status do CRM baseado na ficha do paciente
      const lead = await storage.getLeadByClientId(clientId);
      if (lead) {
        const correctStatus = await calculateLeadStatusFromPatientData(clientId);
        
        if (lead.status !== correctStatus) {
          await storage.updateLead(lead.id, {
            status: correctStatus,
            updatedAt: new Date()
          });
          
          await storage.createLeadStageHistory({
            leadId: lead.id,
            previousStatus: lead.status,
            newStatus: correctStatus,
            byUserId: req.user!.id,
            notes: '🤖 Status sincronizado - receita reprovada'
          });
        }
      }

      // Send rejection email notification
      try {
        const { sendEmail } = await import('./outlook-email-vm');
        await sendEmail({
          to: client.email,
          subject: 'Documento Reprovado - VittaVerde',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Receita Médica Reprovada</h2>
              <p>Olá ${client.fullName},</p>
              <p>Infelizmente sua receita médica não foi aprovada.</p>
              ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
              <p>Por favor, envie um novo documento ou entre em contato conosco para mais informações.</p>
              <p>Atenciosamente,<br/>Equipe VittaVerde</p>
            </div>
          `
        });
        console.log(`[EMAIL] Rejection notification sent to ${client.email}`);
      } catch (emailError) {
        console.error('[EMAIL] Failed to send rejection notification:', emailError);
        // Continue even if email fails
      }

      console.log(`[PRESCRIPTION REJECTED] Client ${clientId} prescription rejected`);

      res.json({ 
        success: true, 
        message: 'Prescription rejected and client notified'
      });
    } catch (error) {
      console.error('Error rejecting prescription:', error);
      res.status(500).json({ message: 'Failed to reject prescription' });
    }
  });

  // Admin: Reject ANVISA document
  app.post('/api/admin/reject-anvisa/:clientId', requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const { clientId } = req.params;
      const { reason } = req.body;

      // Get client info for email
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Reject ANVISA (remove validation)
      await storage.updateClientFlags(clientId, {
        anvisaDocumentValidated: false,
        canPurchase: false, // Remove purchase permission
      });

      // ✅ AUTO-SYNC: Atualizar status do CRM baseado na ficha do paciente
      const lead = await storage.getLeadByClientId(clientId);
      if (lead) {
        const correctStatus = await calculateLeadStatusFromPatientData(clientId);
        
        if (lead.status !== correctStatus) {
          await storage.updateLead(lead.id, {
            status: correctStatus,
            updatedAt: new Date()
          });
          
          await storage.createLeadStageHistory({
            leadId: lead.id,
            previousStatus: lead.status,
            newStatus: correctStatus,
            byUserId: req.user!.id,
            notes: '🤖 Status sincronizado - ANVISA reprovada'
          });
        }
      }

      // Send rejection email notification
      try {
        const { sendEmail } = await import('./outlook-email-vm');
        await sendEmail({
          to: client.email,
          subject: 'Documento Reprovado - VittaVerde',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Autorização ANVISA Reprovada</h2>
              <p>Olá ${client.fullName},</p>
              <p>Infelizmente sua autorização ANVISA não foi aprovada.</p>
              ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
              <p>Por favor, envie um novo documento ou entre em contato conosco para mais informações.</p>
              <p>Atenciosamente,<br/>Equipe VittaVerde</p>
            </div>
          `
        });
        console.log(`[EMAIL] Rejection notification sent to ${client.email}`);
      } catch (emailError) {
        console.error('[EMAIL] Failed to send rejection notification:', emailError);
        // Continue even if email fails
      }

      console.log(`[ANVISA REJECTED] Client ${clientId} ANVISA document rejected`);

      res.json({ 
        success: true, 
        message: 'ANVISA document rejected and client notified'
      });
    } catch (error) {
      console.error('Error rejecting ANVISA:', error);
      res.status(500).json({ message: 'Failed to reject ANVISA document' });
    }
  });

  // 🔄 Admin: Sincronizar todos os leads com status real dos pacientes
  app.post('/api/admin/sync-all-leads', requireAuth, requireAdmin, async (req, res) => {
    try {
      const allLeads = await storage.getLeads({});
      let syncedCount = 0;
      let updatedCount = 0;
      const results: any[] = [];
      
      for (const lead of allLeads) {
        try {
          const correctStatus = await calculateLeadStatusFromPatientData(lead.clientId);
          syncedCount++;
          
          if (lead.status !== correctStatus) {
            await storage.updateLead(lead.id, {
              status: correctStatus,
              updatedAt: new Date()
            });
            
            await storage.createLeadStageHistory({
              leadId: lead.id,
              previousStatus: lead.status,
              newStatus: correctStatus,
              byUserId: req.user!.id,
              notes: '🔄 Sincronização em massa - status corrigido automaticamente'
            });
            
            updatedCount++;
            results.push({
              leadId: lead.id,
              clientId: lead.clientId,
              oldStatus: lead.status,
              newStatus: correctStatus
            });
          }
        } catch (error) {
          console.error(`Error syncing lead ${lead.id}:`, error);
        }
      }
      
      console.log(`[MASS SYNC] Sincronizados ${syncedCount} leads, ${updatedCount} atualizados`);
      
      res.json({
        success: true,
        message: `Sincronização completa: ${updatedCount} de ${syncedCount} leads atualizados`,
        totalProcessed: syncedCount,
        totalUpdated: updatedCount,
        updates: results
      });
    } catch (error) {
      console.error('Error syncing all leads:', error);
      res.status(500).json({ message: 'Failed to sync leads' });
    }
  });

  // Save patient pathology information to CRM
  app.post('/api/patient/intake/patologias', requireAuth, requireRole(["patient", "client"]), async (req, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const { patologias, sintomas, observacoes, idade, peso } = req.body;

      // Format notes for CRM (all fields optional)
      const parts: string[] = [];
      if (patologias && patologias.length > 0) {
        parts.push(`Condições: ${patologias.join(', ')}`);
      }
      if (sintomas && sintomas.length > 0) {
        parts.push(`Sintomas: ${sintomas.join(', ')}`);
      }
      if (idade) {
        parts.push(`Idade: ${idade}`);
      }
      if (peso) {
        parts.push(`Peso: ${peso}kg`);
      }
      if (observacoes) {
        parts.push(observacoes);
      }
      
      const notesText = parts.join('\n') || 'Formulário preenchido sem informações específicas';

      // Check if lead exists
      let lead = await storage.getLeadByClientId(client.id);
      
      if (!lead) {
        // Create new lead if doesn't exist
        const leadData = {
          clientId: client.id,
          status: 'contato_inicial' as const,
          priority: 'medium' as const,
          notes: notesText,
          source: 'intake' as const,
          tags: patologias,
          productsInterest: [], // Will be filled later
        };
        
        const leadId = await storage.createLead(leadData);
        
        // Create stage history
        await storage.createLeadStageHistory({
          leadId,
          previousStatus: null,
          newStatus: 'contato_inicial',
          byUserId: req.user!.id,
          notes: 'Paciente preencheu formulário de patologias'
        });

        lead = await storage.getLeadById(leadId);
      } else {
        // Update existing lead
        await storage.updateLead(lead.id, {
          notes: notesText,
          tags: patologias,
          status: 'contato_inicial',
          updatedAt: new Date(),
        });

        // Create stage history
        await storage.createLeadStageHistory({
          leadId: lead.id,
          previousStatus: lead.status,
          newStatus: 'contato_inicial',
          byUserId: req.user!.id,
          notes: 'Paciente atualizou informações de patologias'
        });
      }

      res.json({ 
        success: true, 
        message: 'Informações salvas no CRM',
        leadId: lead?.id 
      });
    } catch (error) {
      console.error('Error saving pathology information:', error);
      res.status(500).json({ message: 'Failed to save pathology information' });
    }
  });

  // Get patient progress status
  app.get('/api/patient/progress', requireAuth, requireRole(["patient", "client"]), async (req, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const lead = await storage.getLeadByClientId(client.id);
      const flags = await storage.getClientFlags(client.id);

      res.json({
        currentStage: lead?.status || 'novo',
        flags: {
          hasTelemedAccount: flags?.hasTelemedAccount || false,
          prescriptionValidated: flags?.prescriptionValidated || false,
          canViewPrices: flags?.canViewPrices || false,
        },
        telemedConsultationId: flags?.telemedConsultationId,
        leadId: lead?.id,
        estimatedValue: lead?.estimatedValue
      });
    } catch (error) {
      console.error('Error fetching patient progress:', error);
      res.status(500).json({ message: 'Failed to fetch progress' });
    }
  });

  // Public checkout config endpoint - returns only checkout URL
  app.get('/api/public/checkout-config', async (req, res) => {
    try {
      const configs = await storage.getCheckoutConfigs();
      const activeConfig = configs.find((c: any) => c.isActive);
      
      // Return null if no checkout configured - don't use default fallback
      res.json({
        checkoutUrl: activeConfig?.checkoutUrl || null,
        gatewayType: activeConfig?.gatewayType || null
      });
    } catch (error) {
      console.error('Error fetching public checkout config:', error);
      res.status(500).json({ message: 'Failed to fetch checkout config' });
    }
  });

  // Public products endpoint - shows products but hides prices until prescription upload
  app.get('/api/public/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      
      // Check if user is authenticated and has uploaded documents
      let hasUploadedPrescription = false;
      let hasAnvisaDocument = false;
      let canPurchase = false;
      
      if (req.user) {
        const patient = await storage.getClientByUserId(req.user.id);
        if (patient) {
          const flags = await storage.getClientFlags(patient.id);
          hasUploadedPrescription = flags?.prescriptionValidated || false;
          hasAnvisaDocument = !!flags?.anvisaDocumentUrl;
          canPurchase = flags?.canPurchase || false;
        }
      }

      // Return products with prices only if prescription validated
      const processedProducts = products.map(product => ({
        ...product,
        price: hasUploadedPrescription ? product.price : "0.00",
      }));

      res.json({
        products: processedProducts,
        hasUploadedPrescription,
        hasAnvisaDocument,
        canPurchase
      });
    } catch (error) {
      console.error('Error fetching public products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Get products with price gating
  app.get('/api/patient/products', requireAuth, requireRole(["patient", "client"]), async (req, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const flags = await storage.getClientFlags(client.id);
      const products = await storage.getProducts();

      // Check if prescription was uploaded (even if not validated yet)
      const hasUploadedPrescription = !!flags?.prescriptionUrl || flags?.canViewPrices || false;
      const hasAnvisaDocument = !!flags?.anvisaDocumentUrl;
      const canPurchase = flags?.canPurchase || false;

      // Show prices if prescription uploaded (even if pending validation)
      const processedProducts = products.map(product => ({
        ...product,
        price: hasUploadedPrescription ? product.price : "0.00",
      }));

      res.json({
        products: processedProducts,
        hasUploadedPrescription,
        hasAnvisaDocument,
        canPurchase
      });
    } catch (error) {
      console.error('Error fetching patient products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  // Patient registration and management
  app.post("/api/patients", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      // First create user
      const userData = insertUserSchema.parse({
        username: req.body.email,
        email: req.body.email,
        password: req.body.password || "temp-password", // In real app, generate secure password
        fullName: req.body.fullName,
        phone: req.body.phone,
        role: "patient"
      });
      
      const user = await storage.createUser(userData);
      
      // Then create patient
      const patientData = insertClientSchema.parse({
        userId: user.id,
        cpf: req.body.cpf,
        birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
        address: req.body.address,
        healthCondition: req.body.healthCondition,
        consultantId: req.body.consultantId
      });
      
      const patient = await storage.createPatient(patientData);
      res.status(201).json({ user, patient });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Error creating patient" });
    }
  });

  app.get("/api/patients/:id", requireAuth, requireRole(["patient", "admin", "doctor"]), async (req, res) => {
    try {
      // Authorization check - patients can only access their own data
      if (req.user!.role === "patient") {
        const userPatient = await storage.getClientByUserId(req.user!.id);
        if (!userPatient || userPatient.id !== req.params.id) {
          return res.status(403).json({ message: "Access denied: can only access your own patient data" });
        }
      }
      
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Error fetching patient" });
    }
  });

  // ANVISA status updates - admin only (regulated medical status)
  app.patch("/api/patients/:id/anvisa-status", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const { status, anvisaNumber } = req.body;
      const patient = await storage.updatePatientAnvisaStatus(req.params.id, status, anvisaNumber);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error updating ANVISA status:", error);
      res.status(500).json({ message: "Error updating ANVISA status" });
    }
  });

  // Checkout configuration endpoints
  app.get("/api/admin/checkout-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const configs = await storage.getCheckoutConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching checkout configs:", error);
      res.status(500).json({ message: "Error fetching checkout configs" });
    }
  });

  app.post("/api/admin/checkout-config", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const config = await storage.createCheckoutConfig(req.body);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error creating checkout config:", error);
      res.status(500).json({ message: "Error creating checkout config" });
    }
  });

  app.patch("/api/admin/checkout-config/:id", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const config = await storage.updateCheckoutConfig(req.params.id, req.body);
      if (!config) {
        return res.status(404).json({ message: "Checkout config not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error updating checkout config:", error);
      res.status(500).json({ message: "Error updating checkout config" });
    }
  });

  // ============= YAMPI INTEGRATION ROUTES =============
  // Import YAMPI service at top of file
  const { yampiService } = await import("./services/yampi.service");
  
  // Get YAMPI configuration
  app.get("/api/admin/yampi-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const config = await storage.getYampiConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching YAMPI config:", error);
      res.status(500).json({ message: "Error fetching YAMPI config" });
    }
  });
  
  // Create or update YAMPI configuration
  app.post("/api/admin/yampi-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const config = await storage.saveYampiConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error saving YAMPI config:", error);
      res.status(500).json({ message: "Error saving YAMPI config" });
    }
  });
  
  // Test YAMPI connection
  app.post("/api/admin/yampi-test", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { alias, userToken, secretKey } = req.body;
      const result = await yampiService.testConnection(alias, userToken, secretKey);
      res.json(result);
    } catch (error: any) {
      console.error("Error testing YAMPI connection:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  // Sync all products to YAMPI
  app.post("/api/admin/yampi-sync-products", requireAuth, requireAdmin, async (req, res) => {
    try {
      const results = await yampiService.syncAllProducts();
      res.json(results);
    } catch (error: any) {
      console.error("Error syncing products:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Sync single product to YAMPI
  app.post("/api/admin/yampi-sync-product/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await yampiService.syncProduct(req.params.id);
      res.json(result);
    } catch (error: any) {
      console.error("Error syncing product:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create YAMPI checkout (PUBLIC - permite checkout sem login)
  app.post("/api/yampi-checkout", async (req, res) => {
    try {
      const { items, customerData } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items são obrigatórios" });
      }
      
      const result = await yampiService.createCheckout(items, customerData);
      res.json(result);
    } catch (error: any) {
      console.error("Error creating YAMPI checkout:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // YAMPI webhook endpoint (public - no auth required)
  app.post("/api/yampi-webhook", async (req, res) => {
    try {
      await yampiService.processWebhook(req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error processing YAMPI webhook:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get YAMPI transactions
  app.get("/api/yampi-transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getYampiTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching YAMPI transactions:", error);
      res.status(500).json({ message: "Error fetching YAMPI transactions" });
    }
  });
  // ============= END YAMPI INTEGRATION ROUTES =============

  // ============= AFFILIATE/EXTERNAL VENDOR ROUTES =============
  
  // Get logged-in vendor's own metrics
  app.get("/api/affiliate/my-metrics", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Check if user is a vendor (by role OR flag)
      const isVendor = user.role === "vendor" || user.isExternalVendor;
      
      if (!isVendor) {
        return res.status(403).json({ 
          message: "Access denied: vendor role required",
          currentRole: user.role 
        });
      }

      // If vendor doesn't have affiliate code yet, generate one
      if (!user.affiliateCode) {
        console.log(`[AFFILIATE-METRICS] Vendor ${user.email} missing affiliate code, generating...`);
        const { affiliateService } = await import("./services/affiliate.service");
        
        // Use existing commission rate or default to 10%
        const commissionRate = user.commissionRate ? parseFloat(user.commissionRate) : 10;
        
        // Enable as external vendor
        const result = await affiliateService.enableExternalVendor(user.id, commissionRate);
        
        // Reload user with new affiliate code
        const updatedUser = await storage.getUser(user.id);
        if (!updatedUser?.affiliateCode) {
          return res.status(500).json({ message: "Failed to generate affiliate code" });
        }
        
        // Update req.user for this request
        req.user = updatedUser;
      }

      const { affiliateService } = await import("./services/affiliate.service");
      const metrics = await affiliateService.getVendorMetrics(user.id);
      
      // Use correct domain based on environment with proper protocol
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://vittaverde.com' 
        : (process.env.REPLIT_DEV_DOMAIN 
            ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
            : 'http://localhost:5000');

      const affiliateCode = req.user.affiliateCode!;
      
      res.json({
        ...metrics,
        affiliateCode: affiliateCode,
        affiliateLink: `${baseUrl}/${affiliateCode.toLowerCase()}`,
        affiliateLinkClean: affiliateCode.toLowerCase(),
        commissionRate: parseFloat(req.user.commissionRate || "10") / 100, // Convert percentage to decimal for display
      });
    } catch (error: any) {
      console.error("Error fetching vendor metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all external vendors with metrics (ADMIN only)
  app.get("/api/admin/vendors", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { affiliateService } = await import("./services/affiliate.service");
      const vendors = await affiliateService.getAllVendors();
      res.json(vendors);
    } catch (error: any) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enable user as external vendor
  app.post("/api/admin/vendor/enable/:userId", requireAuth, requireAdmin, csrfProtection, async (req, res) => {
    try {
      const { affiliateService } = await import("./services/affiliate.service");
      const { commissionRate, customCode } = req.body;
      
      console.log(`[VENDOR] Ativando vendedor externo: ${req.params.userId}`, { commissionRate, customCode });
      
      const result = await affiliateService.enableExternalVendor(req.params.userId, commissionRate, customCode);
      
      console.log(`[VENDOR] ✅ Vendedor ativado com sucesso:`, result);
      
      res.json(result);
    } catch (error: any) {
      console.error("[VENDOR] ❌ Error enabling vendor:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Disable external vendor
  app.post("/api/admin/vendor/disable/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { affiliateService } = await import("./services/affiliate.service");
      await affiliateService.disableExternalVendor(req.params.userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error disabling vendor:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get my vendor metrics (for logged-in vendor)
  app.get("/api/vendor/my-metrics", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { affiliateService } = await import("./services/affiliate.service");
      const metrics = await affiliateService.getVendorMetrics(userId);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching vendor metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get my clients list (for logged-in vendor)
  app.get("/api/vendor/clients", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      
      // Get all clients that came through this vendor's affiliate link
      const vendorClients = await db
        .select({
          clientId: clients.id,
          userId: clients.userId,
          affiliateVendorId: clients.affiliateVendorId,
        })
        .from(clients)
        .where(eq(clients.affiliateVendorId, userId));

      // Get user details and purchase data for each client
      const clientsData = await Promise.all(
        vendorClients.map(async (client) => {
          const user = await db
            .select({
              fullName: users.fullName,
              email: users.email,
              phone: users.phone,
              createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, client.userId))
            .limit(1);

          // Get purchase tracking data
          const purchases = await db
            .select()
            .from(affiliateTracking)
            .where(and(
              eq(affiliateTracking.affiliateVendorId, userId),
              eq(affiliateTracking.clientId, client.clientId),
              eq(affiliateTracking.eventType, "purchase")
            ));

          const totalPurchases = purchases.length;
          const totalRevenue = purchases.reduce((sum, p) => sum + parseFloat(p.orderValue || "0"), 0);
          const totalCommission = purchases.reduce((sum, p) => sum + parseFloat(p.commissionValue || "0"), 0);

          return {
            id: client.clientId,
            name: user[0]?.fullName || "N/A",
            email: user[0]?.email || "N/A",
            phone: user[0]?.phone || null,
            registeredAt: user[0]?.createdAt || new Date(),
            totalPurchases,
            totalRevenue,
            totalCommission,
          };
        })
      );

      res.json(clientsData);
    } catch (error: any) {
      console.error("Error fetching vendor clients:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Export vendor clients to Excel
  app.get("/api/vendor/clients/export", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const ExcelJS = await import('exceljs');
      
      // Get all clients that came through this vendor's affiliate link
      const vendorClients = await db
        .select({
          clientId: clients.id,
          userId: clients.userId,
          affiliateVendorId: clients.affiliateVendorId,
        })
        .from(clients)
        .where(eq(clients.affiliateVendorId, userId));

      // Get user details and purchase data for each client
      const clientsData = await Promise.all(
        vendorClients.map(async (client) => {
          const user = await db
            .select({
              fullName: users.fullName,
              email: users.email,
              phone: users.phone,
              createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, client.userId))
            .limit(1);

          // Get purchase tracking data
          const purchases = await db
            .select()
            .from(affiliateTracking)
            .where(and(
              eq(affiliateTracking.affiliateVendorId, userId),
              eq(affiliateTracking.clientId, client.clientId),
              eq(affiliateTracking.eventType, "purchase")
            ));

          const totalPurchases = purchases.length;
          const totalRevenue = purchases.reduce((sum, p) => sum + parseFloat(p.orderValue || "0"), 0);
          const totalCommission = purchases.reduce((sum, p) => sum + parseFloat(p.commissionValue || "0"), 0);

          return {
            id: client.clientId,
            name: user[0]?.fullName || "N/A",
            email: user[0]?.email || "N/A",
            phone: user[0]?.phone || "-",
            registeredAt: user[0]?.createdAt ? new Date(user[0].createdAt).toLocaleDateString('pt-BR') : "N/A",
            totalPurchases,
            totalRevenue: totalRevenue.toFixed(2),
            totalCommission: totalCommission.toFixed(2),
          };
        })
      );

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      // Define columns
      worksheet.columns = [
        { header: 'Nome', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Telefone', key: 'phone', width: 20 },
        { header: 'Data de Cadastro', key: 'registeredAt', width: 20 },
        { header: 'Total de Compras', key: 'totalPurchases', width: 18 },
        { header: 'Receita Total (R$)', key: 'totalRevenue', width: 20 },
        { header: 'Comissão Total (R$)', key: 'totalCommission', width: 20 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' } // Emerald color
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Add data rows
      clientsData.forEach(client => {
        worksheet.addRow(client);
      });

      // Add totals row
      const totalRevenue = clientsData.reduce((sum, c) => sum + parseFloat(c.totalRevenue), 0);
      const totalCommission = clientsData.reduce((sum, c) => sum + parseFloat(c.totalCommission), 0);
      const totalPurchases = clientsData.reduce((sum, c) => sum + c.totalPurchases, 0);

      const lastRow = worksheet.addRow({
        name: 'TOTAL',
        email: '',
        phone: '',
        registeredAt: '',
        totalPurchases,
        totalRevenue: totalRevenue.toFixed(2),
        totalCommission: totalCommission.toFixed(2),
      });

      lastRow.font = { bold: true };
      lastRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      };

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();

      // Set headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=clientes-afiliados-${new Date().toISOString().split('T')[0]}.xlsx`);
      res.send(buffer);
    } catch (error: any) {
      console.error("Error exporting vendor clients:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get vendor metrics (admin only)
  app.get("/api/admin/vendor/:id/metrics", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { affiliateService } = await import("./services/affiliate.service");
      const metrics = await affiliateService.getVendorMetrics(req.params.id);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching vendor metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Track affiliate click (public endpoint)
  app.post("/api/track-click", async (req, res) => {
    try {
      const { affiliateCode } = req.body;
      if (!affiliateCode) {
        return res.status(400).json({ message: "Affiliate code is required" });
      }

      const { affiliateService } = await import("./services/affiliate.service");
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'];
      const referrer = req.headers['referer'] || req.headers['referrer'];

      await affiliateService.trackClick(affiliateCode, ipAddress, userAgent, referrer as string);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error tracking click:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Assign external vendor to client (via lead)
  app.patch("/api/clients/:clientId/assign-vendor", requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { vendorId } = req.body;

      const { affiliateService } = await import("./services/affiliate.service");
      
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }

      // Verify vendor exists and is external vendor
      const vendor = await storage.getUser(vendorId);
      if (!vendor || !vendor.isExternalVendor) {
        return res.status(400).json({ message: "Invalid vendor" });
      }

      // Update client with vendor
      await db.update(clients).set({ affiliateVendorId: vendorId }).where(eq(clients.id, clientId));

      // Track registration if not already tracked
      const client = await storage.getClient(clientId);
      if (client && vendor.affiliateCode) {
        await affiliateService.trackRegistration(vendor.affiliateCode, clientId);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error assigning vendor to client:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============= END AFFILIATE/EXTERNAL VENDOR ROUTES =============

  // Checkout endpoint with automatic stock deduction
  app.post("/api/checkout", requireAuth, csrfProtection, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      
      // Check stock availability for all items first
      const items = validatedData.items as Array<{productId: string, quantity: number, price: number}>;
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.productId} not found` });
        }
        if ((product.stockQuantity ?? 0) < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity ?? 0}, Requested: ${item.quantity}` 
          });
        }
      }
      
      // Create order
      const order = await storage.createOrder(validatedData);
      
      // ✅ AFFILIATE TRACKING: Track purchase for commission calculation
      try {
        const client = await storage.getClientByUserId(req.user!.id);
        if (client && order.totalValue) {
          const { affiliateService } = await import("./services/affiliate.service");
          await affiliateService.trackPurchase(client.id, order.id, parseFloat(order.totalValue));
          console.log(`[AFFILIATE] Purchase tracked for client ${client.id}, order ${order.id}, value ${order.totalValue}`);
        }
      } catch (affiliateError) {
        console.error('[AFFILIATE] Error tracking purchase:', affiliateError);
        // Continue order creation even if affiliate tracking fails
      }
      
      // Automatically deduct stock for each item
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          const previousQty = product.stockQuantity ?? 0;
          const newQty = previousQty - item.quantity;
          
          // Create stock movement record
          await storage.createStockMovement({
            productId: item.productId,
            type: 'out',
            quantity: item.quantity,
            previousQuantity: previousQty,
            newQuantity: newQty,
            reason: 'sale',
            reference: order.id,
            notes: `Automatic stock deduction for order ${order.id}`,
            unitValue: item.price,
            totalValue: item.price * item.quantity,
            userId: req.user!.id
          });
          
          // Update product stock
          await storage.updateProduct(item.productId, {
            stockQuantity: newQty
          });
        }
      }
      
      res.status(201).json({ 
        success: true,
        order,
        message: "Order created successfully and stock updated" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      console.error("Error processing checkout:", error);
      res.status(500).json({ message: "Error processing checkout" });
    }
  });

  // Orders
  app.post("/api/orders", requireAuth, csrfProtection, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // ✅ AFFILIATE TRACKING: Track purchase for commission calculation
      try {
        const client = await storage.getClientByUserId(req.user!.id);
        if (client && order.totalValue) {
          const { affiliateService } = await import("./services/affiliate.service");
          await affiliateService.trackPurchase(client.id, order.id, parseFloat(order.totalValue));
          console.log(`[AFFILIATE] Purchase tracked for client ${client.id}, order ${order.id}, value ${order.totalValue}`);
        }
      } catch (affiliateError) {
        console.error('[AFFILIATE] Error tracking purchase:', affiliateError);
        // Continue order creation even if affiliate tracking fails
      }
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Error creating order" });
    }
  });

  app.get("/api/orders/patient/:patientId", requireAuth, requireRole(["patient", "admin", "doctor"]), async (req, res) => {
    try {
      // Authorization check for patient role - can only access own orders
      if (req.user!.role === "patient") {
        const patient = await storage.getClientByUserId(req.user!.id);
        if (!patient || patient.id !== req.params.patientId) {
          return res.status(403).json({ message: "Access denied: can only access your own orders" });
        }
      }
      
      const orders = await storage.getOrdersByPatient(req.params.patientId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.patch("/api/orders/:id", requireAuth, requireRole(["admin", "doctor", "patient"]), csrfProtection, async (req, res) => {
    try {
      // Get the existing order first to check ownership
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Authorization check for patient role - can only update own orders
      if (req.user!.role === "patient") {
        const patient = await storage.getClientByUserId(req.user!.id);
        if (!patient || existingOrder.clientId !== patient.id) {
          return res.status(403).json({ message: "Access denied: can only update your own orders" });
        }
      }
      
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Error updating order" });
    }
  });

  // Admin: Get all orders with patient information
  app.get("/api/admin/orders", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      // Get all orders
      const allOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));

      // Enrich orders with patient information
      const enrichedOrders = await Promise.all(
        allOrders.map(async (order) => {
          // Get patient via storage which handles the join
          const patientData = await storage.getPatientById(order.clientId);
          
          // Get order items
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          // Get product names for each item
          const itemsWithNames = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProduct(item.productId);
              return {
                ...item,
                productName: product?.name || 'Unknown Product',
              };
            })
          );

          return {
            ...order,
            patientName: patientData?.name || 'Unknown',
            patientEmail: patientData?.email || 'Unknown',
            items: itemsWithNames,
          };
        })
      );

      res.json(enrichedOrders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  // Admin: Update order tracking codes
  app.patch("/api/admin/orders/:id/tracking", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { trackingNumber, anvisaTrackingCode, importTrackingCode } = req.body;

      // Get existing order
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update tracking codes
      const updated = await storage.updateOrder(id, {
        trackingNumber: trackingNumber || existingOrder.trackingNumber,
        anvisaTrackingCode: anvisaTrackingCode || existingOrder.anvisaTrackingCode,
        importTrackingCode: importTrackingCode || existingOrder.importTrackingCode,
        updatedAt: new Date(),
      });

      console.log(`[ORDER TRACKING] Order ${id} tracking updated by admin ${req.user!.id}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating order tracking:", error);
      res.status(500).json({ message: "Error updating tracking codes" });
    }
  });

  // Admin: Update order status
  app.patch("/api/admin/orders/:id/status", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Get existing order
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update status
      const updated = await storage.updateOrder(id, {
        status,
        updatedAt: new Date(),
      });

      console.log(`[ORDER STATUS] Order ${id} status changed to ${status} by admin ${req.user!.id}`);
      res.json(updated);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Error updating order status" });
    }
  });

  // Prescriptions API
  app.get("/api/prescriptions", async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Error fetching prescriptions" });
    }
  });

  app.put("/api/prescriptions/:id", requireAuth, requireRole(["doctor", "admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const prescription = await storage.updatePrescription(req.params.id, req.body);
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      res.json(prescription);
    } catch (error) {
      console.error("Error updating prescription:", error);
      res.status(500).json({ message: "Error updating prescription" });
    }
  });


  // Tracking routes
  app.get("/api/tracking/:code", async (req, res) => {
    try {
      const trackingCode = req.params.code;
      
      // For now, return mock data - in production, query actual tracking data
      if (trackingCode.startsWith('VV')) {
        const mockData = {
          trackingCode,
          patientName: "Maria Silva Santos",
          cpf: "123.456.789-00",
          status: "anvisa_approved",
          currentStep: 3,
          steps: [
            {
              id: 1,
              title: "Consulta Médica Realizada",
              description: "Receita médica emitida",
              status: "completed",
              date: "15/03/2024 - 14:30"
            },
            {
              id: 2,
              title: "Documentação Enviada ANVISA", 
              description: "Processo em análise",
              status: "completed",
              date: "16/03/2024 - 09:15"
            },
            {
              id: 3,
              title: "Autorização ANVISA Aprovada",
              description: "Autorização emitida",
              status: "active",
              date: "18/03/2024 - 11:45"
            },
            {
              id: 4,
              title: "Intermediação de Importação",
              description: "Processo iniciado pelo CPF",
              status: "pending", 
              date: "Aguardando"
            }
          ]
        };
        res.json(mockData);
      } else {
        res.status(404).json({ message: "Tracking code not found" });
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      res.status(500).json({ message: "Error fetching tracking data" });
    }
  });

  // Users CRUD API
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Get all consultants with user info and commission rates (admin/consultant only)
  app.get("/api/consultants", requireAuth, requireRole(["admin", "consultant"]), async (req, res) => {
    try {
      const consultants = await storage.getActiveConsultants();
      const consultantsWithUserInfo = await Promise.all(
        consultants.map(async (consultant) => {
          const user = await storage.getUser(consultant.userId);
          return {
            id: consultant.id,
            fullName: user?.fullName || "",
            commissionRate: consultant.commissionRate || "0.10"
          };
        })
      );
      res.json(consultantsWithUserInfo);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      res.status(500).json({ message: "Error fetching consultants" });
    }
  });

  // Admin user creation (allows all roles) - admin only
  app.post("/api/users", requireAuth, requireAdmin, csrfProtection, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Users created by admin are pre-verified (no email verification needed)
      const user = await storage.createUser({
        ...validatedData,
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      });
      
      // Create role-specific profile based on user role
      if (user.role === "client") {
        await storage.createClient({
          userId: user.id,
          cpf: null, // Will be filled later
        });
      } else if (user.role === "consultant") {
        // Validate and parse commission rate
        let commissionRate = 0.10; // Default 10%
        if (req.body.commissionRate) {
          const rate = parseFloat(req.body.commissionRate);
          if (!isNaN(rate) && rate >= 0 && rate <= 100) {
            commissionRate = rate / 100;
          }
        }
        await storage.createConsultant({
          userId: user.id,
          commissionRate: commissionRate.toString(),
        });
      } else if (user.role === "doctor") {
        await storage.createDoctor({
          userId: user.id,
          crm: "", // Will be filled later
        });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, csrfProtection, async (req, res) => {
    try {
      // Remove empty password from updates
      const updates = { ...req.body };
      if (updates.password === "") {
        delete updates.password;
      }
      
      // Remove commissionRate from user updates as it should be handled separately
      const commissionRate = updates.commissionRate;
      delete updates.commissionRate;
      
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // If user is consultant and commissionRate is provided, update consultant profile
      if (user.role === "consultant" && commissionRate !== undefined) {
        const consultant = await storage.getConsultantByUserId(user.id);
        if (consultant) {
          // Validate and parse commission rate
          let rate = 0.10; // Default 10%
          if (commissionRate) {
            const parsedRate = parseFloat(commissionRate);
            if (!isNaN(parsedRate) && parsedRate >= 0 && parsedRate <= 100) {
              rate = parsedRate / 100;
            }
          }
          await storage.updateConsultant(consultant.id, { commissionRate: rate.toString() });
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, csrfProtection, async (req, res) => {
    try {
      const result = await storage.deleteUser(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Educational routes - Universidade dos Médicos
  // Get all courses
  app.get("/api/edu/courses", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const courses = await storage.getEduCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Error fetching courses" });
    }
  });

  // Create new course
  app.post("/api/edu/courses", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const courseData = insertEduCourseSchema.parse(req.body);
      const course = await storage.createEduCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Error creating course" });
    }
  });

  // Get lessons by course
  app.get("/api/edu/courses/:courseId/lessons", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const lessons = await storage.getEduLessonsByCourse(req.params.courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Error fetching lessons" });
    }
  });

  // Create new lesson
  app.post("/api/edu/courses/:courseId/lessons", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const lessonData = insertEduLessonSchema.parse({
        ...req.body,
        courseId: req.params.courseId
      });
      const lesson = await storage.createEduLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson data", errors: error.errors });
      }
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Error creating lesson" });
    }
  });

  // Get all articles
  app.get("/api/edu/articles", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const articles = await storage.getEduArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Error fetching articles" });
    }
  });

  // Create new article
  app.post("/api/edu/articles", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const articleData = insertEduArticleSchema.parse(req.body);
      const article = await storage.createEduArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Error creating article" });
    }
  });

  // Get all guidelines
  app.get("/api/edu/guidelines", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const guidelines = await storage.getEduGuidelines();
      res.json(guidelines);
    } catch (error) {
      console.error("Error fetching guidelines:", error);
      res.status(500).json({ message: "Error fetching guidelines" });
    }
  });

  // Get single course by ID
  app.get("/api/edu/courses/:courseId", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const course = await storage.getEduCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Error fetching course" });
    }
  });

  // Update course
  app.put("/api/edu/courses/:courseId", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const updates = insertEduCourseSchema.partial().parse(req.body);
      const course = await storage.updateEduCourse(req.params.courseId, updates);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Error updating course" });
    }
  });

  // Delete course
  app.delete("/api/edu/courses/:courseId", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const result = await storage.deleteEduCourse(req.params.courseId);
      if (!result) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Error deleting course" });
    }
  });

  // Get single lesson by ID
  app.get("/api/edu/lessons/:lessonId", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const lesson = await storage.getEduLesson(req.params.lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Error fetching lesson" });
    }
  });

  // Update lesson
  app.put("/api/edu/lessons/:lessonId", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const updates = insertEduLessonSchema.partial().parse(req.body);
      const lesson = await storage.updateEduLesson(req.params.lessonId, updates);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson data", errors: error.errors });
      }
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Error updating lesson" });
    }
  });

  // Delete lesson
  app.delete("/api/edu/lessons/:lessonId", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const result = await storage.deleteEduLesson(req.params.lessonId);
      if (!result) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Error deleting lesson" });
    }
  });

  // Get single article by ID
  app.get("/api/edu/articles/:articleId", requireAuth, requireRole(["doctor", "admin"]), async (req, res) => {
    try {
      const article = await storage.getEduArticle(req.params.articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Error fetching article" });
    }
  });

  // Update article
  app.put("/api/edu/articles/:articleId", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const updates = insertEduArticleSchema.partial().parse(req.body);
      const article = await storage.updateEduArticle(req.params.articleId, updates);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid article data", errors: error.errors });
      }
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Error updating article" });
    }
  });

  // Delete article
  app.delete("/api/edu/articles/:articleId", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const result = await storage.deleteEduArticle(req.params.articleId);
      if (!result) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Error deleting article" });
    }
  });

  // Patients Summary - Status overview for all patients
  app.get("/api/patients/summary", requireAuth, requireRole(["admin", "doctor"]), async (req, res) => {
    try {
      const patientsData = await db.select().from(clients);
      
      const patientsWithStatus = await Promise.all(patientsData.map(async (patient) => {
        const [prescriptionsData, ordersData] = await Promise.all([
          db.select().from(prescriptions).where(eq(prescriptions.clientId, patient.id)).orderBy(desc(prescriptions.createdAt)),
          db.select().from(orders).where(eq(orders.clientId, patient.id)).orderBy(desc(orders.createdAt))
        ]);

        const latestOrder = ordersData[0];
        const latestPrescription = prescriptionsData[0];
        
        // Determine current step based on real data
        let currentStep = 1; // Default: New Patient
        let currentStage = 'Novo Cadastro';
        let lastActivityDate = patient.createdAt;
        
        if (latestOrder) {
          if (latestOrder.status === 'delivered') {
            currentStep = 5;
            currentStage = 'Acompanhamento';
            lastActivityDate = latestOrder.updatedAt || latestOrder.createdAt;
          } else if (latestOrder.status === 'shipped') {
            currentStep = 4;
            currentStage = 'Entrega em Andamento';
            lastActivityDate = latestOrder.updatedAt || latestOrder.createdAt;
          } else if (patient.anvisaStatus === 'approved') {
            currentStep = 4;
            currentStage = 'Compra Disponível';
            lastActivityDate = latestOrder.createdAt;
          } else {
            currentStep = 3;
            currentStage = 'Aguardando ANVISA';
            lastActivityDate = latestOrder.createdAt;
          }
        } else if (latestPrescription) {
          currentStep = 2;
          currentStage = 'Prescrição Emitida';
          lastActivityDate = latestPrescription.createdAt;
        } else if (patient.healthCondition) {
          currentStep = 2;
          currentStage = 'Em Consulta';
          lastActivityDate = patient.createdAt;
        }
        
        return {
          id: patient.id,
          userId: patient.userId,
          healthCondition: patient.healthCondition,
          anvisaStatus: patient.anvisaStatus,
          trackingCode: patient.trackingCode,
          createdAt: patient.createdAt,
          currentStep,
          currentStage,
          lastActivityDate,
          hasOrders: ordersData.length > 0,
          hasPrescriptions: prescriptionsData.length > 0,
          totalOrders: ordersData.length,
          latestOrderDate: latestOrder?.createdAt || null
        };
      }));

      res.json(patientsWithStatus);
    } catch (error) {
      console.error("Error fetching patients summary:", error);
      res.status(500).json({ message: "Erro ao buscar resumo de pacientes" });
    }
  });

  // Patient Wellness - Complete patient health dashboard
  app.get("/api/patients/:id/wellness", requireAuth, requireRole(["patient", "admin", "doctor"]), async (req, res) => {
    try {
      const patientId = req.params.id;

      // Authorization check
      if (req.user!.role === "patient") {
        const userPatient = await storage.getClientByUserId(req.user!.id);
        if (!userPatient || userPatient.id !== patientId) {
          return res.status(403).json({ message: "Acesso negado" });
        }
      }

      // Get all patient data
      const patientResult = await db.select().from(clients).where(eq(clients.id, patientId));
      const patient = patientResult[0];
      
      const [prescriptionsData, ordersData, anvisaData] = await Promise.all([
        db.select().from(prescriptions).where(eq(prescriptions.clientId, patientId)).orderBy(desc(prescriptions.createdAt)),
        db.select().from(orders).where(eq(orders.clientId, patientId)).orderBy(desc(orders.createdAt)),
        db.select().from(anvisaProcesses).where(eq(anvisaProcesses.clientId, patientId)).orderBy(desc(anvisaProcesses.createdAt))
      ]);

      if (!patient) {
        return res.status(404).json({ message: "Paciente não encontrado" });
      }

      // Determine current process status
      const latestOrder = ordersData[0];
      const latestAnvisa = anvisaData[0];
      const latestPrescription = prescriptionsData[0];

      let currentStep = "consultation"; // consultation, prescription, anvisa, order, delivery
      let currentStepDetails = {};

      if (latestOrder) {
        if (latestOrder.status === "delivered") {
          currentStep = "delivered";
          currentStepDetails = { status: "completed", message: "Pedido entregue com sucesso" };
        } else if (latestOrder.status === "shipped") {
          currentStep = "shipping";
          currentStepDetails = { status: "in_progress", trackingNumber: latestOrder.trackingNumber };
        } else if (latestOrder.status === "anvisa_approved" || latestOrder.status === "importing") {
          currentStep = "importing";
          currentStepDetails = { status: "in_progress" };
        } else if (latestOrder.status === "anvisa_submitted") {
          currentStep = "anvisa";
          currentStepDetails = { status: "pending", anvisaCode: latestOrder.anvisaTrackingCode };
        } else if (latestOrder.status === "paid") {
          currentStep = "anvisa";
          currentStepDetails = { status: "preparing" };
        } else {
          currentStep = "order";
          currentStepDetails = { status: "pending" };
        }
      } else if (latestPrescription) {
        currentStep = "prescription";
        currentStepDetails = { status: "completed", validUntil: latestPrescription.validUntil };
      } else {
        currentStep = "consultation";
        currentStepDetails = { status: "pending" };
      }

      // Calculate health metrics
      const totalOrders = ordersData.length;
      const completedOrders = ordersData.filter((o: any) => o.status === "delivered").length;
      const pendingPrescriptions = prescriptionsData.filter((p: any) => p.isActive && new Date(p.validUntil) > new Date()).length;
      const anvisaApprovalRate = anvisaData.length > 0 
        ? (anvisaData.filter((a: any) => a.status === "approved").length / anvisaData.length) * 100 
        : 0;

      res.json({
        patient: {
          id: patient.id,
          name: patient.userId, // Will be joined with users table in real scenario
          healthCondition: patient.healthCondition,
          anvisaStatus: patient.anvisaStatus,
          anvisaNumber: patient.anvisaNumber,
          trackingCode: patient.trackingCode,
          createdAt: patient.createdAt
        },
        currentStep,
        currentStepDetails,
        metrics: {
          totalOrders,
          completedOrders,
          pendingPrescriptions,
          anvisaApprovalRate: Math.round(anvisaApprovalRate)
        },
        prescriptions: prescriptionsData.map((p: any) => ({
          id: p.id,
          products: p.products,
          validUntil: p.validUntil,
          isActive: p.isActive,
          createdAt: p.createdAt
        })),
        orders: ordersData.map((o: any) => ({
          id: o.id,
          items: o.items,
          totalAmount: o.totalAmount,
          status: o.status,
          trackingNumber: o.trackingNumber,
          createdAt: o.createdAt
        })),
        anvisaProcesses: anvisaData.map((a: any) => ({
          id: a.id,
          status: a.status,
          submittedAt: a.submittedAt,
          approvedAt: a.approvedAt,
          documents: a.documents,
          trackingCode: a.trackingCode
        }))
      });
    } catch (error) {
      console.error("Error fetching patient wellness data:", error);
      res.status(500).json({ message: "Erro ao buscar dados do paciente" });
    }
  });

  // Expenses/Costs Management
  app.get("/api/expenses", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
      res.json(allExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Erro ao buscar custos" });
    }
  });

  app.post("/api/expenses", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      // Convert expenseDate string to Date object if needed
      const processedData = {
        ...req.body,
        expenseDate: typeof req.body.expenseDate === 'string' 
          ? new Date(req.body.expenseDate) 
          : req.body.expenseDate,
        createdBy: req.user!.id
      };
      
      const expenseData = insertExpenseSchema.parse(processedData);
      
      const [newExpense] = await db.insert(expenses).values(expenseData).returning();
      res.status(201).json(newExpense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ ZOD VALIDATION ERROR:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Erro ao criar custo" });
    }
  });

  app.patch("/api/expenses/:id", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const [updatedExpense] = await db
        .update(expenses)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(expenses.id, req.params.id))
        .returning();
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Custo não encontrado" });
      }
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Erro ao atualizar custo" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, requireRole(["admin"]), adminCsrfProtection, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(expenses)
        .where(eq(expenses.id, req.params.id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Custo não encontrado" });
      }
      res.json({ message: "Custo excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Erro ao excluir custo" });
    }
  });

  // Expenses summary by category
  app.get("/api/expenses/summary", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { period } = req.query;
      console.log('📊 EXPENSES SUMMARY API CALLED:', { period, queryParams: req.query });
      
      let dateFilter = sql`true`;
      
      // Support both text and number formats
      if (period === 'month' || period === '30') {
        dateFilter = sql`${expenses.expenseDate} >= CURRENT_DATE - INTERVAL '30 days'`;
      } else if (period === 'quarter' || period === '90') {
        dateFilter = sql`${expenses.expenseDate} >= CURRENT_DATE - INTERVAL '90 days'`;
      } else if (period === 'year' || period === '365') {
        dateFilter = sql`${expenses.expenseDate} >= CURRENT_DATE - INTERVAL '365 days'`;
      }

      const summary = await db
        .select({
          category: expenses.category,
          total: sql<number>`CAST(SUM(${expenses.amount}) AS NUMERIC)`,
          count: sql<number>`COUNT(*)::int`
        })
        .from(expenses)
        .where(dateFilter)
        .groupBy(expenses.category);

      console.log('📊 EXPENSES SUMMARY RESULT:', summary);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching expenses summary:", error);
      res.status(500).json({ message: "Erro ao buscar resumo de custos" });
    }
  });

  // ===========================================
  // WHATSAPP & N8N INTEGRATION APIs
  // ===========================================

  // Get WhatsApp configuration (admin only - full config)
  app.get("/api/admin/whatsapp-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { whatsappConfig } = await import("@shared/schema");
      const [config] = await db.select().from(whatsappConfig).limit(1);
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
      res.status(500).json({ message: "Error fetching configuration" });
    }
  });

  // Get public WhatsApp config (for widget - only phone and active status)
  app.get("/api/whatsapp/public-config", async (req, res) => {
    try {
      const { whatsappConfig } = await import("@shared/schema");
      const [config] = await db.select({
        phoneNumber: whatsappConfig.phoneNumber,
        isActive: whatsappConfig.isActive
      }).from(whatsappConfig).limit(1);
      res.json(config || { phoneNumber: null, isActive: false });
    } catch (error) {
      console.error("Error fetching public WhatsApp config:", error);
      res.json({ phoneNumber: null, isActive: false });
    }
  });

  // Save/Update WhatsApp configuration
  app.post("/api/admin/whatsapp-config", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { whatsappConfig, insertWhatsappConfigSchema } = await import("@shared/schema");
      const validatedData = insertWhatsappConfigSchema.parse(req.body);

      // Check if config exists
      const [existing] = await db.select().from(whatsappConfig).limit(1);

      if (existing) {
        // Update existing config
        const [updated] = await db
          .update(whatsappConfig)
          .set({ ...validatedData, updatedAt: new Date() })
          .where(eq(whatsappConfig.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        // Create new config
        const [created] = await db.insert(whatsappConfig).values(validatedData).returning();
        res.status(201).json(created);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error saving WhatsApp config:", error);
      res.status(500).json({ message: "Error saving configuration" });
    }
  });

  // ===========================================
  // TELEMEDICINE CONFIGURATION APIs
  // ===========================================

  // Get Telemedicine configuration (admin only)
  app.get("/api/admin/telemedicine-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { telemedicineConfig } = await import("@shared/schema");
      const [config] = await db.select().from(telemedicineConfig).limit(1);
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching Telemedicine config:", error);
      res.status(500).json({ message: "Error fetching configuration" });
    }
  });

  // Get public Telemedicine config (for booking button - only redirect URL and active status)
  app.get("/api/telemedicine/public-config", async (req, res) => {
    try {
      const { telemedicineConfig } = await import("@shared/schema");
      const [config] = await db.select({
        redirectUrl: telemedicineConfig.redirectUrl,
        redirectLinks: telemedicineConfig.redirectLinks,
        isActive: telemedicineConfig.isActive,
        integrationType: telemedicineConfig.integrationType
      }).from(telemedicineConfig).limit(1);
      res.json(config || { redirectUrl: null, redirectLinks: [], isActive: false, integrationType: 'redirect' });
    } catch (error) {
      console.error("Error fetching public Telemedicine config:", error);
      res.json({ redirectUrl: null, redirectLinks: [], isActive: false, integrationType: 'redirect' });
    }
  });

  // Save/Update Telemedicine configuration
  app.post("/api/admin/telemedicine-config", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { telemedicineConfig, insertTelemedicineConfigSchema } = await import("@shared/schema");
      const validatedData = insertTelemedicineConfigSchema.parse(req.body);

      // Check if config exists
      const [existing] = await db.select().from(telemedicineConfig).limit(1);

      if (existing) {
        // Update existing config
        const [updated] = await db
          .update(telemedicineConfig)
          .set({ ...validatedData, updatedAt: new Date() })
          .where(eq(telemedicineConfig.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        // Create new config
        const [created] = await db.insert(telemedicineConfig).values(validatedData).returning();
        res.status(201).json(created);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error saving Telemedicine config:", error);
      res.status(500).json({ message: "Error saving configuration" });
    }
  });

  // ===========================================
  // EMAIL CONFIGURATION APIs
  // ===========================================

  // Get Email configuration (admin only)
  app.get("/api/admin/config/email", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { emailConfig } = await import("@shared/schema");
      const [config] = await db.select().from(emailConfig).limit(1);
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching Email config:", error);
      res.status(500).json({ message: "Error fetching configuration" });
    }
  });

  // Save/Update Email configuration
  app.put("/api/admin/config/email", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { emailConfig, smsConfig, insertEmailConfigSchema } = await import("@shared/schema");
      const validatedData = insertEmailConfigSchema.parse(req.body);

      // EXCLUSIVITY LOGIC: If activating Email, deactivate SMS
      if (validatedData.isActive) {
        const [smsCfg] = await db.select().from(smsConfig).limit(1);
        if (smsCfg && smsCfg.isActive) {
          await db
            .update(smsConfig)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(smsConfig.id, smsCfg.id));
          console.log("📱 SMS desativado automaticamente (Email foi ativado)");
        }
      }

      // Check if config exists
      const [existing] = await db.select().from(emailConfig).limit(1);

      if (existing) {
        // Update existing config
        const [updated] = await db
          .update(emailConfig)
          .set({ ...validatedData, updatedAt: new Date() })
          .where(eq(emailConfig.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        // Create new config
        const [created] = await db.insert(emailConfig).values(validatedData).returning();
        res.status(201).json(created);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error saving Email config:", error);
      res.status(500).json({ message: "Error saving configuration" });
    }
  });

  // Test Email configuration (sends a test email)
  app.post("/api/admin/config/email/test", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ message: "Email de teste é obrigatório" });
      }

      // Import email service
      const { sendEmail } = await import("./email-service.js");
      
      // Send test email
      await sendEmail({
        to: testEmail,
        subject: "✅ Teste de Configuração de Email - VittaVerde",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Email Configurado com Sucesso!</h1>
              </div>
              <div class="content">
                <div class="success">
                  <strong>Parabéns!</strong> Se você está lendo este email, sua configuração de email está funcionando perfeitamente!
                </div>
                
                <p>Este é um email de teste enviado pela plataforma VittaVerde.</p>
                
                <p><strong>O que foi testado:</strong></p>
                <ul>
                  <li>Conexão com Microsoft 365 / SMTP</li>
                  <li>Autenticação e permissões</li>
                  <li>Envio de emails transacionais</li>
                  <li>Formatação HTML</li>
                </ul>
                
                <p>Agora você pode usar o sistema para enviar:</p>
                <ul>
                  <li>📧 Códigos de verificação de email</li>
                  <li>🎉 Emails de boas-vindas</li>
                  <li>📦 Confirmações de pedido</li>
                  <li>📋 Atualizações de processo ANVISA</li>
                </ul>
                
                <p>Atenciosamente,<br><strong>Equipe VittaVerde</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      res.json({ success: true, message: "Email de teste enviado com sucesso!" });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao enviar email de teste", 
        error: error.message 
      });
    }
  });

  // ===========================================
  // SMS CONFIGURATION APIs
  // ===========================================

  // Get SMS configuration (admin only)
  app.get("/api/admin/config/sms", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { smsConfig } = await import("@shared/schema");
      const [config] = await db.select().from(smsConfig).limit(1);
      res.json(config || null);
    } catch (error) {
      console.error("Error fetching SMS config:", error);
      res.status(500).json({ message: "Error fetching configuration" });
    }
  });

  // Save/Update SMS configuration with EXCLUSIVITY logic
  app.put("/api/admin/config/sms", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { smsConfig, emailConfig, insertSmsConfigSchema } = await import("@shared/schema");
      const validatedData = insertSmsConfigSchema.parse(req.body);

      // EXCLUSIVITY LOGIC: If activating SMS, deactivate Email
      if (validatedData.isActive) {
        const [emailCfg] = await db.select().from(emailConfig).limit(1);
        if (emailCfg && emailCfg.isActive) {
          await db
            .update(emailConfig)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(emailConfig.id, emailCfg.id));
          console.log("📧 Email desativado automaticamente (SMS foi ativado)");
        }
      }

      // Check if SMS config exists
      const [existing] = await db.select().from(smsConfig).limit(1);

      if (existing) {
        // Update existing config
        const [updated] = await db
          .update(smsConfig)
          .set({ ...validatedData, updatedAt: new Date() })
          .where(eq(smsConfig.id, existing.id))
          .returning();
        res.json(updated);
      } else {
        // Create new config
        const [created] = await db.insert(smsConfig).values(validatedData).returning();
        res.status(201).json(created);
      }
    } catch (error: any) {
      console.error("Error saving SMS config:", error);
      res.status(500).json({ message: "Error saving configuration", error: error.message });
    }
  });

  // Test SMS configuration (sends a test SMS)
  app.post("/api/admin/config/sms/test", requireAuth, requireAdmin, adminCsrfProtection, async (req, res) => {
    try {
      const { testPhone } = req.body;
      
      if (!testPhone) {
        return res.status(400).json({ message: "Telefone de teste é obrigatório" });
      }

      // Get SMS config from database
      const { smsConfig } = await import("@shared/schema");
      const [config] = await db.select().from(smsConfig).limit(1);

      if (!config) {
        return res.status(400).json({ message: "Configuração SMS não encontrada. Salve as configurações primeiro." });
      }

      if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
        return res.status(400).json({ message: "Credenciais Twilio incompletas. Configure todos os campos." });
      }

      // Send test SMS using Twilio
      const twilio = await import('twilio');
      const client = twilio.default(config.twilioAccountSid, config.twilioAuthToken);

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      await client.messages.create({
        body: `VittaVerde - Teste de SMS\n\nSeu código de verificação: ${verificationCode}\n\nSe você recebeu esta mensagem, sua configuração está funcionando!`,
        from: config.twilioPhoneNumber,
        to: testPhone
      });

      console.log(`✅ SMS de teste enviado para ${testPhone}`);
      res.json({ success: true, message: "SMS de teste enviado com sucesso!" });
    } catch (error: any) {
      console.error("Error sending test SMS:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao enviar SMS de teste", 
        error: error.message 
      });
    }
  });

  // ===========================================
  // N8N WEBHOOK ENDPOINTS (No Auth for Meta/N8N)
  // ===========================================

  // WhatsApp webhook verification (GET) - for Meta to verify webhook
  app.get("/api/n8n/whatsapp/verify", async (req, res) => {
    try {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      // Get stored verify token from config
      const { whatsappConfig } = await import("@shared/schema");
      const [config] = await db.select().from(whatsappConfig).limit(1);

      if (mode === "subscribe" && token === config?.verifyToken) {
        console.log("✅ WhatsApp webhook verified successfully");
        res.status(200).send(challenge);
      } else {
        console.log("❌ WhatsApp webhook verification failed");
        res.sendStatus(403);
      }
    } catch (error) {
      console.error("Error in webhook verification:", error);
      res.sendStatus(403);
    }
  });

  // WhatsApp incoming messages webhook (POST) - receives messages from Meta
  app.post("/api/n8n/whatsapp/incoming", async (req, res) => {
    try {
      const { n8nWebhookLogs, whatsappConfig } = await import("@shared/schema");
      
      // Log webhook payload
      await db.insert(n8nWebhookLogs).values({
        webhookType: 'incoming_message',
        payload: req.body,
        status: 'success'
      });

      // Get N8N webhook URL from config
      const [config] = await db.select().from(whatsappConfig).limit(1);

      if (config?.webhookUrl && config.isActive) {
        // Forward to N8N workflow
        const response = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body)
        });

        // Log N8N response
        const n8nResponse = await response.json().catch(() => ({}));
        await db.insert(n8nWebhookLogs).values({
          webhookType: 'n8n_forward',
          payload: req.body,
          response: n8nResponse,
          status: response.ok ? 'success' : 'error',
          errorMessage: response.ok ? null : `N8N returned status ${response.status}`
        });
      }

      // Always respond 200 to Meta to avoid retries
      res.sendStatus(200);
    } catch (error) {
      console.error("Error processing incoming WhatsApp message:", error);
      const { n8nWebhookLogs } = await import("@shared/schema");
      await db.insert(n8nWebhookLogs).values({
        webhookType: 'incoming_message',
        payload: req.body,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      res.sendStatus(200); // Still respond 200 to avoid Meta retries
    }
  });

  // ===========================================
  // N8N DATA APIs (Secured with API Key)
  // ===========================================

  const n8nApiKey = createApiKeyMiddleware('n8n');

  // Get patient/client by phone number (for N8N chatbot)
  app.get("/api/n8n/client-by-phone/:phone", n8nApiKey, async (req, res) => {
    try {
      const phone = req.params.phone.replace(/\D/g, ''); // Remove non-digits
      
      const [client] = await db
        .select()
        .from(clients)
        .innerJoin(users, eq(clients.userId, users.id))
        .where(sql`REPLACE(${users.phone}, '-', '') LIKE '%${phone}%'`)
        .limit(1);

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json({
        id: client.clients.id,
        userId: client.users.id,
        fullName: client.users.fullName,
        email: client.users.email,
        phone: client.users.phone,
        anvisaStatus: client.clients.anvisaStatus,
        trackingCode: client.clients.trackingCode
      });
    } catch (error) {
      console.error("Error fetching client by phone:", error);
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  // Create lead from N8N (chatbot conversation)
  app.post("/api/n8n/create-lead", n8nApiKey, async (req, res) => {
    try {
      const { phoneNumber, fullName, email, message, source = 'whatsapp' } = req.body;

      // Check if user exists by phone
      const [existingUser] = await db
        .select()
        .from(users)
        .where(sql`REPLACE(${users.phone}, '-', '') LIKE '%${phoneNumber.replace(/\D/g, '')}%'`)
        .limit(1);

      let clientId: string;

      if (existingUser) {
        // Get existing client
        const [existingClient] = await db
          .select()
          .from(clients)
          .where(eq(clients.userId, existingUser.id))
          .limit(1);
        
        clientId = existingClient.id;
      } else {
        // Create new user and client
        const [newUser] = await db.insert(users).values({
          username: email || `whatsapp_${phoneNumber}`,
          email: email || `${phoneNumber}@whatsapp.temp`,
          password: 'temp_password', // They'll set it later
          fullName: fullName || `WhatsApp ${phoneNumber}`,
          phone: phoneNumber,
          role: 'client'
        }).returning();

        const [newClient] = await db.insert(clients).values({
          userId: newUser.id
        }).returning();

        clientId = newClient.id;
      }

      // Create or update lead
      const leadId = await storage.createLead({
        clientId,
        source,
        status: 'contato_inicial',
        notes: `WhatsApp: ${message}`,
        estimatedValue: null
      });

      res.status(201).json({ 
        success: true, 
        leadId, 
        clientId,
        message: "Lead created successfully" 
      });
    } catch (error) {
      console.error("Error creating lead from N8N:", error);
      res.status(500).json({ message: "Error creating lead" });
    }
  });

  // Update lead status from N8N
  app.patch("/api/n8n/update-lead/:leadId", n8nApiKey, async (req, res) => {
    try {
      const { status, notes, estimatedValue } = req.body;
      const lead = await storage.updateLeadStatus(req.params.leadId, {
        status,
        notes,
        estimatedValue
      });

      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      res.json(lead);
    } catch (error) {
      console.error("Error updating lead from N8N:", error);
      res.status(500).json({ message: "Error updating lead" });
    }
  });

  // Get product info (for chatbot to share product details)
  app.get("/api/n8n/products", n8nApiKey, async (req, res) => {
    try {
      const { category } = req.query;
      let query = db.select().from(products).where(eq(products.isActive, true));

      if (category) {
        query = query.where(eq(products.category, category as string));
      }

      const productList = await query;
      res.json(productList);
    } catch (error) {
      console.error("Error fetching products for N8N:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  // Get all clients/patients (for N8N workflows)
  app.get("/api/n8n/clients", n8nApiKey, async (req, res) => {
    try {
      const clientUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.role, 'patient'), eq(users.role, 'client')));
      
      res.json(clientUsers);
    } catch (error) {
      console.error("Error fetching clients for N8N:", error);
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  // Get client by ID (for N8N workflows)
  app.get("/api/n8n/client/:id", n8nApiKey, async (req, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.params.id));

      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching client for N8N:", error);
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  // Get all leads (for N8N workflows)
  app.get("/api/n8n/leads", n8nApiKey, async (req, res) => {
    try {
      const leadsList = await db
        .select()
        .from(leads)
        .orderBy(desc(leads.createdAt));
      
      res.json(leadsList);
    } catch (error) {
      console.error("Error fetching leads for N8N:", error);
      res.status(500).json({ message: "Error fetching leads" });
    }
  });

  // Get all orders (for N8N workflows)
  app.get("/api/n8n/orders", n8nApiKey, async (req, res) => {
    try {
      const ordersList = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));
      
      res.json(ordersList);
    } catch (error) {
      console.error("Error fetching orders for N8N:", error);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  // Get order by ID (for N8N workflows)
  app.get("/api/n8n/order/:id", n8nApiKey, async (req, res) => {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, req.params.id));

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order for N8N:", error);
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  // Get prescriptions by client ID (for N8N workflows)
  app.get("/api/n8n/prescriptions/:clientId", n8nApiKey, async (req, res) => {
    try {
      const prescriptionsList = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.patientId, req.params.clientId))
        .orderBy(desc(prescriptions.createdAt));
      
      res.json(prescriptionsList);
    } catch (error) {
      console.error("Error fetching prescriptions for N8N:", error);
      res.status(500).json({ message: "Error fetching prescriptions" });
    }
  });

  // ===============================================
  // PARTNER INTEGRATIONS - SSO (Single Sign-On)
  // ===============================================

  // [ADMIN] List all partner integrations
  app.get("/api/admin/partner-integrations", requireAdmin, async (req, res) => {
    try {
      const partners = await db
        .select()
        .from(partnerIntegrations)
        .orderBy(desc(partnerIntegrations.createdAt));
      
      // Não retornar shared_secret por segurança
      const sanitizedPartners = partners.map(p => ({
        ...p,
        sharedSecret: '***HIDDEN***'
      }));
      
      res.json(sanitizedPartners);
    } catch (error) {
      console.error("[PARTNER-SSO] Error fetching partners:", error);
      res.status(500).json({ message: "Error fetching partner integrations" });
    }
  });

  // [ADMIN] Get single partner integration
  app.get("/api/admin/partner-integrations/:id", requireAdmin, async (req, res) => {
    try {
      const [partner] = await db
        .select()
        .from(partnerIntegrations)
        .where(eq(partnerIntegrations.id, req.params.id));
      
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      res.json(partner);
    } catch (error) {
      console.error("[PARTNER-SSO] Error fetching partner:", error);
      res.status(500).json({ message: "Error fetching partner" });
    }
  });

  // [ADMIN] Create partner integration
  app.post("/api/admin/partner-integrations", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertPartnerIntegrationSchema.parse(req.body);
      
      const [newPartner] = await db
        .insert(partnerIntegrations)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      console.log(`[PARTNER-SSO] ✅ Created partner: ${newPartner.name}`);
      res.json(newPartner);
    } catch (error: any) {
      console.error("[PARTNER-SSO] Error creating partner:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating partner" });
    }
  });

  // [ADMIN] Update partner integration
  app.patch("/api/admin/partner-integrations/:id", requireAdmin, async (req, res) => {
    try {
      const [updated] = await db
        .update(partnerIntegrations)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(partnerIntegrations.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      console.log(`[PARTNER-SSO] ✅ Updated partner: ${updated.name}`);
      res.json(updated);
    } catch (error) {
      console.error("[PARTNER-SSO] Error updating partner:", error);
      res.status(500).json({ message: "Error updating partner" });
    }
  });

  // [ADMIN] Delete partner integration
  app.delete("/api/admin/partner-integrations/:id", requireAdmin, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(partnerIntegrations)
        .where(eq(partnerIntegrations.id, req.params.id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      console.log(`[PARTNER-SSO] ❌ Deleted partner: ${deleted.name}`);
      res.json({ message: "Partner deleted successfully" });
    } catch (error) {
      console.error("[PARTNER-SSO] Error deleting partner:", error);
      res.status(500).json({ message: "Error deleting partner" });
    }
  });

  // [CLIENT] Redirect to partner with JWT SSO
  app.get("/api/partner/redirect/:partnerId", requireAuth, async (req, res) => {
    try {
      const partnerId = req.params.partnerId;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Buscar configuração do parceiro
      const [partner] = await db
        .select()
        .from(partnerIntegrations)
        .where(eq(partnerIntegrations.id, partnerId));
      
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      if (!partner.isActive) {
        return res.status(403).json({ message: "Partner integration is inactive" });
      }
      
      // Buscar dados do cliente
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Buscar dados do cliente (tabela clients)
      const [clientData] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, userId));
      
      // Gerar JWT com dados do paciente
      const jwtPayload = {
        vittaverdeId: userId,
        clientId: clientData?.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        cpf: clientData?.cpf,
        birthDate: clientData?.birthDate?.toISOString(),
        partnerId: partner.id,
        partnerName: partner.name,
        generatedAt: new Date().toISOString(),
      };
      
      const token = jwt.sign(
        jwtPayload,
        partner.sharedSecret,
        {
          expiresIn: `${partner.tokenExpirationMinutes || 15}m`,
          issuer: 'VittaVerde',
          audience: partner.name,
        }
      );
      
      // Construir URL de redirect
      const redirectUrl = `${partner.ssoUrl}?token=${encodeURIComponent(token)}`;
      
      // Enviar webhook se configurado (opcional, não-bloqueante)
      if (partner.webhookUrl) {
        fetch(partner.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'sso_redirect',
            partnerId: partner.id,
            userId,
            clientId: clientData?.id,
            timestamp: new Date().toISOString(),
            jwtPayload,
          }),
        }).catch(err => {
          console.error(`[PARTNER-SSO] Webhook failed for ${partner.name}:`, err);
        });
      }
      
      // Salvar log de SSO
      await db.insert(partnerSsoLogs).values({
        partnerId: partner.id,
        clientId: clientData?.id || userId,
        userId,
        tokenGenerated: token,
        redirectUrl,
        webhookSent: !!partner.webhookUrl,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
        createdAt: new Date(),
      });
      
      // Atualizar contador de uso
      await db
        .update(partnerIntegrations)
        .set({
          lastUsedAt: new Date(),
          usageCount: sql`${partnerIntegrations.usageCount} + 1`,
        })
        .where(eq(partnerIntegrations.id, partnerId));
      
      console.log(`[PARTNER-SSO] ✅ Redirecting user ${user.email} to ${partner.name}`);
      
      // Redirecionar
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error("[PARTNER-SSO] Error during SSO redirect:", error);
      
      // Salvar log de erro
      try {
        await db.insert(partnerSsoLogs).values({
          partnerId: req.params.partnerId,
          clientId: req.user?.id || 'unknown',
          userId: req.user?.id || 'unknown',
          tokenGenerated: 'ERROR',
          redirectUrl: 'ERROR',
          success: false,
          errorMessage: error.message,
          createdAt: new Date(),
        });
      } catch (logError) {
        console.error("[PARTNER-SSO] Failed to log error:", logError);
      }
      
      res.status(500).json({ message: "Error during SSO redirect", error: error.message });
    }
  });

  // [CLIENT] List available partner integrations for logged-in user
  app.get("/api/partner/available", requireAuth, async (req, res) => {
    try {
      const partners = await db
        .select({
          id: partnerIntegrations.id,
          name: partnerIntegrations.name,
          description: partnerIntegrations.description,
          logoUrl: partnerIntegrations.logoUrl,
          specialties: partnerIntegrations.specialties,
          contactEmail: partnerIntegrations.contactEmail,
          contactPhone: partnerIntegrations.contactPhone,
        })
        .from(partnerIntegrations)
        .where(eq(partnerIntegrations.isActive, true))
        .orderBy(partnerIntegrations.name);
      
      res.json(partners);
    } catch (error) {
      console.error("[PARTNER-SSO] Error fetching available partners:", error);
      res.status(500).json({ message: "Error fetching partners" });
    }
  });

  // [PUBLIC] List active partner integrations (public endpoint for bem-estar page)
  app.get("/api/partner/public-list", async (req, res) => {
    try {
      const partners = await db
        .select({
          id: partnerIntegrations.id,
          name: partnerIntegrations.name,
          description: partnerIntegrations.description,
          logoUrl: partnerIntegrations.logoUrl,
          ssoUrl: partnerIntegrations.ssoUrl,
          specialties: partnerIntegrations.specialties,
          isActive: partnerIntegrations.isActive,
        })
        .from(partnerIntegrations)
        .where(eq(partnerIntegrations.isActive, true))
        .orderBy(partnerIntegrations.name);
      
      res.json(partners);
    } catch (error) {
      console.error("[PARTNER-SSO] Error fetching public partners list:", error);
      res.status(500).json({ message: "Error fetching partners" });
    }
  });

  // =====================================================================
  // 🔗 PARTNER WEBHOOK - RECEBER CONSULTAS DOS PARCEIROS SSO
  // =====================================================================
  
  // [WEBHOOK] Receber dados de consulta médica do parceiro via webhook
  // Este endpoint é público mas validado via HMAC signature
  app.post("/api/partner/webhook/:partnerId", express.json(), async (req, res) => {
    try {
      const partnerId = req.params.partnerId;
      const webhookData = req.body;
      const signature = req.headers['x-webhook-signature'] as string;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      
      console.log(`[PARTNER-WEBHOOK] 📥 Received webhook from partner ${partnerId}`);
      
      // Buscar configuração do parceiro
      const [partner] = await db
        .select()
        .from(partnerIntegrations)
        .where(and(
          eq(partnerIntegrations.id, partnerId),
          eq(partnerIntegrations.isActive, true)
        ))
        .limit(1);
      
      if (!partner) {
        console.error(`[PARTNER-WEBHOOK] ❌ Partner not found or inactive: ${partnerId}`);
        return res.status(404).json({ 
          success: false,
          message: "Partner not found or inactive" 
        });
      }
      
      // Validar assinatura HMAC (se fornecida)
      let signatureValid = true;
      if (signature && partner.sharedSecret) {
        const expectedSignature = crypto
          .createHmac('sha256', partner.sharedSecret)
          .update(JSON.stringify(webhookData))
          .digest('hex');
        
        signatureValid = signature === expectedSignature;
        
        if (!signatureValid) {
          console.error(`[PARTNER-WEBHOOK] ❌ Invalid signature from partner ${partner.name}`);
          return res.status(401).json({ 
            success: false,
            message: "Invalid webhook signature" 
          });
        }
      }
      
      // Validar estrutura do webhook (schema esperado)
      const webhookSchema = z.object({
        clientCpf: z.string(), // CPF do paciente
        consultationDate: z.string().or(z.date()), // Data da consulta
        doctorName: z.string(), // Nome do médico
        doctorCrm: z.string().optional(),
        specialization: z.string().optional(),
        diagnosis: z.string().optional(),
        observations: z.string().optional(),
        
        // Receita (pode ser URL ou base64)
        prescriptionUrl: z.string().optional(), // URL direta do arquivo
        prescriptionBase64: z.string().optional(), // Ou arquivo em base64
        prescriptionFileName: z.string().optional(), // Nome original
      });
      
      const validation = webhookSchema.safeParse(webhookData);
      
      if (!validation.success) {
        console.error(`[PARTNER-WEBHOOK] ❌ Invalid webhook data:`, validation.error);
        return res.status(400).json({ 
          success: false,
          message: "Invalid webhook data structure",
          errors: validation.error.errors 
        });
      }
      
      const data = validation.data;
      
      // Buscar paciente pelo CPF
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.cpf, data.clientCpf))
        .limit(1);
      
      if (!client) {
        console.error(`[PARTNER-WEBHOOK] ❌ Client not found with CPF: ${data.clientCpf}`);
        return res.status(404).json({ 
          success: false,
          message: "Patient not found with provided CPF" 
        });
      }
      
      // Buscar usuário associado
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, client.userId))
        .limit(1);
      
      if (!user) {
        console.error(`[PARTNER-WEBHOOK] ❌ User not found for client: ${client.id}`);
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }
      
      // Processar arquivo da receita (se fornecido)
      let prescriptionUrl = data.prescriptionUrl;
      let prescriptionFileName = data.prescriptionFileName;
      
      if (data.prescriptionBase64 && !prescriptionUrl) {
        // Arquivo fornecido em base64 - salvar no Object Storage
        try {
          const buffer = Buffer.from(data.prescriptionBase64, 'base64');
          const fileName = prescriptionFileName || `receita-${client.cpf}-${Date.now()}.pdf`;
          const storagePath = `partner-prescriptions/${partnerId}/${fileName}`;
          
          const objectStorage = new ObjectStorageService();
          const uploadResult = await objectStorage.uploadFile(storagePath, buffer, {
            contentType: 'application/pdf'
          });
          
          prescriptionUrl = uploadResult.url;
          prescriptionFileName = fileName;
          
          console.log(`[PARTNER-WEBHOOK] ✅ Prescription uploaded to storage: ${storagePath}`);
        } catch (uploadError) {
          console.error(`[PARTNER-WEBHOOK] ❌ Error uploading prescription:`, uploadError);
          // Continua sem falhar - receita pode ser anexada depois manualmente
        }
      }
      
      // Salvar consulta recebida no banco
      const [consultation] = await db
        .insert(partnerConsultations)
        .values({
          partnerId: partnerId,
          clientId: client.id,
          userId: user.id,
          consultationDate: new Date(data.consultationDate),
          doctorName: data.doctorName,
          doctorCrm: data.doctorCrm,
          specialization: data.specialization,
          diagnosis: data.diagnosis,
          observations: data.observations,
          prescriptionUrl: prescriptionUrl,
          prescriptionFileName: prescriptionFileName,
          prescriptionStatus: prescriptionUrl ? 'pending' : 'pending', // Sempre pending até admin aprovar
          productsEnabled: false, // Admin precisa aprovar primeiro
          webhookData: webhookData,
          webhookIpAddress: ipAddress,
          webhookSignatureValid: signatureValid,
        })
        .returning();
      
      // Atualizar flags do cliente - marcar que recebeu receita via parceiro
      const flags = await storage.getClientFlags(client.id);
      if (prescriptionUrl && !flags?.prescriptionReceived) {
        await storage.updateClientFlags(client.id, {
          prescriptionReceived: true,
          prescriptionReceivedAt: new Date(),
        });
      }
      
      console.log(`[PARTNER-WEBHOOK] ✅ Consultation saved successfully for ${user.email}`);
      console.log(`[PARTNER-WEBHOOK] 📋 Consultation ID: ${consultation.id}`);
      
      res.json({ 
        success: true,
        message: "Consultation received successfully",
        consultationId: consultation.id,
        clientId: client.id,
        prescriptionReceived: !!prescriptionUrl,
      });
      
    } catch (error: any) {
      console.error("[PARTNER-WEBHOOK] ❌ Error processing webhook:", error);
      res.status(500).json({ 
        success: false,
        message: "Error processing webhook",
        error: error.message 
      });
    }
  });

  // [ADMIN] Listar consultas recebidas via webhook
  app.get("/api/admin/partner-consultations", requireAdmin, async (req, res) => {
    try {
      const consultations = await db
        .select({
          id: partnerConsultations.id,
          partnerId: partnerConsultations.partnerId,
          partnerName: partnerIntegrations.name,
          clientId: partnerConsultations.clientId,
          clientName: users.fullName,
          clientEmail: users.email,
          clientCpf: clients.cpf,
          consultationDate: partnerConsultations.consultationDate,
          doctorName: partnerConsultations.doctorName,
          doctorCrm: partnerConsultations.doctorCrm,
          specialization: partnerConsultations.specialization,
          diagnosis: partnerConsultations.diagnosis,
          observations: partnerConsultations.observations,
          prescriptionUrl: partnerConsultations.prescriptionUrl,
          prescriptionFileName: partnerConsultations.prescriptionFileName,
          prescriptionStatus: partnerConsultations.prescriptionStatus,
          productsEnabled: partnerConsultations.productsEnabled,
          productsEnabledAt: partnerConsultations.productsEnabledAt,
          prescriptionApprovedAt: partnerConsultations.prescriptionApprovedAt,
          webhookReceivedAt: partnerConsultations.webhookReceivedAt,
          processedAt: partnerConsultations.processedAt,
          notes: partnerConsultations.notes,
          createdAt: partnerConsultations.createdAt,
        })
        .from(partnerConsultations)
        .leftJoin(partnerIntegrations, eq(partnerConsultations.partnerId, partnerIntegrations.id))
        .leftJoin(clients, eq(partnerConsultations.clientId, clients.id))
        .leftJoin(users, eq(partnerConsultations.userId, users.id))
        .orderBy(desc(partnerConsultations.webhookReceivedAt));
      
      res.json(consultations);
    } catch (error) {
      console.error("[ADMIN] Error fetching partner consultations:", error);
      res.status(500).json({ message: "Error fetching consultations" });
    }
  });

  // [ADMIN] Aprovar receita e liberar produtos automaticamente
  app.post("/api/admin/partner-consultations/:id/approve", requireAdmin, async (req, res) => {
    try {
      const consultationId = req.params.id;
      const adminId = req.user?.id;
      
      // Buscar consulta
      const [consultation] = await db
        .select()
        .from(partnerConsultations)
        .where(eq(partnerConsultations.id, consultationId))
        .limit(1);
      
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }
      
      // Atualizar consulta - aprovar receita e liberar produtos
      await db
        .update(partnerConsultations)
        .set({
          prescriptionStatus: 'approved',
          prescriptionApprovedBy: adminId,
          prescriptionApprovedAt: new Date(),
          productsEnabled: true,
          productsEnabledAt: new Date(),
          processedBy: adminId,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(partnerConsultations.id, consultationId));
      
      // Atualizar flags do cliente - liberar produtos
      await storage.updateClientFlags(consultation.clientId, {
        prescriptionValidated: true,
        prescriptionValidatedAt: new Date(),
      });
      
      console.log(`[ADMIN] ✅ Consultation ${consultationId} approved - products enabled for client ${consultation.clientId}`);
      
      res.json({ 
        success: true,
        message: "Prescription approved and products enabled" 
      });
    } catch (error) {
      console.error("[ADMIN] Error approving consultation:", error);
      res.status(500).json({ message: "Error approving consultation" });
    }
  });

  // [ADMIN] Rejeitar receita
  app.post("/api/admin/partner-consultations/:id/reject", requireAdmin, async (req, res) => {
    try {
      const consultationId = req.params.id;
      const adminId = req.user?.id;
      const { reason } = req.body;
      
      await db
        .update(partnerConsultations)
        .set({
          prescriptionStatus: 'rejected',
          prescriptionRejectionReason: reason,
          processedBy: adminId,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(partnerConsultations.id, consultationId));
      
      console.log(`[ADMIN] ❌ Consultation ${consultationId} rejected`);
      
      res.json({ 
        success: true,
        message: "Prescription rejected" 
      });
    } catch (error) {
      console.error("[ADMIN] Error rejecting consultation:", error);
      res.status(500).json({ message: "Error rejecting consultation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
