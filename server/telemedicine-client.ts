import { storage } from "./storage";
import type { 
  TelemedicineProvider, 
  InsertTelemedicineConsultation,
  InsertExternalPrescription,
  InsertMedicalRecord 
} from "@shared/schema";

// Types for external API responses
interface ExternalConsultation {
  id: string;
  patientData: any;
  doctorData: any;
  consultationType: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  diagnosis?: string;
  [key: string]: any;
}

interface ExternalPrescription {
  id: string;
  consultationId: string;
  medications: Array<{
    name: string;
    activeSubstance?: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
  }>;
  prescribingDoctor: any;
  validUntil?: string;
  [key: string]: any;
}

interface ExternalMedicalRecord {
  id: string;
  patientId: string;
  consultationId?: string;
  anamnesis: any;
  vitalSigns?: any;
  physicalExam?: any;
  medicalHistory?: any;
  [key: string]: any;
}

interface SyncResult {
  success: boolean;
  processed: number;
  errors: Array<{
    type: string;
    message: string;
    data?: any;
  }>;
  lastSyncTimestamp?: Date;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
  page?: number;
}

interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  params?: Record<string, any>;
  body?: any;
  timeout?: number;
  retries?: number;
}

class TelemedicineApiClient {
  private provider: TelemedicineProvider;
  private baseUrl: string;
  private authHeaders: Record<string, string> = {};
  private retryDelays = [1000, 3000, 5000, 10000]; // Progressive backoff in ms

  constructor(provider: TelemedicineProvider) {
    this.provider = provider;
    this.baseUrl = provider.apiUrl || '';
    this.setupAuthentication();
  }

  private setupAuthentication() {
    const authConfig = this.provider.authConfig as any;
    const credentials = this.provider.credentialsConfig as any;

    if (!authConfig || !credentials) {
      console.warn(`[TelemedicineClient] Missing auth config for provider ${this.provider.name}`);
      return;
    }

    switch (authConfig.type) {
      case 'api_key':
        this.authHeaders['X-API-Key'] = credentials.apiKey;
        break;
      case 'bearer':
        this.authHeaders['Authorization'] = `Bearer ${credentials.token}`;
        break;
      case 'basic':
        const basicAuth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        this.authHeaders['Authorization'] = `Basic ${basicAuth}`;
        break;
      case 'oauth':
        // OAuth handling would go here - for now just use stored token
        if (credentials.accessToken) {
          this.authHeaders['Authorization'] = `Bearer ${credentials.accessToken}`;
        }
        break;
      default:
        console.warn(`[TelemedicineClient] Unsupported auth type: ${authConfig.type}`);
    }
  }

