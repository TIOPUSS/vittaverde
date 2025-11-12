import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userId = req.session.userId;
    
    // If no session, try to get from X-User-Id header (for Replit compatibility)
    if (!userId && req.headers['x-user-id']) {
      userId = req.headers['x-user-id'] as string;
    }
    
    // Check if user is authenticated via session or header
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get user from database
    const user = await storage.getUser(userId);
    if (!user) {
      // Clear invalid session if it exists
      if (req.session.userId) {
        req.session.destroy(() => {});
      }
      return res.status(401).json({ message: "Invalid session" });
    }

    // Store user in session for future requests if not already stored
    if (!req.session.userId && user.id) {
      req.session.userId = user.id;
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assumes requireAuth was already called and user is attached
    if (!req.user) {
      console.log(`[requireAdmin] ❌ No user attached to request`);
      return res.status(401).json({ message: "Authentication required" });
    }

    console.log(`[requireAdmin] 🔍 Checking user: ${req.user.email} (role: ${req.user.role})`);

    // Check if user is admin
    if (req.user.role !== "admin") {
      console.log(`[requireAdmin] ❌ Access denied for user: ${req.user.email} (role: ${req.user.role})`);
      return res.status(403).json({ 
        message: "Admin access required",
        currentRole: req.user.role,
        requiredRole: "admin"
      });
    }

    console.log(`[requireAdmin] ✅ Access granted for admin: ${req.user.email}`);
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Authorization error" });
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Assumes requireAuth was already called and user is attached
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: `Access restricted to: ${roles.join(', ')}` });
      }

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      res.status(500).json({ message: "Authorization error" });
    }
  };
};