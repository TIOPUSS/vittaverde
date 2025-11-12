import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import N8N schema
export * from "./schema-n8n";

// Tabela de sessões para connect-pg-simple
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("client"), // client, consultant, doctor, admin
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  isExternalVendor: boolean("is_external_vendor").default(false), // Vendedor externo (afiliado)
  affiliateCode: text("affiliate_code").unique(), // Código único do afiliado (ex: JOAO2024)
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.10"), // Taxa de comissão (padrão 10%)
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cpf: text("cpf").unique(),
  birthDate: timestamp("birth_date"),
  address: jsonb("address"),
  healthCondition: text("health_condition"),
  consultantId: varchar("consultant_id").references(() => consultants.id),
  affiliateVendorId: varchar("affiliate_vendor_id").references(() => users.id), // Vendedor externo que trouxe o cliente
  anvisaStatus: text("anvisa_status").default("pending"), // pending, submitted, approved, rejected
  anvisaNumber: text("anvisa_number"),
  trackingCode: text("tracking_code").unique(), // Código de rastreamento único para o cliente
  createdAt: timestamp("created_at").defaultNow(),
});

export const consultants = pgTable("consultants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  crm: text("crm"),
  specialization: text("specialization"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.10"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  crm: text("crm").notNull(),
  specialization: text("specialization"),
  isActive: boolean("is_active").default(true),
  workingHours: jsonb("working_hours"), // {monday: {start: "08:00", end: "18:00", enabled: true}, ...}
  consultationDuration: integer("consultation_duration").default(60), // minutos
  breakBetweenConsultations: integer("break_between_consultations").default(15), // minutos
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // oil, gummies, cream, cosmetic, topical, clothing
  activeSubstances: jsonb("active_substances").notNull(), // Array of {substance: "CBD", concentration: "10mg/ml"}
  concentration: text("concentration"),
  volume: text("volume"), // 30ml, 60ml, etc
  origin: text("origin").default("International"), // Brasil, Canadá, Estados Unidos, etc
  anvisaRequired: boolean("anvisa_required").default(true),
  prescriptionRequired: boolean("prescription_required").default(true),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  indications: jsonb("indications"), // Array of medical conditions
  contraindications: text("contraindications"),
  sideEffects: text("side_effects"),
  dosageInstructions: text("dosage_instructions"),
  
  // Stock control fields
  stockQuantity: integer("stock_quantity").default(0),
  minimumStock: integer("minimum_stock").default(5),
  maxStock: integer("max_stock"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  brand: text("brand"), // Marca do produto
  thc: text("thc"), // Concentração de THC (ex: 0,3%, 1,0%)
  sku: text("sku"), // Stock Keeping Unit
  batchNumber: text("batch_number"),
  expirationDate: timestamp("expiration_date"),
  location: text("location"), // Storage location
  isTracked: boolean("is_tracked").default(true), // Whether to track stock for this product
  
  // YAMPI Integration
  yampiSkuId: text("yampi_sku_id"), // ID do SKU sincronizado na YAMPI
  yampiProductId: text("yampi_product_id"), // ID do produto na YAMPI
  yampiSyncedAt: timestamp("yampi_synced_at"), // Última sincronização com YAMPI
  yampiPurchaseUrl: text("yampi_purchase_url"), // Link direto de compra na YAMPI (ex: https://vittaverde2.pay.yampi.com.br/r/SJBCTAK6VA)
  
  // Checkout configuration (DEPRECATED - usar YAMPI)
  checkoutUrl: text("checkout_url"), // Link específico de checkout para este produto
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock movements table to track all inventory changes
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  type: text("type").notNull(), // 'in' (entrada), 'out' (saída), 'adjustment' (ajuste)
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: text("reason").notNull(), // 'purchase', 'sale', 'loss', 'expired', 'returned', 'manual_adjustment'
  reference: text("reference"), // Order ID, prescription ID, etc.
  notes: text("notes"),
  batchNumber: text("batch_number"),
  expirationDate: timestamp("expiration_date"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  unitValue: decimal("unit_value", { precision: 10, scale: 2 }),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  userId: varchar("user_id").references(() => users.id), // Who made the movement
  movementDate: timestamp("movement_date").notNull().defaultNow(), // Data da movimentação
  createdAt: timestamp("created_at").defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id").notNull().references(() => doctors.id),
  products: jsonb("products").notNull(), // Array of {productId, dosage, frequency}
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  consultantId: varchar("consultant_id").references(() => consultants.id),
  affiliateVendorId: varchar("affiliate_vendor_id").references(() => users.id), // Vendedor externo que originou a venda
  prescriptionId: varchar("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  items: jsonb("items").notNull(), // Array of {productId, quantity, price}
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, paid, anvisa_submitted, anvisa_approved, importing, shipped, delivered, cancelled
  paymentMethod: text("payment_method"),
  trackingNumber: text("tracking_number"),
  anvisaTrackingCode: text("anvisa_tracking_code"), // Código específico para rastrear no processo ANVISA
  importTrackingCode: text("import_tracking_code"), // Código para rastreamento da importação
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de rastreamento de afiliados/vendedores externos
export const affiliateTracking = pgTable("affiliate_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateVendorId: varchar("affiliate_vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'click', 'registration', 'purchase'
  clientId: varchar("client_id").references(() => clients.id), // Cliente relacionado ao evento
  orderId: varchar("order_id").references(() => orders.id), // Pedido relacionado (para purchases)
  orderValue: decimal("order_value", { precision: 10, scale: 2 }), // Valor do pedido (para purchases)
  commissionValue: decimal("commission_value", { precision: 10, scale: 2 }), // Valor da comissão calculada
  ipAddress: text("ip_address"), // IP do visitante (para rastreamento)
  userAgent: text("user_agent"), // User agent do navegador
  referrer: text("referrer"), // URL de origem
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("green"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Checkout configuration table (DEPRECATED - usar yampiConfig)
export const checkoutConfig = pgTable("checkout_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gatewayType: text("gateway_type").notNull().default("stripe"), // stripe, assas, pagseguro, mercadopago, paypal, outros
  checkoutUrl: text("checkout_url"), // URL da página de checkout
  isActive: boolean("is_active").default(false),
  settings: jsonb("settings"), // Gateway-specific settings (API keys, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// YAMPI Configuration - Única integração de checkout
export const yampiConfig = pgTable("yampi_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alias: text("alias").notNull(), // Store alias (ex: "vittaverde")
  userToken: text("user_token").notNull(), // YAMPI User Token
  secretKey: text("secret_key").notNull(), // YAMPI Secret Key
  isActive: boolean("is_active").default(false),
  autoSyncProducts: boolean("auto_sync_products").default(false), // Auto sync products to YAMPI
  lastSync: timestamp("last_sync"), // Last successful sync timestamp
  webhookSecret: text("webhook_secret"), // Secret for webhook verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// YAMPI Transactions - Rastrear transações/pagamentos da YAMPI
export const yampiTransactions = pgTable("yampi_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  yampiTransactionId: text("yampi_transaction_id").notNull().unique(), // ID da transação na YAMPI
  yampiOrderId: text("yampi_order_id"), // ID do pedido na YAMPI
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }), // Link to our order
  customerId: varchar("customer_id").references(() => clients.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"), // pending, waiting_payment, paid, cancelled, refunded
  paymentMethod: text("payment_method"), // credit_card, pix, boleto
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // Products purchased
  customerData: jsonb("customer_data"), // Customer info from YAMPI
  paymentData: jsonb("payment_data"), // Payment details (boleto URL, pix code, etc)
  webhookData: jsonb("webhook_data"), // Raw webhook data for debugging
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  client: one(clients, { fields: [users.id], references: [clients.userId] }),
  consultant: one(consultants, { fields: [users.id], references: [consultants.userId] }),
  doctor: one(doctors, { fields: [users.id], references: [doctors.userId] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  consultant: one(consultants, { fields: [clients.consultantId], references: [consultants.id] }),
  prescriptions: many(prescriptions),
  orders: many(orders),
}));

export const consultantsRelations = relations(consultants, ({ one, many }) => ({
  user: one(users, { fields: [consultants.userId], references: [users.id] }),
  clients: many(clients),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  client: one(clients, { fields: [prescriptions.clientId], references: [clients.id] }),
  doctor: one(doctors, { fields: [prescriptions.doctorId], references: [doctors.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  client: one(clients, { fields: [orders.clientId], references: [clients.id] }),
  consultant: one(consultants, { fields: [orders.consultantId], references: [consultants.id] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  stockMovements: many(stockMovements),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  user: one(users, { fields: [stockMovements.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertConsultantSchema = createInsertSchema(consultants).omit({
  id: true,
  createdAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Enhanced price validation to handle string inputs and ensure positive values
  price: z.coerce.number().positive().finite(),
  // Stock control validations
  stockQuantity: z.coerce.number().int().min(0).optional(),
  minimumStock: z.coerce.number().int().min(0).optional(),
  maxStock: z.coerce.number().int().min(0).optional(),
  costPrice: z.coerce.number().positive().finite().optional(),
  // Make activeSubstances optional for now, we'll auto-generate it from concentration
  activeSubstances: z.array(z.object({
    substance: z.string().min(1),
    concentration: z.string().min(1)
  })).optional(),
  // Ensure indications is a proper array when provided
  indications: z.array(z.string()).optional()
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCheckoutConfigSchema = createInsertSchema(checkoutConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertYampiConfigSchema = createInsertSchema(yampiConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSync: true,
});

export const insertYampiTransactionSchema = createInsertSchema(yampiTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
}).extend({
  quantity: z.coerce.number().int(),
  previousQuantity: z.coerce.number().int().min(0),
  newQuantity: z.coerce.number().int().min(0),
  costPrice: z.coerce.number().positive().finite().optional(),
  unitValue: z.coerce.number().positive().finite().optional(),
  totalValue: z.coerce.number().positive().finite().optional(),
});

// Universidade dos Médicos - Educational Content
export const eduTags = pgTable("edu_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eduCourses = pgTable("edu_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary"),
  coverImageUrl: text("cover_image_url"),
  level: text("level").default("intermediate"), // beginner, intermediate, advanced
  tags: text("tags").array().notNull().default([]), // Array of tag names
  duration: integer("duration").default(60), // minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eduLessons = pgTable("edu_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => eduCourses.id),
  title: text("title").notNull(),
  content: text("content"),
  videoUrl: text("video_url"),
  duration: integer("duration").default(10), // minutes
  order: integer("order").notNull().default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eduArticles = pgTable("edu_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  tags: text("tags").array().notNull().default([]), // Array of tag names
  author: text("author"),
  publishedAt: timestamp("published_at").defaultNow(),
  imageUrl: text("image_url"),
  attachmentUrl: text("attachment_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eduGuidelines = pgTable("edu_guidelines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  specialty: text("specialty"), // pediatria, neurologia, dor, etc
  content: text("content").notNull(),
  version: text("version").default("1.0"),
  tags: text("tags").array().notNull().default([]), // Array of tag names
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eduProgress = pgTable("edu_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: varchar("course_id").references(() => eduCourses.id),
  lessonId: varchar("lesson_id").references(() => eduLessons.id),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Telemedicine Integration Schemas
export const telemedicineProviders = pgTable("telemedicine_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Nome da plataforma (ex: "Sanar", "TeleMed")
  apiUrl: text("api_url"), // URL base da API
  webhookUrl: text("webhook_url"), // URL para receber webhooks
  authConfig: jsonb("auth_config"), // Configurações de autenticação {type: "oauth", clientId: "", secret: ""}
  credentialsConfig: jsonb("credentials_config"), // Credenciais e chaves API
  isActive: boolean("is_active").default(true),
  capabilities: jsonb("capabilities"), // {supportsVideo: true, supportsPrescription: true, supportsRecords: true}
  integrationStatus: text("integration_status").default("inactive"), // inactive, testing, active, error
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const telemedicineConsultations = pgTable("telemedicine_consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => telemedicineProviders.id),
  externalConsultationId: text("external_consultation_id").notNull(), // ID da consulta na plataforma externa
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }), // Nosso paciente, se já existe
  doctorId: varchar("doctor_id").references(() => doctors.id), // Nosso médico, se já existe
  
  // Dados do paciente da plataforma externa
  externalClientData: jsonb("external_client_data").notNull(), // {name, email, cpf, phone, age, weight, etc}
  
  // Dados do médico da plataforma externa
  externalDoctorData: jsonb("external_doctor_data").notNull(), // {name, crm, specialty, email, phone}
  
  // Dados da consulta
  consultationType: text("consultation_type").notNull(), // video, audio, chat, presencial
  scheduledAt: timestamp("scheduled_at").notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // duração em minutos
  
  // Status e controle
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, cancelled, no_show, rescheduled
  consultationNotes: text("consultation_notes"), // Anotações médicas da consulta
  diagnosis: text("diagnosis"), // Diagnóstico médico
  treatmentPlan: text("treatment_plan"), // Plano de tratamento
  
  // Dados técnicos
  meetingRoomData: jsonb("meeting_room_data"), // {roomId, password, recordingUrl, chatLogs}
  qualityMetrics: jsonb("quality_metrics"), // {audioQuality, videoQuality, connectionStability}
  
  // Metadados de integração
  rawData: jsonb("raw_data"), // Dados brutos da API externa para debugging
  syncStatus: text("sync_status").default("pending"), // pending, synced, error
  lastSyncAt: timestamp("last_sync_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }),
  telemedicineConsultationId: varchar("telemedicine_consultation_id").references(() => telemedicineConsultations.id),
  providerId: varchar("provider_id").references(() => telemedicineProviders.id),
  externalRecordId: text("external_record_id"), // ID do prontuário na plataforma externa
  
  // Anamnese completa
  anamnesis: jsonb("anamnesis").notNull(), // História clínica detalhada
  vitalSigns: jsonb("vital_signs"), // {pressure, heartRate, temperature, weight, height, bmi}
  physicalExam: jsonb("physical_exam"), // Exame físico detalhado
  
  // Histórico médico
  medicalHistory: jsonb("medical_history"), // Histórico de doenças, cirurgias, alergias
  familyHistory: jsonb("family_history"), // Histórico familiar
  socialHistory: jsonb("social_history"), // Hábitos sociais (fumo, álcool, exercícios)
  
  // Medicações e tratamentos
  currentMedications: jsonb("current_medications"), // Medicações atuais detalhadas
  allergies: jsonb("allergies"), // Alergias medicamentosas e outras
  previousTreatments: jsonb("previous_treatments"), // Tratamentos anteriores
  
  // Exames e resultados
  labResults: jsonb("lab_results"), // Resultados de exames laboratoriais
  imagingResults: jsonb("imaging_results"), // Resultados de exames de imagem
  specialtyReports: jsonb("specialty_reports"), // Relatórios de especialistas
  
  // Documentos e anexos
  attachments: jsonb("attachments"), // {type, url, description, uploadedAt}[]
  documents: jsonb("documents"), // Documentos digitalizados
  
  // Metadata
  completenessScore: decimal("completeness_score", { precision: 3, scale: 2 }), // Score de completude 0-1
  dataQualityFlags: text("data_quality_flags").array().default([]), // ["missing_vitals", "incomplete_history"]
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const externalPrescriptions = pgTable("external_prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telemedicineConsultationId: varchar("telemedicine_consultation_id").notNull().references(() => telemedicineConsultations.id),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id), // Link para nossa receita, se convertida
  providerId: varchar("provider_id").notNull().references(() => telemedicineProviders.id),
  externalPrescriptionId: text("external_prescription_id").notNull(),
  
  // Dados da receita externa
  prescribedMedications: jsonb("prescribed_medications").notNull(), // [{name, activeSubstance, dosage, frequency, duration, instructions}]
  additionalInstructions: text("additional_instructions"),
  validUntil: timestamp("valid_until"),
  
  // Status de conversão
  conversionStatus: text("conversion_status").default("pending"), // pending, converted, not_applicable, failed
  conversionNotes: text("conversion_notes"), // Notas sobre a conversão
  matchedProducts: jsonb("matched_products"), // Produtos nossos que correspondem [{externalMed, ourProductId, confidence}]
  
  // Dados do médico prescritor
  prescribingDoctor: jsonb("prescribing_doctor").notNull(), // Dados completos do médico
  digitalSignature: text("digital_signature"), // Assinatura digital se houver
  
  // Metadados
  isControlledSubstance: boolean("is_controlled_substance").default(false),
  requiresSpecialHandling: boolean("requires_special_handling").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientPathologies = pgTable("client_pathologies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }),
  telemedicineConsultationId: varchar("telemedicine_consultation_id").references(() => telemedicineConsultations.id),
  
  // Classificação da patologia
  primaryDiagnosis: text("primary_diagnosis").notNull(), // Diagnóstico principal
  secondaryDiagnoses: text("secondary_diagnoses").array().default([]), // Diagnósticos secundários
  icd10Codes: text("icd10_codes").array().default([]), // Códigos CID-10
  
  // Detalhamento clínico
  severity: text("severity").default("moderate"), // mild, moderate, severe, critical
  status: text("status").default("active"), // active, resolved, chronic, recurrent
  onsetDate: timestamp("onset_date"), // Data de início dos sintomas
  diagnosisDate: timestamp("diagnosis_date"), // Data do diagnóstico
  
  // Sintomas detalhados
  currentSymptoms: jsonb("current_symptoms").notNull(), // [{symptom, severity, duration, frequency, triggers}]
  symptomHistory: jsonb("symptom_history"), // Histórico de evolução dos sintomas
  painScale: integer("pain_scale"), // Escala de dor 0-10
  functionalImpact: jsonb("functional_impact"), // Impacto funcional detalhado
  
  // Tratamento e evolução
  currentTreatments: jsonb("current_treatments"), // Tratamentos atuais
  treatmentResponse: jsonb("treatment_response"), // Resposta aos tratamentos
  treatmentHistory: jsonb("treatment_history"), // Histórico de tratamentos
  
  // Fatores relacionados
  riskFactors: text("risk_factors").array().default([]), // Fatores de risco
  triggerFactors: text("trigger_factors").array().default([]), // Fatores desencadeantes
  comorbidities: text("comorbidities").array().default([]), // Comorbidades
  
  // Dados para cannabis medicinal
  cannabisEligibility: jsonb("cannabis_eligibility"), // {eligible, reasons[], contraindications[]}
  previousCannabisUse: jsonb("previous_cannabis_use"), // Experiência prévia com cannabis
  
  // Qualidade de vida
  qualityOfLifeScore: decimal("quality_of_life_score", { precision: 3, scale: 2 }), // Score 0-1
  dailyActivitiesImpact: jsonb("daily_activities_impact"),
  
  // Metadados
  dataSource: text("data_source").default("telemedicine"), // telemedicine, medical_record, manual
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }), // Nível de confiança do diagnóstico
  requiresSecondOpinion: boolean("requires_second_opinion").default(false),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postSaleFollowups = pgTable("post_sale_followups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  consultantId: varchar("consultant_id").references(() => consultants.id),
  
  // Controle do acompanhamento
  followupType: text("followup_type").notNull(), // welcome, usage_check, refill_reminder, side_effects, satisfaction
  scheduledFor: timestamp("scheduled_for").notNull(),
  completedAt: timestamp("completed_at"),
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, skipped, failed
  
  // Dados do contato
  contactMethod: text("contact_method"), // whatsapp, email, phone, sms
  contactAttempts: integer("contact_attempts").default(0),
  lastContactAttempt: timestamp("last_contact_attempt"),
  responseReceived: boolean("response_received").default(false),
  
  // Dados coletados no followup
  patientFeedback: jsonb("client_feedback"), // Feedback do cliente
  treatmentAdherence: jsonb("treatment_adherence"), // {taking_as_prescribed, missed_doses, reasons}
  sideEffects: jsonb("side_effects"), // Efeitos colaterais relatados
  efficacyReports: jsonb("efficacy_reports"), // Relatos de eficácia
  
  // Avaliação da satisfação
  satisfactionScore: integer("satisfaction_score"), // 1-10
  npsScore: integer("nps_score"), // Net Promoter Score 0-10
  testimonialConsent: boolean("testimonial_consent").default(false),
  testimonialText: text("testimonial_text"),
  
  // Dados para reposição
  currentStock: jsonb("current_stock"), // Estoque atual do cliente
  refillNeeded: boolean("refill_needed").default(false),
  suggestedRefillDate: timestamp("suggested_refill_date"),
  refillReminderSent: boolean("refill_reminder_sent").default(false),
  
  // Escalação e ações
  requiresMedicalAttention: boolean("requires_medical_attention").default(false),
  escalatedToDoctor: boolean("escalated_to_doctor").default(false),
  escalationNotes: text("escalation_notes"),
  actionsTaken: text("actions_taken").array().default([]),
  
  // Next steps
  nextFollowupType: text("next_followup_type"),
  nextFollowupDate: timestamp("next_followup_date"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const anvisaProcesses = pgTable("anvisa_processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id),
  
  // Identificação do processo
  anvisaProtocolNumber: text("anvisa_protocol_number").unique(), // Número de protocolo da ANVISA
  processType: text("process_type").notNull(), // individual, coletivo, renovacao, primeira_via
  requestCategory: text("request_category").notNull(), // uso_proprio, terceiros, entidade
  
  // Status do processo
  status: text("status").default("preparing"), // preparing, submitted, under_review, additional_info_required, approved, rejected, expired
  submissionDate: timestamp("submission_date"),
  lastStatusUpdate: timestamp("last_status_update"),
  expectedDecisionDate: timestamp("expected_decision_date"),
  actualDecisionDate: timestamp("actual_decision_date"),
  
  // Documentação necessária
  requiredDocuments: jsonb("required_documents").notNull(), // Lista de documentos necessários
  submittedDocuments: jsonb("submitted_documents").default([]), // {type, filename, url, uploadedAt, status}[]
  documentationStatus: text("documentation_status").default("incomplete"), // incomplete, complete, under_review, approved, rejected
  
  // Dados do cliente para ANVISA
  clientAnvisaData: jsonb("client_anvisa_data").notNull(), // Dados formatados para ANVISA
  medicalJustification: text("medical_justification").notNull(), // Justificativa médica
  prescribingDoctorData: jsonb("prescribing_doctor_data").notNull(), // Dados do médico prescritor
  
  // Produtos solicitados
  requestedProducts: jsonb("requested_products").notNull(), // Produtos detalhados para solicitação
  approvedProducts: jsonb("approved_products"), // Produtos aprovados pela ANVISA
  quantityLimits: jsonb("quantity_limits"), // Limites de quantidade aprovados
  
  // Controle de prazo
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  renewalRequired: boolean("renewal_required").default(false),
  renewalNotificationSent: boolean("renewal_notification_sent").default(false),
  
  // Comunicação com ANVISA
  anvisaCommunications: jsonb("anvisa_communications"), // Log de comunicações
  additionalInfoRequests: jsonb("additional_info_requests"), // Solicitações de informações adicionais
  lastAnvisaResponse: jsonb("last_anvisa_response"), // Última resposta da ANVISA
  
  // Automação e integração
  automationEnabled: boolean("automation_enabled").default(true),
  autoSubmitWhenReady: boolean("auto_submit_when_ready").default(false),
  reminderSchedule: jsonb("reminder_schedule"), // Cronograma de lembretes
  
  // Histórico de tentativas
  submissionAttempts: integer("submission_attempts").default(0),
  lastSubmissionAttempt: timestamp("last_submission_attempt"),
  rejectionReasons: text("rejection_reasons").array().default([]),
  
  // Metadados
  estimatedProcessingTime: integer("estimated_processing_time"), // dias estimados
  actualProcessingTime: integer("actual_processing_time"), // dias reais
  urgencyLevel: text("urgency_level").default("normal"), // low, normal, high, urgent
  
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Notas internas não visíveis ao cliente
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Educational content relations
export const eduCoursesRelations = relations(eduCourses, ({ many }) => ({
  lessons: many(eduLessons),
  progress: many(eduProgress),
}));

export const eduLessonsRelations = relations(eduLessons, ({ one, many }) => ({
  course: one(eduCourses, { fields: [eduLessons.courseId], references: [eduCourses.id] }),
  progress: many(eduProgress),
}));

export const eduProgressRelations = relations(eduProgress, ({ one }) => ({
  user: one(users, { fields: [eduProgress.userId], references: [users.id] }),
  course: one(eduCourses, { fields: [eduProgress.courseId], references: [eduCourses.id] }),
  lesson: one(eduLessons, { fields: [eduProgress.lessonId], references: [eduLessons.id] }),
}));

// Telemedicine Integration Relations
export const telemedicineProvidersRelations = relations(telemedicineProviders, ({ many }) => ({
  consultations: many(telemedicineConsultations),
  medicalRecords: many(medicalRecords),
  externalPrescriptions: many(externalPrescriptions),
}));

export const telemedicineConsultationsRelations = relations(telemedicineConsultations, ({ one, many }) => ({
  provider: one(telemedicineProviders, { fields: [telemedicineConsultations.providerId], references: [telemedicineProviders.id] }),
  client: one(clients, { fields: [telemedicineConsultations.clientId], references: [clients.id] }),
  doctor: one(doctors, { fields: [telemedicineConsultations.doctorId], references: [doctors.id] }),
  medicalRecords: many(medicalRecords),
  externalPrescriptions: many(externalPrescriptions),
  clientPathologies: many(clientPathologies),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  client: one(clients, { fields: [medicalRecords.clientId], references: [clients.id] }),
  telemedicineConsultation: one(telemedicineConsultations, { fields: [medicalRecords.telemedicineConsultationId], references: [telemedicineConsultations.id] }),
  provider: one(telemedicineProviders, { fields: [medicalRecords.providerId], references: [telemedicineProviders.id] }),
}));

export const externalPrescriptionsRelations = relations(externalPrescriptions, ({ one }) => ({
  telemedicineConsultation: one(telemedicineConsultations, { fields: [externalPrescriptions.telemedicineConsultationId], references: [telemedicineConsultations.id] }),
  prescription: one(prescriptions, { fields: [externalPrescriptions.prescriptionId], references: [prescriptions.id] }),
  provider: one(telemedicineProviders, { fields: [externalPrescriptions.providerId], references: [telemedicineProviders.id] }),
}));

export const clientPathologiesRelations = relations(clientPathologies, ({ one }) => ({
  client: one(clients, { fields: [clientPathologies.clientId], references: [clients.id] }),
  telemedicineConsultation: one(telemedicineConsultations, { fields: [clientPathologies.telemedicineConsultationId], references: [telemedicineConsultations.id] }),
}));

export const postSaleFollowupsRelations = relations(postSaleFollowups, ({ one }) => ({
  order: one(orders, { fields: [postSaleFollowups.orderId], references: [orders.id] }),
  client: one(clients, { fields: [postSaleFollowups.clientId], references: [clients.id] }),
  consultant: one(consultants, { fields: [postSaleFollowups.consultantId], references: [consultants.id] }),
}));

export const anvisaProcessesRelations = relations(anvisaProcesses, ({ one }) => ({
  client: one(clients, { fields: [anvisaProcesses.clientId], references: [clients.id] }),
  order: one(orders, { fields: [anvisaProcesses.orderId], references: [orders.id] }),
  prescription: one(prescriptions, { fields: [anvisaProcesses.prescriptionId], references: [prescriptions.id] }),
}));

// Partner Integrations (SSO - Single Sign-On para plataformas de médicos parceiros)
export const partnerIntegrations = pgTable("partner_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Nome do parceiro (ex: "Clínica Dr. Silva")
  description: text("description"), // Descrição da integração
  ssoUrl: text("sso_url").notNull(), // URL da plataforma do parceiro para SSO
  webhookUrl: text("webhook_url"), // URL para enviar webhook antes do redirect (opcional)
  sharedSecret: text("shared_secret").notNull(), // Secret compartilhada para assinar o JWT
  isActive: boolean("is_active").default(true), // Ativa/Inativa
  tokenExpirationMinutes: integer("token_expiration_minutes").default(15), // Validade do JWT em minutos
  logoUrl: text("logo_url"), // Logo do parceiro
  contactEmail: text("contact_email"), // Email de contato do parceiro
  contactPhone: text("contact_phone"), // Telefone de contato
  specialties: text("specialties").array(), // Especialidades oferecidas
  notes: text("notes"), // Notas internas
  lastUsedAt: timestamp("last_used_at"), // Última vez que foi usado
  usageCount: integer("usage_count").default(0), // Contador de usos
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Logs de redirecionamentos SSO para auditoria
export const partnerSsoLogs = pgTable("partner_sso_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partnerIntegrations.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenGenerated: text("token_generated").notNull(), // JWT gerado (para debug)
  redirectUrl: text("redirect_url").notNull(), // URL completa de redirect
  webhookSent: boolean("webhook_sent").default(false), // Se webhook foi enviado
  webhookResponse: jsonb("webhook_response"), // Resposta do webhook (se houver)
  ipAddress: text("ip_address"), // IP do usuário
  userAgent: text("user_agent"), // User agent
  success: boolean("success").default(true), // Se o redirect foi bem-sucedido
  errorMessage: text("error_message"), // Mensagem de erro (se houver)
  createdAt: timestamp("created_at").defaultNow(),
});

// Consultas recebidas via webhook dos parceiros SSO
export const partnerConsultations = pgTable("partner_consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partnerIntegrations.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Dados da consulta
  consultationDate: timestamp("consultation_date").notNull(), // Data/hora da consulta
  doctorName: text("doctor_name").notNull(), // Nome do médico que atendeu
  doctorCrm: text("doctor_crm"), // CRM do médico
  specialization: text("specialization"), // Especialização
  diagnosis: text("diagnosis"), // Diagnóstico
  observations: text("observations"), // Observações da consulta
  
  // Receita médica
  prescriptionUrl: text("prescription_url"), // URL do arquivo da receita no Object Storage
  prescriptionFileName: text("prescription_file_name"), // Nome original do arquivo
  prescriptionStatus: text("prescription_status").default("pending"), // pending, approved, rejected
  prescriptionApprovedBy: varchar("prescription_approved_by").references(() => users.id), // Admin que aprovou
  prescriptionApprovedAt: timestamp("prescription_approved_at"), // Quando foi aprovada
  prescriptionRejectionReason: text("prescription_rejection_reason"), // Motivo da rejeição
  
  // Controle
  productsEnabled: boolean("products_enabled").default(false), // Se já liberou produtos para compra
  productsEnabledAt: timestamp("products_enabled_at"), // Quando liberou os produtos
  
  // Webhook data
  webhookData: jsonb("webhook_data").notNull(), // Dados brutos recebidos do webhook
  webhookReceivedAt: timestamp("webhook_received_at").defaultNow(), // Quando recebeu o webhook
  webhookIpAddress: text("webhook_ip_address"), // IP de origem do webhook
  webhookSignatureValid: boolean("webhook_signature_valid").default(true), // Se a assinatura foi válida
  
  // Auditoria
  processedBy: varchar("processed_by").references(() => users.id), // Admin que processou
  processedAt: timestamp("processed_at"), // Quando foi processado
  notes: text("notes"), // Notas internas do admin
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partner Integrations Relations
export const partnerIntegrationsRelations = relations(partnerIntegrations, ({ many }) => ({
  ssoLogs: many(partnerSsoLogs),
  consultations: many(partnerConsultations),
}));

export const partnerSsoLogsRelations = relations(partnerSsoLogs, ({ one }) => ({
  partner: one(partnerIntegrations, { fields: [partnerSsoLogs.partnerId], references: [partnerIntegrations.id] }),
  client: one(clients, { fields: [partnerSsoLogs.clientId], references: [clients.id] }),
  user: one(users, { fields: [partnerSsoLogs.userId], references: [users.id] }),
}));

export const partnerConsultationsRelations = relations(partnerConsultations, ({ one }) => ({
  partner: one(partnerIntegrations, { fields: [partnerConsultations.partnerId], references: [partnerIntegrations.id] }),
  client: one(clients, { fields: [partnerConsultations.clientId], references: [clients.id] }),
  user: one(users, { fields: [partnerConsultations.userId], references: [users.id] }),
  prescriptionApprover: one(users, { fields: [partnerConsultations.prescriptionApprovedBy], references: [users.id] }),
  processor: one(users, { fields: [partnerConsultations.processedBy], references: [users.id] }),
}));


// Insert schemas for new tables
export const insertEduTagSchema = createInsertSchema(eduTags).omit({
  id: true,
  createdAt: true,
});

export const insertEduCourseSchema = createInsertSchema(eduCourses).omit({
  id: true,
  createdAt: true,
});

export const insertEduLessonSchema = createInsertSchema(eduLessons).omit({
  id: true,
  createdAt: true,
});

export const insertEduArticleSchema = createInsertSchema(eduArticles).omit({
  id: true,
  createdAt: true,
});

export const insertEduGuidelineSchema = createInsertSchema(eduGuidelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEduProgressSchema = createInsertSchema(eduProgress).omit({
  id: true,
  completedAt: true,
});

// Telemedicine Integration Insert Schemas
export const insertTelemedicineProviderSchema = createInsertSchema(telemedicineProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  authConfig: z.record(z.any()).optional(),
  credentialsConfig: z.record(z.any()).optional(),
  capabilities: z.record(z.boolean()).optional(),
});

export const insertTelemedicineConsultationSchema = createInsertSchema(telemedicineConsultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  externalClientData: z.record(z.any()),
  externalDoctorData: z.record(z.any()),
  meetingRoomData: z.record(z.any()).optional(),
  qualityMetrics: z.record(z.any()).optional(),
  rawData: z.record(z.any()).optional(),
  duration: z.number().positive().optional(),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  anamnesis: z.record(z.any()),
  vitalSigns: z.object({
    pressure: z.string().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    bmi: z.number().optional(),
  }).optional(),
  physicalExam: z.record(z.any()).optional(),
  medicalHistory: z.record(z.any()).optional(),
  familyHistory: z.record(z.any()).optional(),
  socialHistory: z.record(z.any()).optional(),
  currentMedications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string().optional(),
  })).optional(),
  allergies: z.array(z.object({
    substance: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]).optional(),
    reaction: z.string().optional(),
  })).optional(),
  previousTreatments: z.record(z.any()).optional(),
  labResults: z.array(z.object({
    testName: z.string(),
    result: z.string(),
    date: z.string(),
    normalRange: z.string().optional(),
  })).optional(),
  imagingResults: z.array(z.object({
    type: z.string(),
    result: z.string(),
    date: z.string(),
  })).optional(),
  specialtyReports: z.array(z.object({
    specialty: z.string(),
    report: z.string(),
    date: z.string(),
  })).optional(),
  attachments: z.array(z.object({
    type: z.string(),
    url: z.string(),
    description: z.string().optional(),
    uploadedAt: z.string(),
  })).optional(),
  documents: z.array(z.object({
    type: z.string(),
    content: z.string(),
    date: z.string(),
  })).optional(),
  completenessScore: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0.00 && num <= 1.00;
  }, {
    message: "completenessScore must be a decimal string between 0.00 and 1.00"
  }),
});

export const insertExternalPrescriptionSchema = createInsertSchema(externalPrescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  prescribedMedications: z.array(z.object({
    name: z.string(),
    activeSubstance: z.string().optional(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string().optional(),
    instructions: z.string().optional(),
  })),
  prescribingDoctor: z.object({
    name: z.string(),
    crm: z.string(),
    specialty: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  matchedProducts: z.array(z.object({
    externalMed: z.string(),
    ourProductId: z.string(),
    confidence: z.number().min(0).max(1),
  })).optional(),
});

export const insertClientPathologySchema = createInsertSchema(clientPathologies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currentSymptoms: z.array(z.object({
    symptom: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]).optional(),
    duration: z.string().optional(),
    frequency: z.string().optional(),
    triggers: z.array(z.string()).optional(),
  })),
  symptomHistory: z.array(z.object({
    date: z.string(),
    symptom: z.string(),
    severity: z.string(),
    notes: z.string().optional(),
  })).optional(),
  functionalImpact: z.object({
    mobility: z.enum(["none", "mild", "moderate", "severe"]).optional(),
    sleep: z.enum(["none", "mild", "moderate", "severe"]).optional(),
    work: z.enum(["none", "mild", "moderate", "severe"]).optional(),
    social: z.enum(["none", "mild", "moderate", "severe"]).optional(),
  }).optional(),
  currentTreatments: z.array(z.object({
    treatment: z.string(),
    startDate: z.string().optional(),
    effectiveness: z.enum(["poor", "fair", "good", "excellent"]).optional(),
  })).optional(),
  treatmentResponse: z.record(z.any()).optional(),
  treatmentHistory: z.array(z.object({
    treatment: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    reason: z.string().optional(),
    effectiveness: z.string().optional(),
  })).optional(),
  cannabisEligibility: z.object({
    eligible: z.boolean(),
    reasons: z.array(z.string()).optional(),
    contraindications: z.array(z.string()).optional(),
  }).optional(),
  previousCannabisUse: z.object({
    hasUsed: z.boolean(),
    frequency: z.string().optional(),
    effectiveness: z.string().optional(),
    sideEffects: z.array(z.string()).optional(),
  }).optional(),
  dailyActivitiesImpact: z.record(z.any()).optional(),
  painScale: z.number().min(0).max(10).optional(),
  qualityOfLifeScore: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0.00 && num <= 1.00;
  }, {
    message: "qualityOfLifeScore must be a decimal string between 0.00 and 1.00"
  }),
  confidenceLevel: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0.00 && num <= 1.00;
  }, {
    message: "confidenceLevel must be a decimal string between 0.00 and 1.00"
  }),
});

export const insertPostSaleFollowupSchema = createInsertSchema(postSaleFollowups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  patientFeedback: z.record(z.any()).optional(),
  treatmentAdherence: z.object({
    takingAsPrescribed: z.boolean().optional(),
    missedDoses: z.number().optional(),
    reasons: z.array(z.string()).optional(),
  }).optional(),
  sideEffects: z.array(z.object({
    effect: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]),
    frequency: z.string().optional(),
  })).optional(),
  efficacyReports: z.array(z.object({
    symptom: z.string(),
    improvement: z.enum(["none", "slight", "moderate", "significant", "complete"]),
    notes: z.string().optional(),
  })).optional(),
  currentStock: z.record(z.any()).optional(),
  contactAttempts: z.number().default(0),
  satisfactionScore: z.number().min(1).max(10).optional(),
  npsScore: z.number().min(0).max(10).optional(),
});

export const insertAnvisaProcessSchema = createInsertSchema(anvisaProcesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  requiredDocuments: z.array(z.object({
    type: z.string(),
    required: z.boolean().default(true),
    description: z.string().optional(),
  })),
  submittedDocuments: z.array(z.object({
    type: z.string(),
    filename: z.string(),
    url: z.string(),
    uploadedAt: z.string(),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  })).optional(),
  clientAnvisaData: z.object({
    fullName: z.string(),
    cpf: z.string(),
    rg: z.string().optional(),
    birthDate: z.string(),
    address: z.record(z.any()),
    phone: z.string(),
    email: z.string(),
  }),
  prescribingDoctorData: z.object({
    name: z.string(),
    crm: z.string(),
    specialty: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }),
  requestedProducts: z.array(z.object({
    productName: z.string(),
    activeSubstance: z.string(),
    concentration: z.string(),
    quantity: z.number(),
    dosage: z.string(),
  })),
  approvedProducts: z.array(z.object({
    productName: z.string(),
    approvedQuantity: z.number(),
    restrictions: z.array(z.string()).optional(),
  })).optional(),
  quantityLimits: z.record(z.number()).optional(),
  anvisaCommunications: z.array(z.object({
    date: z.string(),
    type: z.enum(["sent", "received"]),
    content: z.string(),
    attachments: z.array(z.string()).optional(),
  })).optional(),
  additionalInfoRequests: z.array(z.object({
    date: z.string(),
    request: z.string(),
    status: z.enum(["pending", "provided", "overdue"]).default("pending"),
    response: z.string().optional(),
  })).optional(),
  lastAnvisaResponse: z.record(z.any()).optional(),
  reminderSchedule: z.array(z.object({
    type: z.string(),
    scheduledFor: z.string(),
    sent: z.boolean().default(false),
  })).optional(),
  submissionAttempts: z.number().default(0),
  estimatedProcessingTime: z.number().positive().optional(),
  actualProcessingTime: z.number().positive().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Consultant = typeof consultants.$inferSelect;
export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type YampiConfig = typeof yampiConfig.$inferSelect;
export type InsertYampiConfig = z.infer<typeof insertYampiConfigSchema>;
export type YampiTransaction = typeof yampiTransactions.$inferSelect;
export type InsertYampiTransaction = z.infer<typeof insertYampiTransactionSchema>;

// Educational types
export type EduTag = typeof eduTags.$inferSelect;
export type InsertEduTag = z.infer<typeof insertEduTagSchema>;
export type EduCourse = typeof eduCourses.$inferSelect;
export type InsertEduCourse = z.infer<typeof insertEduCourseSchema>;
export type EduLesson = typeof eduLessons.$inferSelect;
export type InsertEduLesson = z.infer<typeof insertEduLessonSchema>;
export type EduArticle = typeof eduArticles.$inferSelect;
export type InsertEduArticle = z.infer<typeof insertEduArticleSchema>;
export type EduGuideline = typeof eduGuidelines.$inferSelect;
export type InsertEduGuideline = z.infer<typeof insertEduGuidelineSchema>;
export type EduProgress = typeof eduProgress.$inferSelect;
export type InsertEduProgress = z.infer<typeof insertEduProgressSchema>;

// Telemedicine Integration types
export type TelemedicineProvider = typeof telemedicineProviders.$inferSelect;
export type InsertTelemedicineProvider = z.infer<typeof insertTelemedicineProviderSchema>;
export type TelemedicineConsultation = typeof telemedicineConsultations.$inferSelect;
export type InsertTelemedicineConsultation = z.infer<typeof insertTelemedicineConsultationSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type ExternalPrescription = typeof externalPrescriptions.$inferSelect;
export type InsertExternalPrescription = z.infer<typeof insertExternalPrescriptionSchema>;
export type ClientPathology = typeof clientPathologies.$inferSelect;
export type InsertClientPathology = z.infer<typeof insertClientPathologySchema>;
export type PostSaleFollowup = typeof postSaleFollowups.$inferSelect;
export type InsertPostSaleFollowup = z.infer<typeof insertPostSaleFollowupSchema>;
export type AnvisaProcess = typeof anvisaProcesses.$inferSelect;
export type InsertAnvisaProcess = z.infer<typeof insertAnvisaProcessSchema>;

// CRM Lead Management Tables
// Kanban Stage Configuration (customizable by admin)
export const leadStages = pgTable("lead_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Display name
  slug: text("slug").notNull().unique(), // URL-safe identifier (e.g., "novo", "contato_inicial")
  description: text("description"),
  color: text("color").notNull().default("#3b82f6"), // Hex color for UI
  icon: text("icon").default("Circle"), // Lucide icon name
  position: integer("position").notNull().default(0), // Order in kanban
  isActive: boolean("is_active").notNull().default(true), // Can be archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  consultantId: varchar("consultant_id").references(() => consultants.id),
  assignedConsultantId: varchar("assigned_consultant_id").references(() => consultants.id), // Vendedor responsável - só pode ser atribuído 1x
  assignedAt: timestamp("assigned_at"), // Data que foi atribuído
  status: text("status").notNull().default("novo"), // References leadStages.slug
  priority: text("priority").default("medium"), // low, medium, high, urgent
  notes: text("notes"),
  source: text("source").default("intake"), // intake, referral, website, etc
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }), // NULL until prescription validated
  
  // CRM Enhanced Fields
  company: text("company"), // Empresa/organização
  jobTitle: text("job_title"), // Cargo
  leadScore: integer("lead_score").default(0), // Pontuação do lead (0-100)
  tags: text("tags").array(), // Tags/categorias
  lastInteraction: timestamp("last_interaction"), // Última interação
  nextFollowUp: timestamp("next_follow_up"), // Próximo follow-up agendado
  productsInterest: text("products_interest").array(), // Produtos de interesse
  budget: decimal("budget", { precision: 10, scale: 2 }), // Orçamento disponível
  expectedCloseDate: timestamp("expected_close_date"), // Data esperada de fechamento
  conversionProbability: integer("conversion_probability").default(50), // Probabilidade de conversão (%)
  address: text("address"), // Endereço completo
  city: text("city"), // Cidade
  state: text("state"), // Estado (UF)
  zipCode: text("zip_code"), // CEP
  linkedin: text("linkedin"), // LinkedIn URL
  instagram: text("instagram"), // Instagram handle
  referralSource: text("referral_source"), // Fonte específica (ex: "João Silva", "CES 2025")
  lostReason: text("lost_reason"), // Motivo de perda (se aplicável)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadStageHistory = pgTable("lead_stage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  previousStatus: text("previous_status"),
  newStatus: text("new_status").notNull(),
  byUserId: varchar("by_user_id").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses/Costs table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  category: text("category").notNull(), // operacional, marketing, pessoal, tecnologia, impostos, outros
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  paymentMethod: text("payment_method"), // dinheiro, cartão, transferência, boleto, pix
  vendor: text("vendor"), // fornecedor/prestador
  status: text("status").notNull().default("paid"), // paid, pending, cancelled
  notes: text("notes"),
  receiptUrl: text("receipt_url"), // URL do comprovante
  isRecurring: boolean("is_recurring").default(false), // Se é despesa recorrente
  recurrenceInterval: text("recurrence_interval"), // monthly, quarterly, yearly
  tags: jsonb("tags"), // Tags para categorização adicional
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientFlags = pgTable("client_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }).unique(),
  hasTelemedAccount: boolean("has_telemed_account").default(false),
  prescriptionValidated: boolean("prescription_validated").default(false),
  prescriptionUrl: text("prescription_url"), // URL of uploaded prescription
  anvisaDocumentValidated: boolean("anvisa_document_validated").default(false),
  anvisaDocumentUrl: text("anvisa_document_url"),
  canViewPrices: boolean("can_view_prices").default(false),
  canPurchase: boolean("can_purchase").default(false),
  lastStage: text("last_stage"),
  telemedConsultationId: varchar("telemed_consultation_id").references(() => telemedicineConsultations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Business API Configuration
export const whatsappConfig = pgTable("whatsapp_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: text("business_account_id"), // WhatsApp Business Account ID
  phoneNumberId: text("phone_number_id"), // WhatsApp Phone Number ID
  phoneNumber: text("phone_number"), // Formatted phone number (display)
  accessToken: text("access_token"), // Permanent Access Token
  verifyToken: text("verify_token"), // Webhook verification token
  appId: text("app_id"), // Meta App ID
  appSecret: text("app_secret"), // Meta App Secret
  webhookUrl: text("webhook_url"), // N8N Webhook URL for incoming messages
  isActive: boolean("is_active").default(false),
  notes: text("notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Telemedicine Configuration
export const telemedicineConfig = pgTable("telemedicine_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationType: text("integration_type").notNull().default("redirect"), // 'redirect' or 'api'
  redirectUrl: text("redirect_url"), // URL para redirecionamento (se tipo = redirect) - DEPRECATED: use redirectLinks
  redirectLinks: jsonb("redirect_links").default('[]'), // Array de {name: string, url: string} - Múltiplos links de telemedicina
  apiEndpoint: text("api_endpoint"), // API endpoint (se tipo = api - futuro)
  apiKey: text("api_key"), // API Key (se tipo = api - futuro)
  apiConfig: jsonb("api_config"), // Configurações adicionais da API
  isActive: boolean("is_active").default(false),
  notes: text("notes"), // Notas administrativas
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Configuration (Microsoft 365)
export const emailConfig = pgTable("email_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull().default("microsoft365"), // 'microsoft365' or 'smtp'
  microsoftTenantId: text("microsoft_tenant_id"), // Azure AD Tenant ID
  microsoftClientId: text("microsoft_client_id"), // Azure AD Client ID
  microsoftClientSecret: text("microsoft_client_secret"), // Azure AD Client Secret
  emailFrom: text("email_from").notNull(), // Email que fará o envio (ex: contato@vittaverde.com)
  emailFromName: text("email_from_name").default("VittaVerde"), // Nome que aparece no remetente
  smtpHost: text("smtp_host"), // SMTP host (alternativa ao Microsoft 365)
  smtpPort: integer("smtp_port"), // SMTP port (587, 465, etc)
  smtpUser: text("smtp_user"), // SMTP username
  smtpPassword: text("smtp_password"), // SMTP password
  smtpSecure: boolean("smtp_secure").default(false), // Use TLS/SSL
  isActive: boolean("is_active").default(false),
  notes: text("notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS Configuration (Multiple providers supported)
export const smsConfig = pgTable("sms_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull().default("twilio"), // 'twilio', 'vonage', 'aws_sns', 'generic'
  
  // Twilio credentials
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: text("twilio_phone_number"),
  
  // Vonage (Nexmo) credentials
  vonageApiKey: text("vonage_api_key"),
  vonageApiSecret: text("vonage_api_secret"),
  vonageSenderName: text("vonage_sender_name"), // Sender ID
  
  // AWS SNS credentials
  awsAccessKeyId: text("aws_access_key_id"),
  awsSecretAccessKey: text("aws_secret_access_key"),
  awsRegion: text("aws_region"), // e.g. 'us-east-1'
  awsSenderNumber: text("aws_sender_number"),
  
  // Generic API credentials (for custom providers)
  genericApiUrl: text("generic_api_url"), // POST endpoint
  genericApiKey: text("generic_api_key"), // Authorization header
  genericSenderNumber: text("generic_sender_number"),
  
  isActive: boolean("is_active").default(false),
  notes: text("notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// N8N Webhook Logs (for debugging)
export const n8nWebhookLogs = pgTable("n8n_webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookType: text("webhook_type").notNull(), // 'incoming_message', 'outgoing_message', 'lead_created', etc
  payload: jsonb("payload").notNull(),
  response: jsonb("response"),
  status: text("status").notNull(), // 'success', 'error'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// WhatsApp config schemas
export const insertWhatsappConfigSchema = createInsertSchema(whatsappConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type WhatsappConfig = typeof whatsappConfig.$inferSelect;
export type InsertWhatsappConfig = z.infer<typeof insertWhatsappConfigSchema>;

// Telemedicine config schemas
export const insertTelemedicineConfigSchema = createInsertSchema(telemedicineConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type TelemedicineConfig = typeof telemedicineConfig.$inferSelect;
export type InsertTelemedicineConfig = z.infer<typeof insertTelemedicineConfigSchema>;

// Email config schemas
export const insertEmailConfigSchema = createInsertSchema(emailConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type EmailConfig = typeof emailConfig.$inferSelect;
export type InsertEmailConfig = z.infer<typeof insertEmailConfigSchema>;

// SMS config schemas
export const insertSmsConfigSchema = createInsertSchema(smsConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type SmsConfig = typeof smsConfig.$inferSelect;
export type InsertSmsConfig = z.infer<typeof insertSmsConfigSchema>;

// N8N webhook log schemas
export const insertN8nWebhookLogSchema = createInsertSchema(n8nWebhookLogs).omit({ id: true, createdAt: true });
export type N8nWebhookLog = typeof n8nWebhookLogs.$inferSelect;
export type InsertN8nWebhookLog = z.infer<typeof insertN8nWebhookLogSchema>;

// Expenses schemas
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true, updatedAt: true });
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// Lead schemas
export const insertLeadStageSchema = createInsertSchema(leadStages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadSchema = createInsertSchema(leads);
export const insertLeadStageHistorySchema = createInsertSchema(leadStageHistory);
export const insertClientFlagsSchema = createInsertSchema(clientFlags);

// Lead types
export type LeadStage = typeof leadStages.$inferSelect;
export type InsertLeadStage = z.infer<typeof insertLeadStageSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadStageHistory = typeof leadStageHistory.$inferSelect;
export type InsertLeadStageHistory = z.infer<typeof insertLeadStageHistorySchema>;
export type ClientFlags = typeof clientFlags.$inferSelect;
export type InsertClientFlags = z.infer<typeof insertClientFlagsSchema>;

// Affiliate tracking schemas
export const insertAffiliateTrackingSchema = createInsertSchema(affiliateTracking).omit({ id: true, createdAt: true });
export type AffiliateTracking = typeof affiliateTracking.$inferSelect;
export type InsertAffiliateTracking = z.infer<typeof insertAffiliateTrackingSchema>;

// Partner Integrations schemas
export const insertPartnerIntegrationSchema = createInsertSchema(partnerIntegrations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastUsedAt: true,
  usageCount: true,
});
export const insertPartnerSsoLogSchema = createInsertSchema(partnerSsoLogs).omit({ id: true, createdAt: true });
export const insertPartnerConsultationSchema = createInsertSchema(partnerConsultations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  webhookReceivedAt: true,
  productsEnabledAt: true,
  prescriptionApprovedAt: true,
  processedAt: true,
});
export type PartnerIntegration = typeof partnerIntegrations.$inferSelect;
export type InsertPartnerIntegration = z.infer<typeof insertPartnerIntegrationSchema>;
export type PartnerSsoLog = typeof partnerSsoLogs.$inferSelect;
export type InsertPartnerSsoLog = z.infer<typeof insertPartnerSsoLogSchema>;
export type PartnerConsultation = typeof partnerConsultations.$inferSelect;
export type InsertPartnerConsultation = z.infer<typeof insertPartnerConsultationSchema>;

// TEMPORARY COMPATIBILITY LAYER FOR MIGRATION FROM PATIENT TO CLIENT
// This will be removed after complete migration
export type Patient = Client;
export type InsertPatient = InsertClient;
export const patients = clients;
export const insertPatientSchema = insertClientSchema;
export type PatientPathology = ClientPathology;
export type InsertPatientPathology = InsertClientPathology;
export const patientPathologies = clientPathologies;
export const insertPatientPathologySchema = insertClientPathologySchema;
export type PatientFlags = ClientFlags;
export type InsertPatientFlags = InsertClientFlags;
export const patientFlags = clientFlags;
export const insertPatientFlagsSchema = insertClientFlagsSchema;
export const patientsRelations = clientsRelations;
export const patientPathologiesRelations = clientPathologiesRelations;
