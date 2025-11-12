import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Types for webhook security
interface WebhookSecurityConfig {
  hmacSecret: string;
  maxTimestampAge: number; // in seconds
  rateLimitWindow: number; // in milliseconds
  rateLimitMaxRequests: number;
  nonceExpiryTime: number; // in milliseconds
}

interface WebhookRequest extends Request {
  webhookSignature?: string;
  webhookTimestamp?: number;
  webhookNonce?: string;
  webhookProviderKey?: string;
  webhookIdempotencyKey?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface NonceEntry {
  timestamp: number;
  used: boolean;
}

interface IdempotencyEntry {
  response: any;
  statusCode: number;
  timestamp: number;
}

class WebhookSecurityManager {
  private config: WebhookSecurityConfig;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private nonceMap = new Map<string, NonceEntry>();
  private idempotencyMap = new Map<string, IdempotencyEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Partial<WebhookSecurityConfig> = {}) {
    this.config = {
      hmacSecret: process.env.WEBHOOK_HMAC_SECRET || 'default-webhook-secret-please-change-in-production',
      maxTimestampAge: config.maxTimestampAge || 300, // 5 minutes
      rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
      rateLimitMaxRequests: config.rateLimitMaxRequests || 100,
      nonceExpiryTime: config.nonceExpiryTime || 3600000, // 1 hour
    };

    // Start cleanup routine for expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Run every minute
  }

  // Clean up expired entries to prevent memory leaks
  private cleanup(): void {
    const now = Date.now();
    
    // Cleanup rate limit entries
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
    
    // Cleanup nonce entries
    for (const [nonce, entry] of this.nonceMap.entries()) {
      if (now - entry.timestamp > this.config.nonceExpiryTime) {
        this.nonceMap.delete(nonce);
      }
    }
    
    // Cleanup idempotency entries (keep for 24 hours)
    const idempotencyExpiryTime = 24 * 60 * 60 * 1000; // 24 hours
    for (const [key, entry] of this.idempotencyMap.entries()) {
      if (now - entry.timestamp > idempotencyExpiryTime) {
        this.idempotencyMap.delete(key);
      }
    }
  }

  // Generate HMAC signature for outgoing webhooks
  generateSignature(payload: string, timestamp: number, secret?: string): string {
    const hmacSecret = secret || this.config.hmacSecret;
    const signaturePayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', hmacSecret)
      .update(signaturePayload, 'utf8')
      .digest('hex');
    return `sha256=${signature}`;
  }