  private async makeRequest(options: ApiRequestOptions): Promise<any> {
    const { method, endpoint, params, body, timeout = 30000, retries = 3 } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = new URL(endpoint, this.baseUrl);
        
        // Add query parameters
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.append(key, String(value));
            }
          });
        }

        const requestConfig: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'VittaVerde-TelemedicineClient/1.0',
            ...this.authHeaders,
          },
          signal: AbortSignal.timeout(timeout),
        };

        if (body && (method === 'POST' || method === 'PUT')) {
          requestConfig.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), requestConfig);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();
        
        // Log successful request
        this.logRequest(method, endpoint, true, attempt);
        
        return responseData;
        
      } catch (error) {
        lastError = error as Error;
        
        this.logRequest(method, endpoint, false, attempt, lastError.message);
        
        // Don't retry on authentication errors or client errors (4xx)
        if (lastError.message.includes('401') || lastError.message.includes('403') || 
            lastError.message.includes('400') || lastError.message.includes('404')) {
          break;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < retries) {
          const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Unknown error occurred');
  }

  private logRequest(method: string, endpoint: string, success: boolean, attempt: number, error?: string) {
    const logData = {
      timestamp: new Date().toISOString(),
      provider: this.provider.name,
      method,
      endpoint,
      success,
      attempt: attempt + 1,
      error: error || null
    };
    
    const prefix = success ? '[TELEMEDICINE-CLIENT-SUCCESS]' : '[TELEMEDICINE-CLIENT-ERROR]';
    console.log(`${prefix}`, JSON.stringify(logData, null, 2));
  }

  // Fetch consultations with pagination support
  async fetchConsultations(options: {
    since?: Date;
    until?: Date;
    pagination?: PaginationParams;
    statuses?: string[];
  } = {}): Promise<{ data: ExternalConsultation[]; hasMore: boolean; nextCursor?: string }> {
    const { since, until, pagination = {}, statuses = [] } = options;
    
    const params: Record<string, any> = {
      limit: pagination.limit || 100,
      ...pagination
    };
    
    if (since) params.since = since.toISOString();
    if (until) params.until = until.toISOString();
    if (statuses.length > 0) params.status = statuses.join(',');
    
    const response = await this.makeRequest({
      method: 'GET',
      endpoint: '/consultations',
      params
    });
    
    return {
      data: response.data || response.consultations || [],
      hasMore: response.hasMore || response.has_more || false,
      nextCursor: response.nextCursor || response.next_cursor
    };
  }

  // Fetch prescriptions with pagination
  async fetchPrescriptions(options: {
    consultationIds?: string[];
    since?: Date;
    pagination?: PaginationParams;
  } = {}): Promise<{ data: ExternalPrescription[]; hasMore: boolean; nextCursor?: string }> {
    const { consultationIds = [], since, pagination = {} } = options;
    
    const params: Record<string, any> = {
      limit: pagination.limit || 100,
      ...pagination
    };
    
    if (since) params.since = since.toISOString();
    if (consultationIds.length > 0) params.consultation_ids = consultationIds.join(',');
    
    const response = await this.makeRequest({
      method: 'GET',
      endpoint: '/prescriptions',
      params
    });
    
    return {
      data: response.data || response.prescriptions || [],
      hasMore: response.hasMore || response.has_more || false,
      nextCursor: response.nextCursor || response.next_cursor
    };
  }

  // Fetch medical records with pagination
  async fetchMedicalRecords(options: {
    patientIds?: string[];
    consultationIds?: string[];
    since?: Date;
    pagination?: PaginationParams;
  } = {}): Promise<{ data: ExternalMedicalRecord[]; hasMore: boolean; nextCursor?: string }> {
    const { patientIds = [], consultationIds = [], since, pagination = {} } = options;
    
    const params: Record<string, any> = {
      limit: pagination.limit || 50, // Medical records are typically larger
      ...pagination
    };
    
    if (since) params.since = since.toISOString();
    if (patientIds.length > 0) params.patient_ids = patientIds.join(',');
    if (consultationIds.length > 0) params.consultation_ids = consultationIds.join(',');
    
    const response = await this.makeRequest({
      method: 'GET',
      endpoint: '/medical-records',
      params
    });
    
    return {
      data: response.data || response.records || [],
      hasMore: response.hasMore || response.has_more || false,
      nextCursor: response.nextCursor || response.next_cursor
    };
  }

  // Transform external consultation to our format
  private transformConsultation(external: ExternalConsultation): InsertTelemedicineConsultation {
    return {
      providerId: this.provider.id,
      externalConsultationId: external.id,
      externalPatientData: external.patientData,
      externalDoctorData: external.doctorData,
      consultationType: external.consultationType,
      scheduledAt: new Date(external.scheduledAt),
      startedAt: external.startedAt ? new Date(external.startedAt) : undefined,
      endedAt: external.endedAt ? new Date(external.endedAt) : undefined,
      duration: external.duration,
      status: external.status,
      consultationNotes: external.notes,
      diagnosis: external.diagnosis,
      treatmentPlan: external.treatmentPlan,
      meetingRoomData: external.meetingRoomData,
      qualityMetrics: external.qualityMetrics,
      rawData: external,
      syncStatus: 'synced',
      lastSyncAt: new Date()
    };
  }

  // Transform external prescription to our format
  private transformPrescription(external: ExternalPrescription): InsertExternalPrescription {
    // Find the related consultation ID in our system
    return {
      telemedicineConsultationId: '', // This will be resolved during sync
      providerId: this.provider.id,
      externalPrescriptionId: external.id,
      prescribedMedications: external.medications,
      prescribingDoctor: external.prescribingDoctor,
      validUntil: external.validUntil ? new Date(external.validUntil) : undefined,
      conversionStatus: 'pending'
    };
  }

  // Transform external medical record to our format
  private transformMedicalRecord(external: ExternalMedicalRecord): InsertMedicalRecord {
    // Calculate completeness score based on available data fields
    const dataFields = [
      'anamnesis', 'vitalSigns', 'physicalExam', 'medicalHistory',
      'familyHistory', 'socialHistory', 'currentMedications', 'allergies'
    ];
    
    const completedFields = dataFields.filter(field => 
      external[field] && Object.keys(external[field]).length > 0
    ).length;
    
    const completenessScore = (completedFields / dataFields.length).toFixed(2);
    
    return {
      providerId: this.provider.id,
      externalRecordId: external.id,
      anamnesis: external.anamnesis,
      vitalSigns: external.vitalSigns,
      physicalExam: external.physicalExam,
      medicalHistory: external.medicalHistory,
      familyHistory: external.familyHistory,
      socialHistory: external.socialHistory,
      currentMedications: external.currentMedications,
      allergies: external.allergies,
      labResults: external.labResults,
      imagingResults: external.imagingResults,
      attachments: external.attachments,
      completenessScore,
      dataQualityFlags: this.assessDataQuality(external),
      isActive: true
    };
  }

  private assessDataQuality(record: ExternalMedicalRecord): string[] {
    const flags: string[] = [];
    
    if (!record.vitalSigns || Object.keys(record.vitalSigns).length === 0) {
      flags.push('missing_vitals');
    }
    
    if (!record.anamnesis || Object.keys(record.anamnesis).length === 0) {
      flags.push('incomplete_history');
    }
    
    if (!record.currentMedications || Object.keys(record.currentMedications).length === 0) {
      flags.push('missing_medications');
    }
    
    if (!record.allergies) {
      flags.push('allergies_not_documented');
    }
    
    return flags;
  }
}

