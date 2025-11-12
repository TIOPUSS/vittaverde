export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  activeSubstances?: Array<{substance: string; concentration: string}>;
  concentration?: string;
  volume?: string;
  manufacturer?: string;
  origin?: string;
  anvisaRequired?: boolean;
  prescriptionRequired?: boolean;
  price: string;
  imageUrl?: string;
  indications?: string[];
  contraindications?: string;
  sideEffects?: string;
  dosageInstructions?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  createdAt?: string;
}

export interface Patient {
  id: string;
  userId: string;
  cpf: string;
  birthDate?: string;
  address?: any;
  healthCondition?: string;
  consultantId?: string;
  anvisaStatus?: string;
  anvisaNumber?: string;
  createdAt?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  status: string;
  prescriptionId?: string;
  notes?: string;
  createdAt?: string;
}

export interface Order {
  id: string;
  patientId: string;
  consultantId?: string;
  prescriptionId: string;
  items: any[];
  totalAmount: string;
  status: string;
  paymentMethod?: string;
  trackingNumber?: string;
  createdAt?: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  products: any[];
  validUntil: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Lead {
  id: string;
  patientId: string;
  clientId: string;
  consultantId?: string;
  assignedConsultantId?: string;
  assignedAt?: string;
  status: "novo" | "contato_inicial" | "aguardando_receita" | "receita_recebida" | "receita_validada" | "produtos_liberados" | "finalizado";
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string;
  source: string;
  estimatedValue?: string;
  prescriptionUrl?: string;
  
  // CRM Enhanced Fields
  company?: string;
  jobTitle?: string;
  leadScore?: number;
  tags?: string[];
  lastInteraction?: string;
  nextFollowUp?: string;
  productsInterest?: string[];
  budget?: string;
  expectedCloseDate?: string;
  conversionProbability?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  linkedin?: string;
  instagram?: string;
  referralSource?: string;
  lostReason?: string;
  
  createdAt: string;
  updatedAt: string;
  // Additional fields that might be populated via joins
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  consultantName?: string;
}
