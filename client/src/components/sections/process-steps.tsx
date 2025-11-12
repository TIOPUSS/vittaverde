import { Search, UserRound, Tag, Truck } from "lucide-react";

export default function ProcessSteps() {
  const steps = [
    {
      icon: Search,
      title: "1. Avaliação",
      description: "Identificamos se você tem indicação para uso de CBD medicinal"
    },
    {
      icon: UserRound,
      title: "2. Consulta Médica", 
      description: "Consulta por telemedicina com médicos parceiros certificados"
    },
    {
      icon: Tag,
      title: "3. Autorização",
      description: "Auxiliamos no processo de autorização da ANVISA"
    },
    {
      icon: Truck,
      title: "4. Receba em Casa",
      description: "Intermediação da importação legal pelo seu CPF e entrega segura no seu endereço"
    }
  ];

  return (
    <section id="processo" className="py-20 bg-gray-50" data-testid="process-steps-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="process-title">
            Como Funciona
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="process-description">
            Processo simples e totalmente legal para acesso ao CBD medicinal
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={index}
                className="card-hover bg-white rounded-xl p-6 text-center shadow-md"
                data-testid={`process-step-${index + 1}`}
              >
                <div className="w-16 h-16 bg-vitta-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="text-white text-xl h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2" data-testid={`step-title-${index + 1}`}>
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm" data-testid={`step-description-${index + 1}`}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