// Main sync manager class
export class TelemedicineSyncManager {
  private activeClients: Map<string, TelemedicineApiClient> = new Map();
  private syncInProgress = false;

  // Initialize clients for all active providers
  async initializeClients(): Promise<void> {
    try {
      const providers = await storage.getActiveTelemedicineProviders();
      
      for (const provider of providers) {
        if (provider.integrationStatus === 'active' && provider.apiUrl) {
          const client = new TelemedicineApiClient(provider);
          this.activeClients.set(provider.id, client);
          console.log(`[SyncManager] Initialized client for provider: ${provider.name}`);
        }
      }
      
      console.log(`[SyncManager] Initialized ${this.activeClients.size} telemedicine clients`);
    } catch (error) {
      console.error('[SyncManager] Error initializing clients:', error);
      throw error;
    }
  }

  // Perform full synchronization for all providers
  async performFullSync(): Promise<Record<string, SyncResult>> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    const results: Record<string, SyncResult> = {};

    try {
      console.log('[SyncManager] Starting full synchronization...');
      
      for (const [providerId, client] of this.activeClients) {
        try {
          const result = await this.syncProvider(client, providerId);
          results[providerId] = result;
          
          // Update provider's last sync timestamp
          await storage.updateTelemedicineProvider(providerId, {
            lastSyncAt: new Date(),
            integrationStatus: result.success ? 'active' : 'error'
          });
          
        } catch (error) {
          console.error(`[SyncManager] Error syncing provider ${providerId}:`, error);
          results[providerId] = {
            success: false,
            processed: 0,
            errors: [{ type: 'sync_error', message: (error as Error).message }]
          };
        }
      }
      
      console.log('[SyncManager] Full synchronization completed');
      return results;
      
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync a specific provider
  private async syncProvider(client: TelemedicineApiClient, providerId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: 0,
      errors: []
    };

    try {
      // Get the last sync timestamp to only fetch new/updated data
      const provider = await storage.getTelemedicineProvider(providerId);
      const lastSync = provider?.lastSyncAt;
      
      console.log(`[SyncManager] Syncing provider ${providerId} since ${lastSync?.toISOString() || 'beginning'}`);

      // 1. Sync consultations
      await this.syncConsultations(client, providerId, lastSync, result);
      
      // 2. Sync prescriptions (after consultations for proper linking)
      await this.syncPrescriptions(client, providerId, lastSync, result);
      
      // 3. Sync medical records
      await this.syncMedicalRecords(client, providerId, lastSync, result);
      
      result.lastSyncTimestamp = new Date();
      console.log(`[SyncManager] Completed sync for provider ${providerId}. Processed: ${result.processed} records`);
      
    } catch (error) {
      result.success = false;
      result.errors.push({
        type: 'provider_sync_error',
        message: (error as Error).message
      });
    }

    return result;
  }

