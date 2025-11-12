import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie, Shield } from "lucide-react";
import { Link } from "wouter";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já aceitou os cookies
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Delay para não aparecer imediatamente
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              {/* Icon */}
              <div className="hidden lg:flex flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Cookie className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="lg:hidden flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Cookie className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      Nós utilizamos cookies
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Utilizamos cookies essenciais e de análise para melhorar sua experiência em nossa plataforma. 
                      Ao continuar navegando, você concorda com nossa{' '}
                      <Link 
                        href="/politica-privacidade" 
                        className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                        target="_blank"
                      >
                        Política de Privacidade
                      </Link>
                      {' '}e{' '}
                      <Link 
                        href="/termos-uso" 
                        className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                        target="_blank"
                      >
                        Termos de Uso
                      </Link>.
                    </p>
                  </div>
                </div>

                {/* Privacy Note */}
                <div className="flex items-start gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-green-800">
                    <strong>Seus dados estão protegidos.</strong> Utilizamos cookies apenas para funcionalidades essenciais e análise de uso anônimo.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
                <Button
                  onClick={handleAccept}
                  className="w-full sm:flex-1 lg:w-48 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all"
                  data-testid="button-accept-cookies"
                >
                  Aceitar Cookies
                </Button>
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="w-full sm:flex-1 lg:w-48 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl transition-all"
                  data-testid="button-reject-cookies"
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
