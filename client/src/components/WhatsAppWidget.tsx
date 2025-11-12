import { useState, useEffect } from "react";
import { MessageSquare, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Get WhatsApp config to fetch phone number
  const { data: config } = useQuery({
    queryKey: ['/api/whatsapp/public-config'],
    retry: false,
  });

  useEffect(() => {
    if (config?.phoneNumber) {
      // Format phone number for WhatsApp API (remove spaces and dashes)
      setPhoneNumber(config.phoneNumber.replace(/\D/g, ''));
    }
  }, [config]);

  const handleWhatsAppClick = () => {
    if (phoneNumber) {
      const message = encodeURIComponent("Olá! Gostaria de saber mais sobre os produtos VittaVerde.");
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    }
  };

  // Don't show widget if no phone number is configured or not active
  if (!config?.isActive || !phoneNumber) {
    return null;
  }

  return (
    <>
      {/* Widget button fixed bottom right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 animate-pulse"
          aria-label="Falar no WhatsApp"
          data-testid="button-whatsapp-open"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Expanded widget card */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <Card className="w-80 sm:w-96 shadow-2xl border-0 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 relative">
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                data-testid="button-whatsapp-close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* WhatsApp icon */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                Dúvidas? Estamos Aqui!
              </h3>

              {/* Description */}
              <p className="text-white/90 text-center text-sm">
                Nossa equipe especializada está pronta para te ajudar em qualquer etapa da jornada. Entre em contato agora mesmo via WhatsApp.
              </p>
            </div>

            {/* Content */}
            <CardContent className="p-6 bg-white">
              {/* 24/7 Badge */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-800">Atendimento 24/7</span>
                </div>
              </div>

              {/* WhatsApp Button */}
              <Button
                onClick={handleWhatsAppClick}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
                data-testid="button-whatsapp-chat"
              >
                <MessageSquare className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Falar no WhatsApp
                <span className="ml-2 text-xl">→</span>
              </Button>

              {/* Info text */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Resposta rápida • Suporte especializado • 100% confidencial
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
