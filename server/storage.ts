import { 
  users, clients, consultants, doctors, products, prescriptions, orders, tags,
  eduTags, eduCourses, eduLessons, eduArticles, eduGuidelines, eduProgress,
  telemedicineProviders, telemedicineConsultations, medicalRecords, externalPrescriptions, clientPathologies, postSaleFollowups, anvisaProcesses,
  leads, leadStages, leadStageHistory, clientFlags, stockMovements, checkoutConfig,
  yampiConfig, yampiTransactions,
  type User, type InsertUser, type Client, type InsertClient, 
  type Consultant, type InsertConsultant, type Doctor, type InsertDoctor,
  type Product, type InsertProduct, type Prescription, type InsertPrescription, type Order, type InsertOrder,
  type Tag, type InsertTag,
  type EduTag, type InsertEduTag, type EduCourse, type InsertEduCourse, type EduLesson, type InsertEduLesson,
  type EduArticle, type InsertEduArticle, type EduGuideline, type InsertEduGuideline, type EduProgress, type InsertEduProgress,
  type TelemedicineProvider, type InsertTelemedicineProvider, type TelemedicineConsultation, type InsertTelemedicineConsultation,
  type MedicalRecord, type InsertMedicalRecord, type ExternalPrescription, type InsertExternalPrescription,
  type ClientPathology, type InsertClientPathology, type PostSaleFollowup, type InsertPostSaleFollowup,
  type AnvisaProcess, type InsertAnvisaProcess, type Lead, type InsertLead, type LeadStage, type InsertLeadStage, 
  type LeadStageHistory, type InsertLeadStageHistory,
  type ClientFlags, type InsertClientFlags, type StockMovement, type InsertStockMovement
} from "@shared/schema";
import { educationalContent, medicalNews, scientificArticles } from "@shared/schema-n8n";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  
  // Patient methods (compatibility) - deprecated, use Client methods
  getPatient(id: string): Promise<Client | undefined>;
  getPatientByUserId(userId: string): Promise<Client | undefined>;
  createPatient(patient: InsertClient): Promise<Client>;
  updatePatientAnvisaStatus(id: string, status: string, anvisaNumber?: string): Promise<Client | undefined>;

  // Client methods (new)
  getClient(id: string): Promise<Client | undefined>;
  getClientByUserId(userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  
  // Consultant methods
  getConsultant(id: string): Promise<Consultant | undefined>;
  getConsultantByUserId(userId: string): Promise<Consultant | undefined>;
  createConsultant(consultant: InsertConsultant): Promise<Consultant>;
  updateConsultant(id: string, updates: Partial<Consultant>): Promise<Consultant | undefined>;
  getActiveConsultants(): Promise<Consultant[]>;
  
  // Doctor methods
  getDoctor(id: string): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: string): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  getActiveDoctors(): Promise<Doctor[]>;
  updateDoctorWorkingHours(doctorId: string, workingHours: any): Promise<Doctor | undefined>;
  
  // Product methods
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Stock control methods
  getStockMovement(id: string): Promise<StockMovement | undefined>;
  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByProduct(productId: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  updateProductStock(productId: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string, userId?: string, reference?: string, notes?: string): Promise<StockMovement>;
  getProductsWithLowStock(): Promise<Product[]>;
  getProductStockHistory(productId: string, limit?: number): Promise<StockMovement[]>;
  getStockSummary(): Promise<{
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalStockValue: number;
  }>;
  adjustProductStock(productId: string, newQuantity: number, reason: string, userId?: string, notes?: string): Promise<StockMovement>;
  bulkUpdateStock(updates: Array<{productId: string, quantity: number, reason: string}>): Promise<StockMovement[]>;
  
  // Prescription methods
  getPrescription(id: string): Promise<Prescription | undefined>;
  getPrescriptionsByClient(clientId: string): Promise<Prescription[]>;
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>; // deprecated, use getPrescriptionsByClient
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, updates: Partial<Prescription>): Promise<Prescription | undefined>;
  
  // Order methods
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByClient(clientId: string): Promise<Order[]>;
  getOrdersByPatient(patientId: string): Promise<Order[]>; // deprecated, use getOrdersByClient
  getOrdersByConsultant(consultantId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  
  // Tag methods
  getTag(id: string): Promise<Tag | undefined>;
  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, updates: Partial<Tag>): Promise<Tag | undefined>;
  deleteTag(id: string): Promise<boolean>;

  // Educational content methods
  getEduCourse(id: string): Promise<EduCourse | undefined>;
  getEduCourses(): Promise<EduCourse[]>;
  createEduCourse(course: InsertEduCourse): Promise<EduCourse>;
  updateEduCourse(id: string, updates: Partial<EduCourse>): Promise<EduCourse | undefined>;
  deleteEduCourse(id: string): Promise<boolean>;
  
  getEduLesson(id: string): Promise<EduLesson | undefined>;
  getEduLessonsByCourse(courseId: string): Promise<EduLesson[]>;
  createEduLesson(lesson: InsertEduLesson): Promise<EduLesson>;
  updateEduLesson(id: string, updates: Partial<EduLesson>): Promise<EduLesson | undefined>;
  deleteEduLesson(id: string): Promise<boolean>;
  
  getEduArticles(): Promise<EduArticle[]>;
  getEduArticle(id: string): Promise<EduArticle | undefined>;
  createEduArticle(article: InsertEduArticle): Promise<EduArticle>;
  updateEduArticle(id: string, updates: Partial<EduArticle>): Promise<EduArticle | undefined>;
  deleteEduArticle(id: string): Promise<boolean>;
  
  getEduGuidelines(): Promise<EduGuideline[]>;
  getEduGuideline(id: string): Promise<EduGuideline | undefined>;
  createEduGuideline(guideline: InsertEduGuideline): Promise<EduGuideline>;
  updateEduGuideline(id: string, updates: Partial<EduGuideline>): Promise<EduGuideline | undefined>;
  deleteEduGuideline(id: string): Promise<boolean>;
  
  getUserEduProgress(userId: string): Promise<EduProgress[]>;
  getCourseProgress(userId: string, courseId: string): Promise<EduProgress[]>;
  createEduProgress(progress: InsertEduProgress): Promise<EduProgress>;
  
  // Content management methods (for admin interface)
  getEducationalContentBySource(source: string): Promise<any[]>;
  getEducationalContentById(id: string): Promise<any | undefined>;
  createEducationalContent(content: any): Promise<any>;
  updateEducationalContent(id: string, updates: any): Promise<any>;
  deleteEducationalContent(id: string): Promise<boolean>;
  
  getMedicalNewsBySource(source: string): Promise<any[]>;
  createMedicalNews(news: any): Promise<any>;
  
  getScientificArticlesBySource(source: string): Promise<any[]>;
  createScientificArticle(article: any): Promise<any>;
  
  // Telemedicine Provider methods
  getTelemedicineProvider(id: string): Promise<TelemedicineProvider | undefined>;
  getTelemedicineProviderByName(name: string): Promise<TelemedicineProvider | undefined>;
  getActiveTelemedicineProviders(): Promise<TelemedicineProvider[]>;
  createTelemedicineProvider(provider: InsertTelemedicineProvider): Promise<TelemedicineProvider>;
  updateTelemedicineProvider(id: string, updates: Partial<TelemedicineProvider>): Promise<TelemedicineProvider | undefined>;
  updateProviderConfig(id: string, authConfig: any, credentialsConfig: any): Promise<TelemedicineProvider | undefined>;
  deleteTelemedicineProvider(id: string): Promise<boolean>;

  // Telemedicine Consultation methods
  getTelemedicineConsultation(id: string): Promise<TelemedicineConsultation | undefined>;
  getTelemedicineConsultationByExternalId(providerId: string, externalId: string): Promise<TelemedicineConsultation | undefined>;
  getTelemedicineConsultationsByClient(clientId: string): Promise<TelemedicineConsultation[]>;
  getTelemedicineConsultationsByPatient(patientId: string): Promise<TelemedicineConsultation[]>; // deprecated, use getTelemedicineConsultationsByClient
  getTelemedicineConsultationsByProvider(providerId: string): Promise<TelemedicineConsultation[]>;
  createTelemedicineConsultation(consultation: InsertTelemedicineConsultation): Promise<TelemedicineConsultation>;
  updateTelemedicineConsultation(id: string, updates: Partial<TelemedicineConsultation>): Promise<TelemedicineConsultation | undefined>;
  updateConsultationStatus(id: string, status: string, syncStatus?: string): Promise<TelemedicineConsultation | undefined>;
  getTelemedicineConsultations(): Promise<TelemedicineConsultation[]>;
  getTelemedicineConsultationById(id: string): Promise<TelemedicineConsultation | undefined>;

  // Medical Record methods
  getMedicalRecord(id: string): Promise<MedicalRecord | undefined>;
  getMedicalRecordByConsultation(consultationId: string): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByClient(clientId: string): Promise<MedicalRecord[]>;
  getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]>; // deprecated, use getMedicalRecordsByClient
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord | undefined>;
  searchMedicalRecords(query: string, patientId?: string): Promise<MedicalRecord[]>;
  getMedicalRecords(): Promise<MedicalRecord[]>;
  getMedicalRecordById(id: string): Promise<MedicalRecord | undefined>;

  // External Prescription methods
  getExternalPrescription(id: string): Promise<ExternalPrescription | undefined>;
  getExternalPrescriptionByExternalId(providerId: string, externalId: string): Promise<ExternalPrescription | undefined>;
  getExternalPrescriptionsByPatient(patientId: string): Promise<ExternalPrescription[]>;
  getExternalPrescriptionsByConsultation(consultationId: string): Promise<ExternalPrescription[]>;
  createExternalPrescription(prescription: InsertExternalPrescription): Promise<ExternalPrescription>;
  updateExternalPrescription(id: string, updates: Partial<ExternalPrescription>): Promise<ExternalPrescription | undefined>;
  convertExternalPrescriptionToProducts(id: string, matchedProducts: any): Promise<ExternalPrescription | undefined>;

  // Patient Pathology methods
  getPatientPathology(id: string): Promise<PatientPathology | undefined>;
  getPatientPathologiesByPatient(patientId: string): Promise<PatientPathology[]>;
  getPatientPathologiesByConsultation(consultationId: string): Promise<PatientPathology[]>;
  createPatientPathology(pathology: InsertPatientPathology): Promise<PatientPathology>;
  updatePatientPathology(id: string, updates: Partial<PatientPathology>): Promise<PatientPathology | undefined>;
  updatePathologyFromFormData(patientId: string, formData: any, source: string): Promise<PatientPathology>;
  searchPatientPathologies(query: string, patientId?: string): Promise<PatientPathology[]>;

  // Post Sale Followup methods
  getPostSaleFollowup(id: string): Promise<PostSaleFollowup | undefined>;
  getPostSaleFollowupsByOrder(orderId: string): Promise<PostSaleFollowup[]>;
  getPostSaleFollowupsByPatient(patientId: string): Promise<PostSaleFollowup[]>;
  getScheduledFollowups(date?: Date): Promise<PostSaleFollowup[]>;
  createPostSaleFollowup(followup: InsertPostSaleFollowup): Promise<PostSaleFollowup>;
  updatePostSaleFollowup(id: string, updates: Partial<PostSaleFollowup>): Promise<PostSaleFollowup | undefined>;
  updateFollowupStatus(id: string, status: string, completedAt?: Date): Promise<PostSaleFollowup | undefined>;
  scheduleNextFollowup(orderId: string, followupType: string, scheduledFor: Date): Promise<PostSaleFollowup>;

  // ANVISA Process methods
  getAnvisaProcess(id: string): Promise<AnvisaProcess | undefined>;
  getAnvisaProcessByProtocol(protocolNumber: string): Promise<AnvisaProcess | undefined>;
  getAnvisaProcessesByPatient(patientId: string): Promise<AnvisaProcess[]>;
  getAnvisaProcessesByOrder(orderId: string): Promise<AnvisaProcess[]>;
  createAnvisaProcess(process: InsertAnvisaProcess): Promise<AnvisaProcess>;
  updateAnvisaProcess(id: string, updates: Partial<AnvisaProcess>): Promise<AnvisaProcess | undefined>;
  updateAnvisaProcessStatus(id: string, status: string, statusUpdate?: Date): Promise<AnvisaProcess | undefined>;
  trackAnvisaProcessProgress(id: string, communication: any): Promise<AnvisaProcess | undefined>;
  getExpiringAnvisaProcesses(daysFromExpiry: number): Promise<AnvisaProcess[]>;

  // Lead Management methods
  getLeadByPatientId(patientId: string): Promise<Lead | undefined>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getLeads(filters?: { status?: string; consultantId?: string }): Promise<Lead[]>;
  createLead(lead: Omit<InsertLead, 'id'>): Promise<string>;
  updateLeadStatus(id: string, updates: { status?: string; notes?: string; estimatedValue?: number }): Promise<Lead | undefined>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined>;
  deleteLeadById(id: string): Promise<boolean>;
  createLeadStageHistory(history: Omit<InsertLeadStageHistory, 'id'>): Promise<LeadStageHistory>;
  getLeadStageHistory(leadId: string): Promise<LeadStageHistory[]>;
  getPatientFlags(patientId: string): Promise<ClientFlags | undefined>;
  updatePatientFlags(patientId: string, updates: Partial<ClientFlags>): Promise<ClientFlags | undefined>;
  getClientFlags(clientId: string): Promise<ClientFlags | undefined>;
  updateClientFlags(clientId: string, updates: Partial<ClientFlags>): Promise<ClientFlags | undefined>;

  // Lead Stage Management methods (admin only)
  getLeadStages(): Promise<LeadStage[]>;
  getLeadStage(id: string): Promise<LeadStage | undefined>;
  createLeadStage(stage: InsertLeadStage): Promise<LeadStage>;
  updateLeadStage(id: string, updates: Partial<InsertLeadStage>): Promise<LeadStage | undefined>;
  deleteLeadStage(id: string): Promise<boolean>;

  // Additional legacy methods (avoiding conflicts)
  getRecentPrescriptions(): Promise<Prescription[]>;
  getPrescriptionHistory(): Promise<Prescription[]>;
  getTreatmentHistory(): Promise<Prescription[]>;
  getPatients(): Promise<any[]>;

  // Checkout Configuration methods
  getCheckoutConfigs(): Promise<any[]>;
  getCheckoutConfig(id: string): Promise<any | undefined>;
  createCheckoutConfig(config: any): Promise<any>;
  updateCheckoutConfig(id: string, updates: Partial<any>): Promise<any | undefined>;
  
  // YAMPI Integration methods
  getYampiConfig(): Promise<any | undefined>;
  saveYampiConfig(config: any): Promise<any>;
  getYampiTransactions(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    // Get users with consultant commission rate for admin interface
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Enrich consultant users with commission rate
    const enrichedUsers = await Promise.all(
      allUsers.map(async (user: User) => {
        if (user.role === "consultant") {
          const consultant = await this.getConsultantByUserId(user.id);
          return {
            ...user,
            commissionRate: consultant?.commissionRate ? (parseFloat(consultant.commissionRate) * 100).toString() : "10"
          } as User & { commissionRate?: string };
        }
        return user;
      })
    );
    
    return enrichedUsers;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Hash password if it's being updated
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updates.password = hashedPassword;
    }
    
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return null;
    }
    
    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }
    
    return user;
  }

  // Patient methods (deprecated - compatibility shims for Client)
  async getPatient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getPatientByUserId(userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client || undefined;
  }

  async createPatient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  // Client methods (using compatibility shim)
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updatePatientAnvisaStatus(id: string, status: string, anvisaNumber?: string): Promise<Patient | undefined> {
    const updates: any = { anvisaStatus: status };
    if (anvisaNumber) updates.anvisaNumber = anvisaNumber;
    
    const [patient] = await db.update(patients)
      .set(updates)
      .where(eq(patients.id, id))
      .returning();
    return patient || undefined;
  }

  // Consultant methods
  async getConsultant(id: string): Promise<Consultant | undefined> {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.id, id));
    return consultant || undefined;
  }

  async getConsultantByUserId(userId: string): Promise<Consultant | undefined> {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.userId, userId));
    return consultant || undefined;
  }

  async createConsultant(insertConsultant: InsertConsultant): Promise<Consultant> {
    const [consultant] = await db.insert(consultants).values(insertConsultant).returning();
    return consultant;
  }

  async updateConsultant(id: string, updates: Partial<Consultant>): Promise<Consultant | undefined> {
    const [consultant] = await db.update(consultants)
      .set(updates)
      .where(eq(consultants.id, id))
      .returning();
    return consultant || undefined;
  }

  async getActiveConsultants(): Promise<Consultant[]> {
    const consultantRecords = await db.select().from(consultants).where(eq(consultants.isActive, true));
    
    // Enrich with user info and convert commission rate (decimal to percentage string)
    const enrichedConsultants = await Promise.all(
      consultantRecords.map(async (consultant) => {
        const user = await this.getUser(consultant.userId);
        return {
          ...consultant,
          fullName: user?.fullName || "Sem nome",
          // Convert decimal (0.10) to percentage string ("10")
          commissionRate: consultant.commissionRate ? (parseFloat(consultant.commissionRate) * 100).toString() : "10"
        };
      })
    );
    
    return enrichedConsultants as any;
  }

  // Doctor methods
  async getDoctor(id: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor || undefined;
  }

  async getDoctorByUserId(userId: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
    return doctor || undefined;
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const [doctor] = await db.insert(doctors).values(insertDoctor).returning();
    return doctor;
  }

  async getActiveDoctors(): Promise<Doctor[]> {
    return db.select().from(doctors).where(eq(doctors.isActive, true));
  }

  async updateDoctorWorkingHours(doctorId: string, workingHours: any): Promise<Doctor | undefined> {
    const [doctor] = await db.update(doctors)
      .set({ workingHours })
      .where(eq(doctors.id, doctorId))
      .returning();
    return doctor || undefined;
  }

  // Product methods
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products)
      .where(and(eq(products.category, category), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // Convert price from number to string for database storage
    const productData: typeof products.$inferInsert = {
      ...insertProduct,
      price: insertProduct.price.toString(),
      // Ensure activeSubstances is provided since it's required in the database
      activeSubstances: insertProduct.activeSubstances || []
    };
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    // Convert price from number to string for database storage if provided
    const updatesData: any = { ...updates };
    if (updates.price !== undefined) {
      updatesData.price = updates.price.toString();
    }
    
    const [product] = await db.update(products)
      .set(updatesData)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  // Prescription methods
  async getPrescription(id: string): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription || undefined;
  }

  async getPrescriptionsByClient(clientId: string): Promise<Prescription[]> {
    return db.select().from(prescriptions)
      .where(eq(prescriptions.clientId, clientId))
      .orderBy(desc(prescriptions.createdAt));
  }

  // Deprecated compatibility method
  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    return this.getPrescriptionsByClient(patientId);
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const [prescription] = await db.insert(prescriptions).values(insertPrescription).returning();
    return prescription;
  }

  async updatePrescription(id: string, updates: Partial<Prescription>): Promise<Prescription | undefined> {
    const [prescription] = await db.update(prescriptions)
      .set(updates)
      .where(eq(prescriptions.id, id))
      .returning();
    return prescription || undefined;
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByClient(clientId: string): Promise<Order[]> {
    return db.select().from(orders)
      .where(eq(orders.clientId, clientId))
      .orderBy(desc(orders.createdAt));
  }

  // Deprecated compatibility method
  async getOrdersByPatient(patientId: string): Promise<Order[]> {
    return this.getOrdersByClient(patientId);
  }

  async getOrdersByConsultant(consultantId: string): Promise<Order[]> {
    return db.select().from(orders)
      .where(eq(orders.consultantId, consultantId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Prescription methods for CRM
  async getPrescriptions(): Promise<Prescription[]> {
    return db.select().from(prescriptions)
      .orderBy(desc(prescriptions.createdAt));
  }

  // Product management methods (duplicates removed, using original methods)
  async deleteProduct(id: string): Promise<boolean> {
    // First, delete all stock movements for this product
    await db.delete(stockMovements).where(eq(stockMovements.productId, id));
    
    // Then delete the product
    const result = await db.delete(products)
      .where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Stock control methods implementation
  async getStockMovement(id: string): Promise<StockMovement | undefined> {
    const [movement] = await db.select().from(stockMovements).where(eq(stockMovements.id, id));
    return movement || undefined;
  }

  async getStockMovements(): Promise<StockMovement[]> {
    return db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
  }

  async getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
    return db.select().from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt));
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db.insert(stockMovements).values(movement).returning();
    return newMovement;
  }

  async updateProductStock(
    productId: string, 
    quantity: number, 
    type: 'in' | 'out' | 'adjustment', 
    reason: string, 
    userId?: string, 
    reference?: string, 
    notes?: string,
    movementDate?: string
  ): Promise<StockMovement> {
    // Get current stock
    const product = await this.getProduct(productId);
    if (!product) throw new Error('Product not found');

    const previousQuantity = product.stockQuantity || 0;
    const quantityChange = type === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
    const newQuantity = type === 'adjustment' ? quantity : previousQuantity + quantityChange;

    // Update product stock
    await db.update(products)
      .set({ 
        stockQuantity: newQuantity,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId));

    // Create movement record
    const movement: InsertStockMovement = {
      productId,
      type,
      quantity: type === 'adjustment' ? (newQuantity - previousQuantity) : quantityChange,
      previousQuantity,
      newQuantity,
      reason,
      reference,
      notes,
      userId,
      movementDate: movementDate ? new Date(movementDate) : new Date()
    };

    return this.createStockMovement(movement);
  }

  async getProductsWithLowStock(): Promise<Product[]> {
    return db.select().from(products)
      .where(
        and(
          eq(products.isActive, true),
          eq(products.isTracked, true),
          sql`${products.stockQuantity} <= ${products.minimumStock}`
        )
      )
      .orderBy(products.stockQuantity);
  }

  async getProductStockHistory(productId: string, limit = 50): Promise<StockMovement[]> {
    return db.select().from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit);
  }

  async getStockSummary(): Promise<{
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalStockValue: number;
  }> {
    const allProducts = await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.isTracked, true)));

    // Total de produtos = soma de TODAS as quantidades (total de frascos)
    const totalProducts = allProducts.reduce((sum, product) => {
      return sum + (product.stockQuantity || 0);
    }, 0);
    
    const lowStockProducts = allProducts.filter(p => 
      (p.stockQuantity || 0) <= (p.minimumStock || 0) && (p.stockQuantity || 0) > 0
    ).length;
    const outOfStockProducts = allProducts.filter(p => (p.stockQuantity || 0) === 0).length;
    
    // Valor total = soma de (quantidade * preço de venda)
    const totalStockValue = allProducts.reduce((sum, product) => {
      const stock = product.stockQuantity || 0;
      const price = parseFloat(product.price || '0'); // Usar preço de VENDA, não custo
      return sum + (stock * price);
    }, 0);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue
    };
  }

  async adjustProductStock(
    productId: string, 
    newQuantity: number, 
    reason: string, 
    userId?: string, 
    notes?: string
  ): Promise<StockMovement> {
    return this.updateProductStock(productId, newQuantity, 'adjustment', reason, userId, undefined, notes);
  }

  async bulkUpdateStock(updates: Array<{productId: string, quantity: number, reason: string}>): Promise<StockMovement[]> {
    const movements: StockMovement[] = [];
    
    for (const update of updates) {
      const movement = await this.updateProductStock(
        update.productId, 
        update.quantity, 
        'adjustment', 
        update.reason
      );
      movements.push(movement);
    }
    
    return movements;
  }

  // Tag methods implementation
  async getTag(id: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async getTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(desc(tags.createdAt));
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(insertTag).returning();
    return tag;
  }

  async updateTag(id: string, updates: Partial<Tag>): Promise<Tag | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    const [tag] = await db.update(tags)
      .set(updateData)
      .where(eq(tags.id, id))
      .returning();
    return tag || undefined;
  }

  async deleteTag(id: string): Promise<boolean> {
    const result = await db.delete(tags)
      .where(eq(tags.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Medical history methods implementation
  async getRecentPrescriptions(): Promise<Prescription[]> {
    return db.select()
      .from(prescriptions)
      .orderBy(desc(prescriptions.createdAt))
      .limit(10);
  }

  async getPrescriptionHistory(): Promise<Prescription[]> {
    return db.select()
      .from(prescriptions)
      .orderBy(desc(prescriptions.createdAt));
  }

  async getTreatmentHistory(): Promise<any[]> {
    // For now, return prescriptions as treatment history
    // In the future, this could be a separate treatments table
    return db.select().from(prescriptions)
      .orderBy(desc(prescriptions.createdAt));
  }

  async getPatients(): Promise<any[]> {
    // Join clients with users to get full information
    const result = await db.select({
      id: clients.id,
      userId: clients.userId,
      cpf: clients.cpf,
      anvisaStatus: clients.anvisaStatus,
      anvisaNumber: clients.anvisaNumber,
      healthCondition: clients.healthCondition,
      createdAt: clients.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone
      }
    })
    .from(clients)
    .leftJoin(users, eq(clients.userId, users.id))
    .orderBy(desc(clients.createdAt));

    return result;
  }

  // Educational content methods
  async getEduCourses(): Promise<EduCourse[]> {
    return db.select().from(eduCourses).where(eq(eduCourses.isActive, true)).orderBy(desc(eduCourses.createdAt));
  }

  async getEduCourse(id: string): Promise<EduCourse | undefined> {
    const [course] = await db.select().from(eduCourses).where(eq(eduCourses.id, id));
    return course || undefined;
  }

  async createEduCourse(course: InsertEduCourse): Promise<EduCourse> {
    const [newCourse] = await db.insert(eduCourses).values(course).returning();
    return newCourse;
  }

  async updateEduCourse(id: string, updates: Partial<EduCourse>): Promise<EduCourse | undefined> {
    const [course] = await db.update(eduCourses).set(updates).where(eq(eduCourses.id, id)).returning();
    return course || undefined;
  }

  async deleteEduCourse(id: string): Promise<boolean> {
    const result = await db.update(eduCourses).set({ isActive: false }).where(eq(eduCourses.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getEduLessonsByCourse(courseId: string): Promise<EduLesson[]> {
    return db.select().from(eduLessons)
      .where(and(eq(eduLessons.courseId, courseId), eq(eduLessons.isActive, true)))
      .orderBy(eduLessons.order);
  }

  async getEduLesson(id: string): Promise<EduLesson | undefined> {
    const [lesson] = await db.select().from(eduLessons).where(eq(eduLessons.id, id));
    return lesson || undefined;
  }

  async createEduLesson(lesson: InsertEduLesson): Promise<EduLesson> {
    const [newLesson] = await db.insert(eduLessons).values(lesson).returning();
    return newLesson;
  }

  async updateEduLesson(id: string, updates: Partial<EduLesson>): Promise<EduLesson | undefined> {
    const [lesson] = await db.update(eduLessons).set(updates).where(eq(eduLessons.id, id)).returning();
    return lesson || undefined;
  }

  async deleteEduLesson(id: string): Promise<boolean> {
    const result = await db.update(eduLessons).set({ isActive: false }).where(eq(eduLessons.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getEduArticles(): Promise<EduArticle[]> {
    return db.select().from(eduArticles).where(eq(eduArticles.isActive, true)).orderBy(desc(eduArticles.publishedAt));
  }

  async getEduArticle(id: string): Promise<EduArticle | undefined> {
    const [article] = await db.select().from(eduArticles).where(eq(eduArticles.id, id));
    return article || undefined;
  }

  async createEduArticle(article: InsertEduArticle): Promise<EduArticle> {
    const [newArticle] = await db.insert(eduArticles).values(article).returning();
    return newArticle;
  }

  async updateEduArticle(id: string, updates: Partial<EduArticle>): Promise<EduArticle | undefined> {
    const [article] = await db.update(eduArticles).set(updates).where(eq(eduArticles.id, id)).returning();
    return article || undefined;
  }

  async deleteEduArticle(id: string): Promise<boolean> {
    const result = await db.update(eduArticles).set({ isActive: false }).where(eq(eduArticles.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getEduGuidelines(): Promise<EduGuideline[]> {
    return db.select().from(eduGuidelines).where(eq(eduGuidelines.isActive, true)).orderBy(desc(eduGuidelines.createdAt));
  }

  async getEduGuideline(id: string): Promise<EduGuideline | undefined> {
    const [guideline] = await db.select().from(eduGuidelines).where(eq(eduGuidelines.id, id));
    return guideline || undefined;
  }

  async createEduGuideline(guideline: InsertEduGuideline): Promise<EduGuideline> {
    const [newGuideline] = await db.insert(eduGuidelines).values(guideline).returning();
    return newGuideline;
  }

  async updateEduGuideline(id: string, updates: Partial<EduGuideline>): Promise<EduGuideline | undefined> {
    const [guideline] = await db.update(eduGuidelines).set(updates).where(eq(eduGuidelines.id, id)).returning();
    return guideline || undefined;
  }

  async deleteEduGuideline(id: string): Promise<boolean> {
    const result = await db.update(eduGuidelines).set({ isActive: false }).where(eq(eduGuidelines.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserEduProgress(userId: string): Promise<EduProgress[]> {
    return db.select().from(eduProgress).where(eq(eduProgress.userId, userId));
  }

  async getCourseProgress(userId: string, courseId: string): Promise<EduProgress[]> {
    return db.select().from(eduProgress)
      .where(and(eq(eduProgress.userId, userId), eq(eduProgress.courseId, courseId)));
  }

  async createEduProgress(progress: InsertEduProgress): Promise<EduProgress> {
    const [newProgress] = await db.insert(eduProgress).values(progress).returning();
    return newProgress;
  }

  // Telemedicine Provider methods
  async getTelemedicineProvider(id: string): Promise<TelemedicineProvider | undefined> {
    const [provider] = await db.select().from(telemedicineProviders).where(eq(telemedicineProviders.id, id));
    return provider || undefined;
  }

  async getTelemedicineProviderByName(name: string): Promise<TelemedicineProvider | undefined> {
    const [provider] = await db.select().from(telemedicineProviders).where(eq(telemedicineProviders.name, name));
    return provider || undefined;
  }

  async getActiveTelemedicineProviders(): Promise<TelemedicineProvider[]> {
    return db.select().from(telemedicineProviders)
      .where(and(eq(telemedicineProviders.isActive, true), eq(telemedicineProviders.integrationStatus, 'active')))
      .orderBy(telemedicineProviders.name);
  }

  async createTelemedicineProvider(insertProvider: InsertTelemedicineProvider): Promise<TelemedicineProvider> {
    const [provider] = await db.insert(telemedicineProviders).values(insertProvider).returning();
    return provider;
  }

  async updateTelemedicineProvider(id: string, updates: Partial<TelemedicineProvider>): Promise<TelemedicineProvider | undefined> {
    const [provider] = await db.update(telemedicineProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(telemedicineProviders.id, id))
      .returning();
    return provider || undefined;
  }

  async updateProviderConfig(id: string, authConfig: any, credentialsConfig: any): Promise<TelemedicineProvider | undefined> {
    const [provider] = await db.update(telemedicineProviders)
      .set({ 
        authConfig, 
        credentialsConfig, 
        updatedAt: new Date(),
        lastSyncAt: new Date()
      })
      .where(eq(telemedicineProviders.id, id))
      .returning();
    return provider || undefined;
  }

  async deleteTelemedicineProvider(id: string): Promise<boolean> {
    const result = await db.delete(telemedicineProviders).where(eq(telemedicineProviders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Telemedicine Consultation methods
  async getTelemedicineConsultation(id: string): Promise<TelemedicineConsultation | undefined> {
    const [consultation] = await db.select().from(telemedicineConsultations).where(eq(telemedicineConsultations.id, id));
    return consultation || undefined;
  }

  async getTelemedicineConsultationByExternalId(providerId: string, externalId: string): Promise<TelemedicineConsultation | undefined> {
    const [consultation] = await db.select().from(telemedicineConsultations)
      .where(and(
        eq(telemedicineConsultations.providerId, providerId),
        eq(telemedicineConsultations.externalConsultationId, externalId)
      ));
    return consultation || undefined;
  }

  async getTelemedicineConsultationsByClient(clientId: string): Promise<TelemedicineConsultation[]> {
    return db.select().from(telemedicineConsultations)
      .where(eq(telemedicineConsultations.clientId, clientId))
      .orderBy(desc(telemedicineConsultations.scheduledAt));
  }

  // Deprecated compatibility method
  async getTelemedicineConsultationsByPatient(patientId: string): Promise<TelemedicineConsultation[]> {
    return this.getTelemedicineConsultationsByClient(patientId);
  }

  async getTelemedicineConsultationsByProvider(providerId: string): Promise<TelemedicineConsultation[]> {
    return db.select().from(telemedicineConsultations)
      .where(eq(telemedicineConsultations.providerId, providerId))
      .orderBy(desc(telemedicineConsultations.scheduledAt));
  }

  async createTelemedicineConsultation(insertConsultation: InsertTelemedicineConsultation): Promise<TelemedicineConsultation> {
    const [consultation] = await db.insert(telemedicineConsultations).values(insertConsultation).returning();
    return consultation;
  }

  async updateTelemedicineConsultation(id: string, updates: Partial<TelemedicineConsultation>): Promise<TelemedicineConsultation | undefined> {
    const [consultation] = await db.update(telemedicineConsultations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(telemedicineConsultations.id, id))
      .returning();
    return consultation || undefined;
  }

  async updateConsultationStatus(id: string, status: string, syncStatus?: string): Promise<TelemedicineConsultation | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (syncStatus) updateData.syncStatus = syncStatus;
    if (syncStatus === 'synced') updateData.lastSyncAt = new Date();

    const [consultation] = await db.update(telemedicineConsultations)
      .set(updateData)
      .where(eq(telemedicineConsultations.id, id))
      .returning();
    return consultation || undefined;
  }

  // Medical Record methods
  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
    return record || undefined;
  }

  async getMedicalRecordByConsultation(consultationId: string): Promise<MedicalRecord | undefined> {
    const [record] = await db.select().from(medicalRecords)
      .where(eq(medicalRecords.telemedicineConsultationId, consultationId));
    return record || undefined;
  }

  async getMedicalRecordsByClient(clientId: string): Promise<MedicalRecord[]> {
    return db.select().from(medicalRecords)
      .where(eq(medicalRecords.clientId, clientId))
      .orderBy(desc(medicalRecords.createdAt));
  }

  // Deprecated compatibility method
  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    return this.getMedicalRecordsByClient(patientId);
  }

  async createMedicalRecord(insertRecord: InsertMedicalRecord): Promise<MedicalRecord> {
    // Ensure anamnesis is properly typed as unknown for database insertion
    const recordData = {
      ...insertRecord,
      anamnesis: insertRecord.anamnesis as unknown,
      completenessScore: insertRecord.completenessScore?.toString() || "0"
    };
    const [record] = await db.insert(medicalRecords).values(recordData).returning();
    return record;
  }

  async updateMedicalRecord(id: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord | undefined> {
    const [record] = await db.update(medicalRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(medicalRecords.id, id))
      .returning();
    return record || undefined;
  }

  async searchMedicalRecords(query: string, patientId?: string): Promise<MedicalRecord[]> {
    let conditions = sql`to_tsvector('english', coalesce(${medicalRecords.anamnesis}::text, '')) @@ plainto_tsquery('english', ${query})`;
    
    if (patientId) {
      conditions = and(conditions, eq(medicalRecords.patientId, patientId)) as any;
    }

    return db.select().from(medicalRecords)
      .where(conditions)
      .orderBy(desc(medicalRecords.createdAt));
  }

  // External Prescription methods
  async getExternalPrescription(id: string): Promise<ExternalPrescription | undefined> {
    const [prescription] = await db.select().from(externalPrescriptions).where(eq(externalPrescriptions.id, id));
    return prescription || undefined;
  }

  async getExternalPrescriptionByExternalId(providerId: string, externalId: string): Promise<ExternalPrescription | undefined> {
    const [prescription] = await db.select().from(externalPrescriptions)
      .where(and(
        eq(externalPrescriptions.providerId, providerId),
        eq(externalPrescriptions.externalPrescriptionId, externalId)
      ));
    return prescription || undefined;
  }

  async getExternalPrescriptionsByPatient(patientId: string): Promise<ExternalPrescription[]> {
    // Join with telemedicine consultations to get patient ID
    return db.select().from(externalPrescriptions)
      .innerJoin(telemedicineConsultations, eq(externalPrescriptions.telemedicineConsultationId, telemedicineConsultations.id))
      .where(eq(telemedicineConsultations.patientId, patientId))
      .orderBy(desc(externalPrescriptions.createdAt))
      .then(results => results.map(r => r.external_prescriptions));
  }

  async getExternalPrescriptionsByConsultation(consultationId: string): Promise<ExternalPrescription[]> {
    return db.select().from(externalPrescriptions)
      .where(eq(externalPrescriptions.telemedicineConsultationId, consultationId))
      .orderBy(desc(externalPrescriptions.createdAt));
  }

  async createExternalPrescription(insertPrescription: InsertExternalPrescription): Promise<ExternalPrescription> {
    const [prescription] = await db.insert(externalPrescriptions).values(insertPrescription).returning();
    return prescription;
  }

  async updateExternalPrescription(id: string, updates: Partial<ExternalPrescription>): Promise<ExternalPrescription | undefined> {
    const [prescription] = await db.update(externalPrescriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalPrescriptions.id, id))
      .returning();
    return prescription || undefined;
  }

  async convertExternalPrescriptionToProducts(id: string, matchedProducts: any): Promise<ExternalPrescription | undefined> {
    const [prescription] = await db.update(externalPrescriptions)
      .set({
        matchedProducts,
        conversionStatus: 'converted',
        conversionNotes: `Converted automatically at ${new Date().toISOString()}`,
        updatedAt: new Date()
      })
      .where(eq(externalPrescriptions.id, id))
      .returning();
    return prescription || undefined;
  }

  // Patient Pathology methods
  async getPatientPathology(id: string): Promise<PatientPathology | undefined> {
    const [pathology] = await db.select().from(clientPathologies).where(eq(clientPathologies.id, id));
    return pathology || undefined;
  }

  async getPatientPathologiesByPatient(patientId: string): Promise<PatientPathology[]> {
    return db.select().from(clientPathologies)
      .where(eq(clientPathologies.clientId, patientId))
      .orderBy(desc(clientPathologies.createdAt));
  }

  async getPatientPathologiesByConsultation(consultationId: string): Promise<PatientPathology[]> {
    return db.select().from(clientPathologies)
      .where(eq(clientPathologies.telemedicineConsultationId, consultationId))
      .orderBy(desc(clientPathologies.createdAt));
  }

  async createPatientPathology(insertPathology: InsertPatientPathology): Promise<PatientPathology> {
    // Convert numeric fields to strings for database storage
    const pathologyData = {
      ...insertPathology,
      currentSymptoms: insertPathology.currentSymptoms as unknown,
      qualityOfLifeScore: insertPathology.qualityOfLifeScore?.toString() || null,
      confidenceLevel: insertPathology.confidenceLevel?.toString() || null
    };
    const [pathology] = await db.insert(clientPathologies).values(pathologyData).returning();
    return pathology;
  }

  async updatePatientPathology(id: string, updates: Partial<PatientPathology>): Promise<PatientPathology | undefined> {
    const [pathology] = await db.update(clientPathologies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientPathologies.id, id))
      .returning();
    return pathology || undefined;
  }

  async updatePathologyFromFormData(patientId: string, formData: any, source: string): Promise<PatientPathology> {
    // Extract pathology data from form data
    const pathologyData = {
      patientId,
      primaryDiagnosis: formData.primaryDiagnosis || 'Pending assessment',
      currentSymptoms: formData.symptoms || formData.pathologies || [] as unknown,
      severity: formData.severity || 'moderate',
      dataSource: source,
      painScale: formData.painScale ? parseInt(formData.painScale) : undefined,
      qualityOfLifeScore: formData.qualityOfLife ? parseFloat(formData.qualityOfLife).toString() : undefined,
      cannabisEligibility: {
        eligible: true,
        reasons: ['Patient reported symptoms'],
        contraindications: []
      } as unknown,
      confidenceLevel: "0.8"
    };

    // Check if pathology already exists for this patient
    const existing = await db.select().from(clientPathologies)
      .where(and(
        eq(clientPathologies.patientId, patientId),
        eq(clientPathologies.dataSource, source)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(clientPathologies)
        .set({ ...pathologyData, updatedAt: new Date() })
        .where(eq(clientPathologies.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(clientPathologies).values(pathologyData).returning();
      return created;
    }
  }

  async searchPatientPathologies(query: string, patientId?: string): Promise<PatientPathology[]> {
    let conditions = sql`to_tsvector('english', coalesce(${clientPathologies.primaryDiagnosis}, '') || ' ' || coalesce(${clientPathologies.currentSymptoms}::text, '')) @@ plainto_tsquery('english', ${query})`;
    
    if (patientId) {
      conditions = and(conditions, eq(clientPathologies.patientId, patientId)) as any;
    }

    return db.select().from(clientPathologies)
      .where(conditions)
      .orderBy(desc(clientPathologies.createdAt));
  }

  // Post Sale Followup methods
  async getPostSaleFollowup(id: string): Promise<PostSaleFollowup | undefined> {
    const [followup] = await db.select().from(postSaleFollowups).where(eq(postSaleFollowups.id, id));
    return followup || undefined;
  }

  async getPostSaleFollowupsByOrder(orderId: string): Promise<PostSaleFollowup[]> {
    return db.select().from(postSaleFollowups)
      .where(eq(postSaleFollowups.orderId, orderId))
      .orderBy(desc(postSaleFollowups.scheduledFor));
  }

  async getPostSaleFollowupsByPatient(patientId: string): Promise<PostSaleFollowup[]> {
    return db.select().from(postSaleFollowups)
      .where(eq(postSaleFollowups.patientId, patientId))
      .orderBy(desc(postSaleFollowups.scheduledFor));
  }

  async getScheduledFollowups(date?: Date): Promise<PostSaleFollowup[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return db.select().from(postSaleFollowups)
      .where(and(
        eq(postSaleFollowups.status, 'scheduled'),
        and(
          sql`${postSaleFollowups.scheduledFor} >= ${startOfDay.toISOString()}`,
          sql`${postSaleFollowups.scheduledFor} <= ${endOfDay.toISOString()}`
        )
      ))
      .orderBy(postSaleFollowups.scheduledFor);
  }

  async createPostSaleFollowup(insertFollowup: InsertPostSaleFollowup): Promise<PostSaleFollowup> {
    const [followup] = await db.insert(postSaleFollowups).values(insertFollowup).returning();
    return followup;
  }

  async updatePostSaleFollowup(id: string, updates: Partial<PostSaleFollowup>): Promise<PostSaleFollowup | undefined> {
    const [followup] = await db.update(postSaleFollowups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(postSaleFollowups.id, id))
      .returning();
    return followup || undefined;
  }

  async updateFollowupStatus(id: string, status: string, completedAt?: Date): Promise<PostSaleFollowup | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date()
    };
    
    if (completedAt && status === 'completed') {
      updateData.completedAt = completedAt;
      updateData.responseReceived = true;
    }

    const [followup] = await db.update(postSaleFollowups)
      .set(updateData)
      .where(eq(postSaleFollowups.id, id))
      .returning();
    return followup || undefined;
  }

  async scheduleNextFollowup(orderId: string, followupType: string, scheduledFor: Date): Promise<PostSaleFollowup> {
    // Get order and patient info
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) throw new Error('Order not found');

    const followupData: InsertPostSaleFollowup = {
      orderId,
      patientId: order.patientId,
      consultantId: order.consultantId,
      followupType,
      scheduledFor,
      status: 'scheduled',
      contactMethod: 'whatsapp',
      contactAttempts: 0
    };

    const [followup] = await db.insert(postSaleFollowups).values(followupData).returning();
    return followup;
  }

  // ANVISA Process methods
  async getAnvisaProcess(id: string): Promise<AnvisaProcess | undefined> {
    const [process] = await db.select().from(anvisaProcesses).where(eq(anvisaProcesses.id, id));
    return process || undefined;
  }

  async getAnvisaProcessByProtocol(protocolNumber: string): Promise<AnvisaProcess | undefined> {
    const [process] = await db.select().from(anvisaProcesses)
      .where(eq(anvisaProcesses.anvisaProtocolNumber, protocolNumber));
    return process || undefined;
  }

  async getAnvisaProcessesByPatient(patientId: string): Promise<AnvisaProcess[]> {
    return db.select().from(anvisaProcesses)
      .where(eq(anvisaProcesses.patientId, patientId))
      .orderBy(desc(anvisaProcesses.createdAt));
  }

  async getAnvisaProcessesByOrder(orderId: string): Promise<AnvisaProcess[]> {
    return db.select().from(anvisaProcesses)
      .where(eq(anvisaProcesses.orderId, orderId))
      .orderBy(desc(anvisaProcesses.createdAt));
  }

  async createAnvisaProcess(insertProcess: InsertAnvisaProcess): Promise<AnvisaProcess> {
    const [process] = await db.insert(anvisaProcesses).values(insertProcess).returning();
    return process;
  }

  async updateAnvisaProcess(id: string, updates: Partial<AnvisaProcess>): Promise<AnvisaProcess | undefined> {
    const [process] = await db.update(anvisaProcesses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(anvisaProcesses.id, id))
      .returning();
    return process || undefined;
  }

  async updateAnvisaProcessStatus(id: string, status: string, statusUpdate?: Date): Promise<AnvisaProcess | undefined> {
    const updateData: any = {
      status,
      lastStatusUpdate: statusUpdate || new Date(),
      updatedAt: new Date()
    };

    // Set decision date if approved or rejected
    if (status === 'approved' || status === 'rejected') {
      updateData.actualDecisionDate = statusUpdate || new Date();
    }

    const [process] = await db.update(anvisaProcesses)
      .set(updateData)
      .where(eq(anvisaProcesses.id, id))
      .returning();
    return process || undefined;
  }

  async trackAnvisaProcessProgress(id: string, communication: any): Promise<AnvisaProcess | undefined> {
    // Get current process
    const current = await this.getAnvisaProcess(id);
    if (!current) return undefined;

    // Update communications log
    const currentCommunications = (current.anvisaCommunications as any[]) || [];
    currentCommunications.push({
      ...communication,
      date: new Date().toISOString()
    });

    const [process] = await db.update(anvisaProcesses)
      .set({
        anvisaCommunications: currentCommunications,
        lastAnvisaResponse: communication.type === 'received' ? communication : current.lastAnvisaResponse,
        lastStatusUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(anvisaProcesses.id, id))
      .returning();
    return process || undefined;
  }

  async getExpiringAnvisaProcesses(daysFromExpiry: number): Promise<AnvisaProcess[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysFromExpiry);

    return db.select().from(anvisaProcesses)
      .where(and(
        eq(anvisaProcesses.status, 'approved'),
        sql`${anvisaProcesses.validUntil} <= ${expiryDate.toISOString()}`,
        eq(anvisaProcesses.renewalNotificationSent, false)
      ))
      .orderBy(anvisaProcesses.validUntil);
  }

  // Content management methods
  async getEducationalContentBySource(source: string): Promise<any[]> {
    const content = await db
      .select()
      .from(educationalContent)
      .where(eq(educationalContent.source, source))
      .orderBy(desc(educationalContent.publishedAt));
    
    return content.map(c => ({
      ...c,
      isActive: c.status === 'active',
      featured: c.priority === 'high'
    }));
  }

  async getEducationalContentById(id: string): Promise<any | undefined> {
    const [content] = await db
      .select()
      .from(educationalContent)
      .where(eq(educationalContent.id, id));
    
    if (!content) return undefined;
    
    return {
      ...content,
      isActive: content.status === 'active',
      featured: content.priority === 'high'
    };
  }

  async createEducationalContent(content: any): Promise<any> {
    const now = new Date();
    const [created] = await db.insert(educationalContent).values({
      title: content.title,
      content: content.content || content.description || '',
      contentType: content.contentType || 'article',
      source: content.source || 'manual',
      category: content.category || 'basics',
      specialty: content.specialty,
      difficulty: content.difficulty || 'intermediate',
      duration: content.duration || 15,
      imageUrl: content.imageUrl,
      videoUrl: content.videoUrl,
      tags: content.tags || [],
      metadata: content.metadata || {},
      targetAudience: content.targetAudience || 'patient',
      publishedAt: content.publishedAt || now,
      status: content.isActive ? 'active' : 'inactive',
      priority: content.featured ? 'high' : 'medium',
      viewCount: 0,
      rating: 0
    }).returning();
    
    return created;
  }

  async updateEducationalContent(id: string, updates: any): Promise<any> {
    const [updated] = await db
      .update(educationalContent)
      .set({
        ...updates,
        status: updates.isActive ? 'active' : updates.isActive === false ? 'inactive' : undefined,
        priority: updates.featured ? 'high' : updates.featured === false ? 'medium' : undefined,
        updatedAt: new Date()
      })
      .where(eq(educationalContent.id, id))
      .returning();
    
    return updated;
  }

  async deleteEducationalContent(id: string): Promise<boolean> {
    const deleted = await db
      .delete(educationalContent)
      .where(eq(educationalContent.id, id))
      .returning();
    
    return deleted.length > 0;
  }

  async getMedicalNewsBySource(source: string): Promise<any[]> {
    const news = await db
      .select()
      .from(medicalNews)
      .where(eq(medicalNews.source, source))
      .orderBy(desc(medicalNews.publishedAt));
    
    return news;
  }

  async createMedicalNews(news: any): Promise<any> {
    const [created] = await db
      .insert(medicalNews)
      .values({
        ...news,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return created;
  }

  async getScientificArticlesBySource(source: string): Promise<any[]> {
    // scientific_articles table doesn't have a 'source' column
    // Return all articles regardless of source parameter for now
    const articles = await db
      .select()
      .from(scientificArticles)
      .orderBy(desc(scientificArticles.publishedAt));
    
    return articles;
  }

  async createScientificArticle(article: any): Promise<any> {
    const [created] = await db
      .insert(scientificArticles)
      .values({
        ...article,
        createdAt: new Date()
      })
      .returning();
    
    return created;
  }

  async getTelemedicineConsultations(): Promise<TelemedicineConsultation[]> {
    // Placeholder implementation - return empty array for now
    return db.select().from(telemedicineConsultations).orderBy(desc(telemedicineConsultations.createdAt));
  }

  async getTelemedicineConsultationById(id: string): Promise<TelemedicineConsultation | undefined> {
    // This is actually just an alias for the existing method
    return this.getTelemedicineConsultation(id);
  }

  async getMedicalRecords(): Promise<MedicalRecord[]> {
    // Placeholder implementation - return all medical records
    return db.select().from(medicalRecords).orderBy(desc(medicalRecords.createdAt));
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord | undefined> {
    // This is actually just an alias for the existing method
    return this.getMedicalRecord(id);
  }

  // Lead Management methods implementation
  async getLeadByClientId(clientId: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.clientId, clientId));
    return lead || undefined;
  }

  // Deprecated compatibility shim
  async getLeadByPatientId(patientId: string): Promise<Lead | undefined> {
    return this.getLeadByClientId(patientId);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeads(filters?: { status?: string; consultantId?: string }): Promise<Lead[]> {
    const conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    
    if (filters?.consultantId) {
      conditions.push(eq(leads.consultantId, filters.consultantId));
    }
    
    // Build the query with joins to get patient information
    const query = db.select({
      id: leads.id,
      clientId: leads.clientId,
      consultantId: leads.consultantId,
      assignedConsultantId: leads.assignedConsultantId,
      assignedAt: leads.assignedAt,
      status: leads.status,
      priority: leads.priority,
      notes: leads.notes,
      source: leads.source,
      estimatedValue: leads.estimatedValue,
      company: leads.company,
      jobTitle: leads.jobTitle,
      leadScore: leads.leadScore,
      tags: leads.tags,
      lastInteraction: leads.lastInteraction,
      nextFollowUp: leads.nextFollowUp,
      productsInterest: leads.productsInterest,
      budget: leads.budget,
      expectedCloseDate: leads.expectedCloseDate,
      conversionProbability: leads.conversionProbability,
      address: leads.address,
      city: leads.city,
      state: leads.state,
      zipCode: leads.zipCode,
      linkedin: leads.linkedin,
      instagram: leads.instagram,
      referralSource: leads.referralSource,
      lostReason: leads.lostReason,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      patientName: users.fullName,
      patientEmail: users.email,
      patientPhone: users.phone,
    })
    .from(leads)
    .leftJoin(clients, eq(leads.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))
    .orderBy(desc(leads.createdAt));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    } else {
      return await query;
    }
  }

  async createLead(lead: Omit<InsertLead, 'id'>): Promise<string> {
    const [newLead] = await db.insert(leads).values(lead).returning({ id: leads.id });
    return newLead.id;
  }

  async updateLeadStatus(id: string, updates: { status?: string; notes?: string; estimatedValue?: number }): Promise<Lead | undefined> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    // Convert estimatedValue to string if provided (decimal field in DB)
    if (updateData.estimatedValue !== undefined) {
      updateData.estimatedValue = updateData.estimatedValue.toString();
    }
    
    const [updatedLead] = await db.update(leads)
      .set(updateData)
      .where(eq(leads.id, id))
      .returning();
    return updatedLead || undefined;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    // Convert decimal fields to string
    if (updateData.estimatedValue !== undefined) {
      updateData.estimatedValue = updateData.estimatedValue.toString();
    }
    if (updateData.budget !== undefined) {
      updateData.budget = updateData.budget.toString();
    }
    
    const [updatedLead] = await db.update(leads)
      .set(updateData)
      .where(eq(leads.id, id))
      .returning();
    return updatedLead || undefined;
  }

  async deleteLeadById(id: string): Promise<boolean> {
    try {
      // First delete all lead_stage_history entries (cascade)
      await db.delete(leadStageHistory).where(eq(leadStageHistory.leadId, id));
      
      // Then delete the lead
      const result = await db.delete(leads).where(eq(leads.id, id));
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }

  async createLeadStageHistory(history: Omit<InsertLeadStageHistory, 'id'>): Promise<LeadStageHistory> {
    const [newHistory] = await db.insert(leadStageHistory).values(history).returning();
    return newHistory;
  }

  async getLeadStageHistory(leadId: string): Promise<LeadStageHistory[]> {
    const history = await db.select()
      .from(leadStageHistory)
      .where(eq(leadStageHistory.leadId, leadId))
      .orderBy(desc(leadStageHistory.createdAt));
    return history;
  }

  async getPatientFlags(patientId: string): Promise<ClientFlags | undefined> {
    const [flags] = await db.select().from(clientFlags).where(eq(clientFlags.clientId, patientId));
    return flags || undefined;
  }

  async getClientFlags(clientId: string): Promise<ClientFlags | undefined> {
    const [flags] = await db.select().from(clientFlags).where(eq(clientFlags.clientId, clientId));
    return flags || undefined;
  }

  async updatePatientFlags(patientId: string, updates: Partial<ClientFlags>): Promise<ClientFlags | undefined> {
    // First try to update existing flags
    const [existingFlags] = await db.select().from(clientFlags).where(eq(clientFlags.clientId, patientId));
    
    if (existingFlags) {
      const [updatedFlags] = await db.update(clientFlags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(clientFlags.clientId, patientId))
        .returning();
      return updatedFlags || undefined;
    } else {
      // Create new flags if they don't exist
      const [newFlags] = await db.insert(clientFlags)
        .values({ clientId: patientId, ...updates })
        .returning();
      return newFlags;
    }
  }

  async updateClientFlags(clientId: string, updates: Partial<ClientFlags>): Promise<ClientFlags | undefined> {
    // First try to update existing flags
    const [existingFlags] = await db.select().from(clientFlags).where(eq(clientFlags.clientId, clientId));
    
    if (existingFlags) {
      const [updatedFlags] = await db.update(clientFlags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(clientFlags.clientId, clientId))
        .returning();
      return updatedFlags || undefined;
    } else {
      // Create new flags if they don't exist
      const [newFlags] = await db.insert(clientFlags)
        .values({ clientId, ...updates })
        .returning();
      return newFlags;
    }
  }

  // Lead Stage Management methods (admin only)
  async getLeadStages(): Promise<LeadStage[]> {
    const stages = await db.select().from(leadStages)
      .where(eq(leadStages.isActive, true))
      .orderBy(leadStages.position);
    return stages;
  }

  async getLeadStage(id: string): Promise<LeadStage | undefined> {
    const [stage] = await db.select().from(leadStages).where(eq(leadStages.id, id));
    return stage || undefined;
  }

  async createLeadStage(stage: InsertLeadStage): Promise<LeadStage> {
    const [newStage] = await db.insert(leadStages).values(stage).returning();
    return newStage;
  }

  async updateLeadStage(id: string, updates: Partial<InsertLeadStage>): Promise<LeadStage | undefined> {
    const [updatedStage] = await db.update(leadStages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadStages.id, id))
      .returning();
    return updatedStage || undefined;
  }

  async deleteLeadStage(id: string): Promise<boolean> {
    // Soft delete by setting isActive to false
    const [deletedStage] = await db.update(leadStages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(leadStages.id, id))
      .returning();
    return !!deletedStage;
  }

  // Checkout Configuration methods
  async getCheckoutConfigs(): Promise<any[]> {
    return db.select().from(checkoutConfig).orderBy(desc(checkoutConfig.createdAt));
  }

  async getCheckoutConfig(id: string): Promise<any | undefined> {
    const [config] = await db.select().from(checkoutConfig).where(eq(checkoutConfig.id, id));
    return config || undefined;
  }

  async createCheckoutConfig(config: any): Promise<any> {
    const [newConfig] = await db.insert(checkoutConfig).values(config).returning();
    return newConfig;
  }

  async updateCheckoutConfig(id: string, updates: Partial<any>): Promise<any | undefined> {
    const [updatedConfig] = await db.update(checkoutConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(checkoutConfig.id, id))
      .returning();
    return updatedConfig || undefined;
  }

  // YAMPI Integration methods
  async getYampiConfig(): Promise<any | undefined> {
    const [config] = await db.select().from(yampiConfig).limit(1);
    return config || undefined;
  }

  async saveYampiConfig(configData: any): Promise<any> {
    // Check if config already exists
    const existing = await this.getYampiConfig();
    
    if (existing) {
      // Update existing config
      const [updated] = await db.update(yampiConfig)
        .set({ ...configData, updatedAt: new Date() })
        .where(eq(yampiConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new config
      const [newConfig] = await db.insert(yampiConfig).values(configData).returning();
      return newConfig;
    }
  }

  async getYampiTransactions(): Promise<any[]> {
    return db.select().from(yampiTransactions).orderBy(desc(yampiTransactions.createdAt));
  }

}

export const storage = new DatabaseStorage();

// Re-export db and schema tables for services that need direct database access
export { db } from './db';
export { 
  users, clients, consultants, doctors, products, prescriptions, orders, tags,
  eduTags, eduCourses, eduLessons, eduArticles, eduGuidelines, eduProgress,
  telemedicineProviders, telemedicineConsultations, medicalRecords, externalPrescriptions, 
  clientPathologies, postSaleFollowups, anvisaProcesses,
  leads, leadStages, leadStageHistory, clientFlags, stockMovements, checkoutConfig,
  yampiConfig, yampiTransactions
} from '@shared/schema';
