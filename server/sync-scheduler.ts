import { syncManager } from './telemedicine-client';
import { storage } from './storage';

interface SyncScheduleConfig {
  fullSyncIntervalHours: number;
  incrementalSyncIntervalMinutes: number;
  retryOnFailureMinutes: number;
  maxRetries: number;
  enableAutoBackfill: boolean;
  backfillDaysOnFirstRun: number;
}

interface SyncJob {
  id: string;
  type: 'full' | 'incremental' | 'backfill';
  scheduledAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  providerId?: string;
  retryCount: number;
  lastError?: string;
  results?: any;
}

class SyncScheduler {
  private config: SyncScheduleConfig;
  private jobs: Map<string, SyncJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(config: Partial<SyncScheduleConfig> = {}) {
    this.config = {
      fullSyncIntervalHours: config.fullSyncIntervalHours || 6, // Every 6 hours
      incrementalSyncIntervalMinutes: config.incrementalSyncIntervalMinutes || 15, // Every 15 minutes
      retryOnFailureMinutes: config.retryOnFailureMinutes || 5, // Retry after 5 minutes
      maxRetries: config.maxRetries || 3,
      enableAutoBackfill: config.enableAutoBackfill ?? true,
      backfillDaysOnFirstRun: config.backfillDaysOnFirstRun || 30, // 30 days of historical data
    };
  }

  // Start the scheduler
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[SyncScheduler] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[SyncScheduler] Starting scheduler with config:', this.config);

    try {
      // Initialize the sync manager
      await syncManager.initializeClients();

      // Check if this is the first run and needs historical backfill
      if (this.config.enableAutoBackfill) {
        await this.checkAndScheduleInitialBackfill();
      }

      // Schedule regular sync jobs
      this.scheduleRegularSyncs();

      console.log('[SyncScheduler] Scheduler started successfully');
    } catch (error) {
      console.error('[SyncScheduler] Failed to start scheduler:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Stop the scheduler
  stop(): void {
    console.log('[SyncScheduler] Stopping scheduler...');
    
    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`[SyncScheduler] Cleared interval: ${name}`);
    }
    this.intervals.clear();

    this.isRunning = false;
    console.log('[SyncScheduler] Scheduler stopped');
  }

