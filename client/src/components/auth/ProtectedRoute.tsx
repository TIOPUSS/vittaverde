import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, LogIn, AlertCircle } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowExternalVendor?: boolean; // Permitir vendedores externos (flag isExternalVendor)
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, allowExternalVendor = false, redirectTo = "/login" }: ProtectedRouteProps) {
  const { isLoggedIn, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  // useAuth hook now handles localStorage fallback automatically
  const effectiveUser = user;
  const effectiveIsLoggedIn = isLoggedIn;

  useEffect(() => {
    if (!isLoading && !effectiveIsLoggedIn) {
      setLocation(redirectTo);
    }
  }, [isLoading, effectiveIsLoggedIn, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!effectiveIsLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você precisa estar logado para acessar esta página.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation("/login")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check access permissions
  // Allow if: user has allowed role OR user is external vendor (when allowed)
  const hasRoleAccess = allowedRoles && allowedRoles.length > 0 
    ? allowedRoles.includes(effectiveUser?.role || '')
    : true;
  
  const hasExternalVendorAccess = allowExternalVendor && effectiveUser?.isExternalVendor;
  
  // Deny access if neither role nor external vendor condition is met
  if (allowedRoles || allowExternalVendor) {
    if (!effectiveUser || (!hasRoleAccess && !hasExternalVendorAccess)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Você não tem permissão para acessar esta página.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => setLocation(`/${effectiveUser?.role || 'dashboard'}`)}
                variant="outline"
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}