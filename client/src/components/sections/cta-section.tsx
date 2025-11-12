import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Stethoscope, MessageCircle, Shield, UserRound, Truck } from "lucide-react";

export default function CTASection() {
  const features = [
    {
      icon: Shield,
      title: "100% Legal",
      description: "Conforme RDC 660/2022"
    },
    {
      icon: UserRound,
      title: "Médicos Especialistas",
      description: "Experiência em cannabis"
    },
    {
      icon: Truck,
      title: "Entrega Rápida",
      description: "Direto na sua casa"
    }
  ];

  return (
    <section className="py-20 gradient-bg text-white" data-testid="cta-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-6" data-testid="cta-title">
          Comece Sua Jornada de Bem-Estar
        </h2>
        <p className="text-xl mb-8 text-vitta-light" data-testid="cta-description">
          Lifestyle e bem-estar com Cannabis Medicinal - processo 100% legal e seguro
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/bem-estar">
            <button 
              className="bg-white text-green-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center border-0"
              data-testid="cta-schedule-consultation"
            >
              <Stethoscope className="mr-2 h-5 w-5" />
              Iniciar Minha Jornada de Bem-Estar
            </button>
          </Link>
          <a 
            href="https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre os produtos VittaVerde."
            target="_blank"
            rel="noopener noreferrer"
          >
            <button 
              className="border-2 border-white bg-transparent text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-green-700 transition-colors flex items-center justify-center"
              data-testid="cta-whatsapp"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Falar no WhatsApp
            </button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} data-testid={`cta-feature-${index}`}>
                <IconComponent className="mx-auto text-3xl mb-2 h-8 w-8" />
                <p className="font-medium" data-testid={`cta-feature-title-${index}`}>
                  {feature.title}
                </p>
                <p className="text-sm text-vitta-light" data-testid={`cta-feature-description-${index}`}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