  private async syncConsultations(
    client: TelemedicineApiClient, 
    providerId: string, 
    since: Date | null | undefined, 
    result: SyncResult
  ): Promise<void> {
    let hasMore = true;
    let cursor: string | undefined;
    
    while (hasMore) {
      try {
        const response = await client.fetchConsultations({
          since: since || undefined,
          pagination: { cursor, limit: 100 }
        });
        
        for (const consultation of response.data) {
          try {
            const transformed = (client as any).transformConsultation(consultation);
            
            // Check if consultation already exists
            const existing = await storage.getTelemedicineConsultationByExternalId(
              providerId, 
              consultation.id
            );
            
            if (existing) {
              await storage.updateTelemedicineConsultation(existing.id, transformed);
            } else {
              await storage.createTelemedicineConsultation(transformed);
            }
            
            result.processed++;
            
          } catch (error) {
            result.errors.push({
              type: 'consultation_sync_error',
              message: (error as Error).message,
              data: { externalId: consultation.id }
            });
          }
        }
        
        hasMore = response.hasMore;
        cursor = response.nextCursor;
        
      } catch (error) {
        result.errors.push({
          type: 'consultation_fetch_error',
          message: (error as Error).message
        });
        break;
      }
    }
  }

  private async syncPrescriptions(
    client: TelemedicineApiClient, 
    providerId: string, 
    since: Date | null | undefined, 
    result: SyncResult
  ): Promise<void> {
    let hasMore = true;
    let cursor: string | undefined;
    
    while (hasMore) {
      try {
        const response = await client.fetchPrescriptions({
          since: since || undefined,
          pagination: { cursor, limit: 100 }
        });
        
        for (const prescription of response.data) {
          try {
            const transformed = (client as any).transformPrescription(prescription);
            
            // Find the related consultation in our system
            const consultation = await storage.getTelemedicineConsultationByExternalId(
              providerId,
              prescription.consultationId
            );
            
            if (consultation) {
              transformed.telemedicineConsultationId = consultation.id;
              
              const existing = await storage.getExternalPrescriptionByExternalId(
                providerId,
                prescription.id
              );
              
              if (existing) {
                await storage.updateExternalPrescription(existing.id, transformed);
              } else {
                await storage.createExternalPrescription(transformed);
              }
              
              result.processed++;
            } else {
              result.errors.push({
                type: 'prescription_link_error',
                message: 'Related consultation not found',
                data: { externalId: prescription.id, consultationId: prescription.consultationId }
              });
            }
            
          } catch (error) {
            result.errors.push({
              type: 'prescription_sync_error',
              message: (error as Error).message,
              data: { externalId: prescription.id }
            });
          }
        }
        
        hasMore = response.hasMore;
        cursor = response.nextCursor;
        
      } catch (error) {
        result.errors.push({
          type: 'prescription_fetch_error',
          message: (error as Error).message
        });
        break;
      }
    }
  }