  // Verify HMAC signature for incoming webhooks
  private verifySignature(payload: string, signature: string, timestamp: number, secret?: string): boolean {
    const hmacSecret = secret || this.config.hmacSecret;
    const expectedSignature = this.generateSignature(payload, timestamp, hmacSecret);
    
    // Use constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch (error) {
      return false;
    }
  }

  // Verify timestamp to prevent replay attacks
  private verifyTimestamp(timestamp: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const age = Math.abs(now - timestamp);
    return age <= this.config.maxTimestampAge;
  }

  // Check and record nonce to prevent replay attacks
  private verifyNonce(nonce: string): boolean {
    const existing = this.nonceMap.get(nonce);
    
    if (existing && existing.used) {
      return false; // Nonce already used
    }
    
    // Mark nonce as used
    this.nonceMap.set(nonce, {
      timestamp: Date.now(),
      used: true
    });
    
    return true;
  }

  // Rate limiting implementation
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);
    
    if (!entry) {
      // First request from this identifier
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstRequest: now
      });
      return true;
    }
    
    if (now > entry.resetTime) {
      // Reset window has passed
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstRequest: now
      });
      return true;
    }
    
    if (entry.count >= this.config.rateLimitMaxRequests) {
      return false; // Rate limit exceeded
    }
    
    // Increment counter
    entry.count++;
    return true;
  }

  // Idempotency handling
  private checkIdempotency(key: string): IdempotencyEntry | null {
    return this.idempotencyMap.get(key) || null;
  }

  private storeIdempotency(key: string, response: any, statusCode: number): void {
    this.idempotencyMap.set(key, {
      response,
      statusCode,
      timestamp: Date.now()
    });
  }

  // Main webhook validation middleware
  createWebhookMiddleware(options: {
    requireSignature?: boolean;
    requireTimestamp?: boolean;
    requireNonce?: boolean;
    enableRateLimit?: boolean;
    enableIdempotency?: boolean;
    customSecret?: string;
    rateLimitIdentifier?: (req: Request) => string;
  } = {}) {
    const {
      requireSignature = true,
      requireTimestamp = true,
      requireNonce = false,
      enableRateLimit = true,
      enableIdempotency = true,
      customSecret,
      rateLimitIdentifier = (req) => req.ip || 'unknown'
    } = options;

    return async (req: WebhookRequest, res: Response, next: NextFunction) => {
      try {
        const startTime = Date.now();
        
        // Extract webhook headers
        const signature = req.headers['x-signature'] || req.headers['x-webhook-signature'] as string;
        const timestamp = parseInt(req.headers['x-timestamp'] as string || '0');
        const nonce = req.headers['x-nonce'] as string;
        const idempotencyKey = req.headers['x-idempotency-key'] as string;
        const providerKey = req.headers['x-provider-key'] as string;
        
        // Store parsed values for later use
        req.webhookSignature = signature;
        req.webhookTimestamp = timestamp;
        req.webhookNonce = nonce;
        req.webhookProviderKey = providerKey;
        req.webhookIdempotencyKey = idempotencyKey;
        
        // Rate limiting check
        if (enableRateLimit) {
          const identifier = rateLimitIdentifier(req);
          if (!this.checkRateLimit(identifier)) {
            this.logSecurityEvent('rate_limit_exceeded', {
              identifier,
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              endpoint: req.path
            });
            
            return res.status(429).json({
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil(this.config.rateLimitWindow / 1000)
            });
          }
        }
        
        // Idempotency check
        if (enableIdempotency && idempotencyKey) {
          const existingResponse = this.checkIdempotency(idempotencyKey);
          if (existingResponse) {
            this.logSecurityEvent('idempotency_hit', {
              key: idempotencyKey,
              ip: req.ip,
              endpoint: req.path
            });
            
            return res.status(existingResponse.statusCode).json(existingResponse.response);
          }
        }
        
        // Get raw body for signature verification
        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk.toString('utf8');
        });
        
        req.on('end', () => {
          try {
            // Timestamp verification
            if (requireTimestamp && (!timestamp || !this.verifyTimestamp(timestamp))) {
              this.logSecurityEvent('invalid_timestamp', {
                timestamp,
                ip: req.ip,
                endpoint: req.path
              });
              
              return res.status(401).json({
                error: 'Invalid or expired timestamp'
              });
            }
            
            // Nonce verification (replay protection)
            if (requireNonce && nonce) {
              if (!this.verifyNonce(nonce)) {
                this.logSecurityEvent('replay_attack_detected', {
                  nonce,
                  ip: req.ip,
                  endpoint: req.path
                });
                
                return res.status(401).json({
                  error: 'Replay attack detected'
                });
              }
            }
            
            // Signature verification
            if (requireSignature && signature) {
              const isValidSignature = this.verifySignature(
                rawBody,
                signature,
                timestamp || Math.floor(Date.now() / 1000),
                customSecret
              );
              
              if (!isValidSignature) {
                this.logSecurityEvent('invalid_signature', {
                  signature,
                  timestamp,
                  ip: req.ip,
                  endpoint: req.path,
                  bodyLength: rawBody.length
                });
                
                return res.status(401).json({
                  error: 'Invalid signature'
                });
              }
            }
            
            // Parse JSON body
            try {
              req.body = JSON.parse(rawBody);
            } catch (parseError) {
              this.logSecurityEvent('invalid_json', {
                error: (parseError as Error).message,
                ip: req.ip,
                endpoint: req.path
              });
              
              return res.status(400).json({
                error: 'Invalid JSON payload'
              });
            }
            
            // Override res.json to capture response for idempotency
            if (enableIdempotency && idempotencyKey) {
              const originalJson = res.json;
              res.json = function(body: any) {
                webhookSecurity.storeIdempotency(idempotencyKey, body, res.statusCode);
                return originalJson.call(this, body);
              };
            }
            
            // Log successful validation
            this.logSecurityEvent('webhook_validated', {
              ip: req.ip,
              endpoint: req.path,
              processingTime: Date.now() - startTime,
              hasSignature: !!signature,
              hasTimestamp: !!timestamp,
              hasNonce: !!nonce,
              hasIdempotencyKey: !!idempotencyKey
            });
            
            next();
            
          } catch (error) {
            this.logSecurityEvent('validation_error', {
              error: (error as Error).message,
              ip: req.ip,
              endpoint: req.path
            });
            
            res.status(500).json({
              error: 'Internal validation error'
            });
          }
        });
        
      } catch (error) {
        this.logSecurityEvent('middleware_error', {
          error: (error as Error).message,
          ip: req.ip,
          endpoint: req.path
        });
        
        res.status(500).json({
          error: 'Internal security error'
        });
      }
    };
  }

  // Simple API key validation middleware for webhooks
  createApiKeyMiddleware(options: {
    validKeys?: string[];
    headerName?: string;
    allowQueryParam?: boolean;
  } = {}) {
    const {
      validKeys = [
        process.env.TELEMEDICINE_API_KEY,
        process.env.WEBHOOK_API_KEY
      ].filter(Boolean),
      headerName = 'x-api-key',
      allowQueryParam = false
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        let apiKey: string | undefined;
        
        // Check header first
        apiKey = req.headers[headerName] as string;
        
        // Check Authorization header as fallback
        if (!apiKey && req.headers.authorization) {
          const authHeader = req.headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.substring(7);
          }
        }
        
        // Check query parameter if allowed
        if (!apiKey && allowQueryParam) {
          apiKey = req.query.api_key as string;
        }
        
        if (!apiKey) {
          this.logSecurityEvent('missing_api_key', {
            ip: req.ip,
            endpoint: req.path,
            userAgent: req.headers['user-agent']
          });
          
          return res.status(401).json({
            error: 'API key required'
          });
        }
        
        if (!validKeys.includes(apiKey)) {
          this.logSecurityEvent('invalid_api_key', {
            key: apiKey.substring(0, 8) + '...',
            ip: req.ip,
            endpoint: req.path
          });
          
          return res.status(401).json({
            error: 'Invalid API key'
          });
        }
        
        this.logSecurityEvent('api_key_validated', {
          ip: req.ip,
          endpoint: req.path
        });
        
        next();
        
      } catch (error) {
        this.logSecurityEvent('api_key_middleware_error', {
          error: (error as Error).message,
          ip: req.ip,
          endpoint: req.path
        });
        
        res.status(500).json({
          error: 'Internal authentication error'
        });
      }
    };
  }

  // Structured logging for security events
  private logSecurityEvent(event: string, details: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      level: this.getLogLevel(event)
    };
    
    const logMessage = `[WEBHOOK-SECURITY-${logEntry.level.toUpperCase()}] ${event}`;
    
    if (logEntry.level === 'error' || logEntry.level === 'warn') {
      console.error(logMessage, JSON.stringify(logEntry, null, 2));
    } else {
      console.log(logMessage, JSON.stringify(logEntry, null, 2));
    }
  }

  private getLogLevel(event: string): string {
    const errorEvents = [
      'invalid_signature', 'invalid_timestamp', 'replay_attack_detected',
      'rate_limit_exceeded', 'invalid_api_key', 'missing_api_key'
    ];
    
    const warningEvents = [
      'invalid_json', 'validation_error', 'middleware_error'
    ];
    
    if (errorEvents.includes(event)) return 'error';
    if (warningEvents.includes(event)) return 'warn';
    return 'info';
  }

  // Graceful shutdown
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // Get security statistics
  getStats(): {
    rateLimitEntries: number;
    nonceEntries: number;
    idempotencyEntries: number;
  } {
    return {
      rateLimitEntries: this.rateLimitMap.size,
      nonceEntries: this.nonceMap.size,
      idempotencyEntries: this.idempotencyMap.size
    };
  }
}

// Singleton instance
export const webhookSecurity = new WebhookSecurityManager();

// Export middleware creators for easy use
export const createWebhookSecurityMiddleware = webhookSecurity.createWebhookMiddleware.bind(webhookSecurity);
export const createApiKeyMiddleware = webhookSecurity.createApiKeyMiddleware.bind(webhookSecurity);

// Export for testing and advanced usage
export { WebhookSecurityManager };

// Graceful shutdown handling
process.on('SIGTERM', () => {
  webhookSecurity.shutdown();
});

process.on('SIGINT', () => {
  webhookSecurity.shutdown();
});