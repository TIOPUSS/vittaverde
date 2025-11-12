import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Extend express session interface to include user
declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
    affiliateCode?: string;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session store - Use durable storage for production
import ConnectPgSimple from 'connect-pg-simple';
import { pool } from './db';

const PgSession = ConnectPgSimple(session);

// Require SESSION_SECRET for production security
if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is required for secure session management"
  );
}

// Set trust proxy for production deployments behind reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: new PgSession({
    pool: pool, // Use the same database connection pool
    tableName: 'session', // Table will be created automatically
    createTableIfMissing: true
  }),
  cookie: {
    secure: false, // disable secure for Replit environment
    httpOnly: true, // secure cookie but allow for proper session management
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // lax for better cross-origin compatibility
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Log only method, path, status, and duration to prevent PII exposure
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

// Note: Static file serving for /uploads is handled in routes.ts with proper cache headers

(async () => {
  console.log('[SERVER] Registering affiliate tracking route...');
  
  // IMPORTANT: Affiliate tracking catch-all route MUST be before Vite and other routes
  app.get('/:code', async (req, res, next) => {
    const code = req.params.code;
    const path = req.path;
    
    // Skip if has file extension (.png, .js, .css, etc.)
    if (path.includes('.') || path.startsWith('/@') || path.startsWith('/__')) {
      return next();
    }
    
    // Skip known routes
    const knownRoutes = [
      'login', 'registro', 'produtos', 'loja', 'carrinho', 'como-funciona',
      'anvisa', 'patologias', 'bem-estar', 'politica-privacidade', 'termos-uso',
      'admin', 'medico', 'comercial', 'vendedor', 'paciente', 'universidade',
      'verify-email', 'verify-code', 'verificar-email', 'esqueci-senha',
      'api', 'assets', 'src', 'node_modules', 'uploads'
    ];
    
    if (!code || knownRoutes.includes(code.toLowerCase())) {
      return next();
    }
    
    const codeUpper = code.toUpperCase();
    console.log(`[AFFILIATE] Checking potential affiliate code: ${codeUpper}`);
    
    try {
      const { affiliateService } = await import("./services/affiliate.service");
      const vendor = await affiliateService.getVendorByAffiliateCode(codeUpper);
      
      if (vendor) {
        console.log(`[AFFILIATE] ✅ Valid vendor found: ${vendor.fullName}`);
        
        // Save to session
        if (!req.session.affiliateCode || req.session.affiliateCode !== codeUpper) {
          req.session.affiliateCode = codeUpper;
          
          const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
          const userAgent = req.headers['user-agent'];
          const referrer = req.headers['referer'] || req.headers['referrer'];
          
          await affiliateService.trackClick(codeUpper, ipAddress, userAgent, referrer as string);
          console.log(`[AFFILIATE] 📊 Click tracked from IP ${ipAddress}`);
        }
        
        // Redirect to home
        console.log(`[AFFILIATE] ↪️ Redirecting to home`);
        return res.redirect('/');
      }
    } catch (error) {
      console.error('[AFFILIATE] Error checking code:', error);
    }
    
    // Not a valid affiliate code, continue
    next();
  });
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
