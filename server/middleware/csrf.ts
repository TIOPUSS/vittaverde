import type { Request, Response, NextFunction } from "express";

/**
 * CSRF Protection Middleware
 * 
 * Protects against Cross-Site Request Forgery attacks by:
 * 1. Validating X-Requested-With header is present (prevents simple forms)
 * 2. Checking Origin/Referer headers match the host
 * 3. Only applies to mutation methods (POST, PUT, PATCH, DELETE)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Only apply CSRF protection to mutation methods
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutationMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF protection for authentication endpoints (login/register)
  if (req.path === '/api/login' || req.path === '/api/register') {
    return next();
  }

  // Check for X-Requested-With header (standard for AJAX requests)
  const requestedWith = req.get('X-Requested-With');
  if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
    return res.status(403).json({ 
      message: 'Forbidden: Missing or invalid X-Requested-With header' 
    });
  }

  // Validate Origin or Referer header
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');

  if (!host) {
    return res.status(400).json({ 
      message: 'Bad Request: Missing Host header' 
    });
  }

  let validOrigin = false;

  // Check Origin header first (preferred)
  if (origin) {
    try {
      const originUrl = new URL(origin);
      validOrigin = originUrl.host === host;
    } catch (e) {
      // Invalid origin URL
      validOrigin = false;
    }
  } 
  // Fallback to Referer header
  else if (referer) {
    try {
      const refererUrl = new URL(referer);
      validOrigin = refererUrl.host === host;
    } catch (e) {
      // Invalid referer URL
      validOrigin = false;
    }
  }

  if (!validOrigin) {
    return res.status(403).json({ 
      message: 'Forbidden: Invalid origin or referer' 
    });
  }

  next();
}

/**
 * Enhanced CSRF Protection for Admin Routes
 * 
 * Additional protection for sensitive admin operations
 */
export function adminCsrfProtection(req: Request, res: Response, next: NextFunction) {
  // Apply standard CSRF protection first
  csrfProtection(req, res, (err) => {
    if (err) return next(err);

    // Additional checks for admin routes
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutationMethods.includes(req.method)) {
      return next();
    }

    // Ensure user is authenticated and is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Forbidden: Admin access required' 
      });
    }

    // Additional header validation for admin operations
    const contentType = req.get('Content-Type');
    if (contentType && !contentType.includes('application/json')) {
      return res.status(415).json({ 
        message: 'Unsupported Media Type: JSON required for admin operations' 
      });
    }

    next();
  });
}

/**
 * CSRF protection for file upload endpoints - allows multipart/form-data
 */
export function adminUploadCsrfProtection(req: Request, res: Response, next: NextFunction) {
  // Apply standard CSRF protection first
  csrfProtection(req, res, (err) => {
    if (err) return next(err);

    // Additional checks for admin routes
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutationMethods.includes(req.method)) {
      return next();
    }

    // Ensure user is authenticated and is admin
    if (!req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Forbidden: Admin access required' 
      });
    }

    // For upload endpoints, we allow multipart/form-data
    const contentType = req.get('Content-Type');
    if (contentType && !contentType.includes('multipart/form-data') && !contentType.includes('application/json')) {
      return res.status(415).json({ 
        message: 'Unsupported Media Type: multipart/form-data or JSON required' 
      });
    }

    next();
  });
}