  // Check if historical backfill is needed
  private async checkAndScheduleInitialBackfill(): Promise<void> {
    try {
      const providers = await storage.getActiveTelemedicineProviders();
      
      for (const provider of providers) {
        if (!provider.lastSyncAt) {
          // This provider has never been synced - schedule backfill
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - this.config.backfillDaysOnFirstRun);
          
          await this.scheduleBackfillJob(provider.id, startDate, endDate);
          console.log(`[SyncScheduler] Scheduled initial backfill for provider ${provider.name} from ${startDate.toISOString()}`);
        }
      }
    } catch (error) {
      console.error('[SyncScheduler] Error checking for initial backfill:', error);
    }
  }

  // Schedule regular synchronization jobs
  private scheduleRegularSyncs(): void {
    // Schedule incremental syncs every X minutes
    const incrementalInterval = setInterval(async () => {
      await this.scheduleIncrementalSync();
    }, this.config.incrementalSyncIntervalMinutes * 60 * 1000);
    
    this.intervals.set('incremental', incrementalInterval);

    // Schedule full syncs every X hours
    const fullSyncInterval = setInterval(async () => {
      await this.scheduleFullSync();
    }, this.config.fullSyncIntervalHours * 60 * 60 * 1000);
    
    this.intervals.set('full', fullSyncInterval);

    // Schedule immediate incremental sync on startup
    setTimeout(() => {
      this.scheduleIncrementalSync();
    }, 5000); // Wait 5 seconds after startup

    console.log('[SyncScheduler] Scheduled regular sync jobs');
  }

  // Schedule a full synchronization
  private async scheduleFullSync(): Promise<string> {
    const jobId = `full-sync-${Date.now()}`;
    const job: SyncJob = {
      id: jobId,
      type: 'full',
      scheduledAt: new Date(),
      status: 'pending',
      retryCount: 0
    };

    this.jobs.set(jobId, job);
    console.log(`[SyncScheduler] Scheduled full sync job: ${jobId}`);

    // Execute the job
    this.executeJob(jobId);
    
    return jobId;
  }

  // Schedule an incremental synchronization
  private async scheduleIncrementalSync(): Promise<string> {
    const jobId = `incremental-sync-${Date.now()}`;
    const job: SyncJob = {
      id: jobId,
      type: 'incremental',
      scheduledAt: new Date(),
      status: 'pending',
      retryCount: 0
    };

    this.jobs.set(jobId, job);
    console.log(`[SyncScheduler] Scheduled incremental sync job: ${jobId}`);

    // Execute the job
    this.executeJob(jobId);
    
    return jobId;
  }

  // Schedule a historical backfill job
  private async scheduleBackfillJob(providerId: string, startDate: Date, endDate: Date): Promise<string> {
    const jobId = `backfill-${providerId}-${Date.now()}`;
    const job: SyncJob = {
      id: jobId,
      type: 'backfill',
      scheduledAt: new Date(),
      status: 'pending',
      providerId,
      retryCount: 0,
      results: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    };

    this.jobs.set(jobId, job);
    console.log(`[SyncScheduler] Scheduled backfill job: ${jobId} for provider ${providerId}`);

    // Execute the job
    this.executeJob(jobId);
    
    return jobId;
  }

  // Execute a specific job
  private async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`[SyncScheduler] Job not found: ${jobId}`);
      return;
    }

    if (job.status === 'running') {
      console.log(`[SyncScheduler] Job already running: ${jobId}`);
      return;
    }

    job.status = 'running';
    console.log(`[SyncScheduler] Executing job: ${jobId} (${job.type})`);

    try {
      let results: any;

      switch (job.type) {
        case 'full':
          results = await syncManager.performFullSync();
          break;
          
        case 'incremental':
          results = await syncManager.performFullSync(); // For now, same as full sync
          break;
          
        case 'backfill':
          if (job.providerId && job.results?.startDate && job.results?.endDate) {
            const startDate = new Date(job.results.startDate);
            const endDate = new Date(job.results.endDate);
            results = await syncManager.performHistoricalBackfill(startDate, endDate);
          } else {
            throw new Error('Invalid backfill job configuration');
          }
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Check if sync was successful
      const hasErrors = Object.values(results).some((result: any) => !result.success);
      
      if (hasErrors) {
        throw new Error('Sync completed with errors');
      }

      job.status = 'completed';
      job.results = results;
      
      console.log(`[SyncScheduler] Job completed successfully: ${jobId}`);
      this.logJobResults(job);
      
    } catch (error) {
      job.status = 'failed';
      job.lastError = (error as Error).message;
      job.retryCount++;
      
      console.error(`[SyncScheduler] Job failed: ${jobId}`, error);
      
      // Schedule retry if within retry limit
      if (job.retryCount < this.config.maxRetries) {
        setTimeout(() => {
          console.log(`[SyncScheduler] Retrying job: ${jobId} (attempt ${job.retryCount + 1}/${this.config.maxRetries})`);
          this.executeJob(jobId);
        }, this.config.retryOnFailureMinutes * 60 * 1000);
      } else {
        console.error(`[SyncScheduler] Job exhausted retries: ${jobId}`);
      }
    }
  }

  // Log job results
  private logJobResults(job: SyncJob): void {
    const logData = {
      jobId: job.id,
      type: job.type,
      scheduledAt: job.scheduledAt.toISOString(),
      status: job.status,
      retryCount: job.retryCount,
      results: job.results
    };
    
    console.log(`[SYNC-JOB-COMPLETED] ${job.id}:`, JSON.stringify(logData, null, 2));
  }

  // Get job status
  getJobStatus(jobId: string): SyncJob | undefined {
    return this.jobs.get(jobId);
  }

  // Get all jobs
  getAllJobs(): SyncJob[] {
    return Array.from(this.jobs.values());
  }

  // Get recent jobs (last 24 hours)
  getRecentJobs(): SyncJob[] {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return Array.from(this.jobs.values())
      .filter(job => job.scheduledAt > oneDayAgo)
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
  }

  // Cleanup old job records
  cleanup(): void {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const [jobId, job] of this.jobs) {
      if (job.scheduledAt < oneWeekAgo && job.status !== 'running') {
        this.jobs.delete(jobId);
      }
    }
    
    console.log(`[SyncScheduler] Cleaned up old job records. Active jobs: ${this.jobs.size}`);
  }

  // Manual trigger for testing
  async triggerManualSync(type: 'full' | 'incremental' = 'incremental'): Promise<string> {
    if (type === 'full') {
      return await this.scheduleFullSync();
    } else {
      return await this.scheduleIncrementalSync();
    }
  }

  // Get scheduler status
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    recentJobs: number;
    config: SyncScheduleConfig;
  } {
    const runningJobs = Array.from(this.jobs.values()).filter(job => job.status === 'running').length;
    const recentJobs = this.getRecentJobs().length;
    
    return {
      isRunning: this.isRunning,
      activeJobs: runningJobs,
      recentJobs,
      config: this.config
    };
  }
}

// Singleton instance
export const syncScheduler = new SyncScheduler();

// Auto-start scheduler on module load (can be disabled in tests)
if (process.env.NODE_ENV !== 'test') {
  // Start scheduler after a short delay to ensure all modules are loaded
  setTimeout(async () => {
    try {
      await syncScheduler.start();
    } catch (error) {
      console.error('[SyncScheduler] Failed to auto-start scheduler:', error);
    }
  }, 10000); // 10 second delay
}

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('[SyncScheduler] Received shutdown signal');
  syncScheduler.stop();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Cleanup interval (runs every hour)
setInterval(() => {
  syncScheduler.cleanup();
}, 60 * 60 * 1000);