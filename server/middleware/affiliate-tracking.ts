import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    affiliateCode?: string;
  }
}

export async function affiliateTrackingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Tentar capturar código de afiliado de duas formas:
    // 1. Query parameter: ?ref=CODIGO
    let affiliateCode = req.query.ref as string;
    let shouldRedirect = false;
    
    // 2. URL path: vittaverde.com/codigo-vendedor
    if (!affiliateCode && req.path) {
      const pathSegments = req.path.split('/').filter(s => s.length > 0);
      
      // Se o primeiro segmento da URL não for uma rota conhecida, pode ser um código de afiliado
      const knownRoutes = [
        'login', 'registro', 'produtos', 'loja', 'carrinho', 'como-funciona',
        'anvisa', 'patologias', 'bem-estar', 'politica-privacidade', 'termos-uso',
        'admin', 'medico', 'comercial', 'vendedor', 'paciente', 'universidade',
        'verify-email', 'verify-code', 'api', 'assets', 'src', 'node_modules'
      ];
      
      if (pathSegments.length === 1 && !knownRoutes.includes(pathSegments[0].toLowerCase())) {
        affiliateCode = pathSegments[0].toUpperCase();
        shouldRedirect = true;
        console.log(`[AFFILIATE] Detected potential affiliate code in path: ${affiliateCode}`);
      }
    }

    if (affiliateCode && typeof affiliateCode === "string") {
      console.log(`[AFFILIATE] Checking if ${affiliateCode} is a valid vendor...`);
      const { affiliateService } = await import("../services/affiliate.service");
      
      const vendor = await affiliateService.getVendorByAffiliateCode(affiliateCode);
      
      if (vendor) {
        console.log(`[AFFILIATE] ✅ Valid vendor found: ${vendor.fullName}`);
        
        // Salvar código de afiliado na sessão
        if (req.session.affiliateCode !== affiliateCode) {
          req.session.affiliateCode = affiliateCode;
          
          const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
          const userAgent = req.headers['user-agent'];
          const referrer = req.headers['referer'] || req.headers['referrer'];

          await affiliateService.trackClick(
            affiliateCode,
            ipAddress,
            userAgent,
            referrer as string
          );
          
          console.log(`[AFFILIATE] 📊 Click tracked: ${affiliateCode} from IP ${ipAddress}`);
        }
        
        // Se veio da URL limpa, redirecionar para home
        if (shouldRedirect) {
          console.log(`[AFFILIATE] ↪️ Redirecting to home with affiliate code saved`);
          return res.redirect('/');
        }
      } else {
        console.log(`[AFFILIATE] ❌ No vendor found with code: ${affiliateCode}`);
      }
    }

    next();
  } catch (error) {
    console.error("[AFFILIATE] Error in affiliate tracking middleware:", error);
    next();
  }
}