  private async syncMedicalRecords(
    client: TelemedicineApiClient, 
    providerId: string, 
    since: Date | null | undefined, 
    result: SyncResult
  ): Promise<void> {
    let hasMore = true;
    let cursor: string | undefined;
    
    while (hasMore) {
      try {
        const response = await client.fetchMedicalRecords({
          since: since || undefined,
          pagination: { cursor, limit: 50 }
        });
        
        for (const record of response.data) {
          try {
            const transformed = (client as any).transformMedicalRecord(record);
            
            // Try to link to existing consultation if provided
            if (record.consultationId) {
              const consultation = await storage.getTelemedicineConsultationByExternalId(
                providerId,
                record.consultationId
              );
              if (consultation) {
                transformed.telemedicineConsultationId = consultation.id;
              }
            }
            
            const existing = await storage.getMedicalRecordByExternalId(
              providerId,
              record.id
            );
            
            if (existing) {
              await storage.updateMedicalRecord(existing.id, transformed);
            } else {
              await storage.createMedicalRecord(transformed);
            }
            
            result.processed++;
            
          } catch (error) {
            result.errors.push({
              type: 'medical_record_sync_error',
              message: (error as Error).message,
              data: { externalId: record.id }
            });
          }
        }
        
        hasMore = response.hasMore;
        cursor = response.nextCursor;
        
      } catch (error) {
        result.errors.push({
          type: 'medical_record_fetch_error',
          message: (error as Error).message
        });
        break;
      }
    }
  }

  // Perform historical backfill for a specific date range
  async performHistoricalBackfill(startDate: Date, endDate: Date): Promise<Record<string, SyncResult>> {
    console.log(`[SyncManager] Starting historical backfill from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const results: Record<string, SyncResult> = {};
    
    for (const [providerId, client] of this.activeClients) {
      try {
        const result = await this.backfillProvider(client, providerId, startDate, endDate);
        results[providerId] = result;
      } catch (error) {
        console.error(`[SyncManager] Error in historical backfill for provider ${providerId}:`, error);
        results[providerId] = {
          success: false,
          processed: 0,
          errors: [{ type: 'backfill_error', message: (error as Error).message }]
        };
      }
    }
    
    return results;
  }

  private async backfillProvider(
    client: TelemedicineApiClient, 
    providerId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: 0,
      errors: []
    };

    // Split the date range into smaller chunks to avoid overwhelming the external API
    const chunkSize = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    let currentStart = new Date(startDate);
    
    while (currentStart < endDate) {
      const currentEnd = new Date(Math.min(currentStart.getTime() + chunkSize, endDate.getTime()));
      
      console.log(`[SyncManager] Backfilling ${providerId} from ${currentStart.toISOString()} to ${currentEnd.toISOString()}`);
      
      // Process this chunk
      await this.syncConsultations(client, providerId, currentStart, result);
      await this.syncPrescriptions(client, providerId, currentStart, result);
      await this.syncMedicalRecords(client, providerId, currentStart, result);
      
      // Move to next chunk
      currentStart = new Date(currentEnd.getTime() + 1);
      
      // Add a small delay between chunks to be respectful to external APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return result;
  }

  // Get sync status for all providers
  async getSyncStatus(): Promise<Array<{ providerId: string; providerName: string; lastSync: Date | null; status: string }>> {
    const providers = await storage.getActiveTelemedicineProviders();
    return providers.map(provider => ({
      providerId: provider.id,
      providerName: provider.name,
      lastSync: provider.lastSyncAt,
      status: provider.integrationStatus
    }));
  }
}

// Singleton instance
export const syncManager = new TelemedicineSyncManager();

// Initialize on startup - DISABLED to avoid SSL errors during login
// syncManager.initializeClients().catch(error => {
//   console.error('[SyncManager] Failed to initialize on startup:', error);
// });