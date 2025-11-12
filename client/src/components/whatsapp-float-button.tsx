import { useQuery } from "@tanstack/react-query";
import { SiWhatsapp } from "react-icons/si";

interface WhatsAppConfig {
  phoneNumber?: string;
  isActive?: boolean;
}

export default function WhatsAppFloatButton() {
  // Get WhatsApp config
  const { data: config } = useQuery<WhatsAppConfig>({
    queryKey: ['/api/whatsapp/public-config'],
    retry: false,
  });

  const handleClick = () => {
    if (config?.phoneNumber) {
      // Remove formatação do número
      const phoneNumber = config.phoneNumber.replace(/\D/g, '');
      const message = encodeURIComponent("Olá! Gostaria de saber mais sobre a VittaVerde.");
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      // Número padrão caso não esteja configurado
      const defaultPhone = "5541999999999"; // Substitua pelo seu número
      const message = encodeURIComponent("Olá! Gostaria de saber mais sobre a VittaVerde.");
      window.open(`https://wa.me/${defaultPhone}?text=${message}`, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="Falar no WhatsApp"
      data-testid="button-whatsapp-float"
    >
      <SiWhatsapp className="w-9 h-9 group-hover:scale-110 transition-transform" />
      
      {/* Tooltip */}
      <div className="absolute right-full mr-3 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        Fale conosco no WhatsApp
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>

      {/* Pulse ring animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
    </button>
  );
}
