import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Check, Clock } from "lucide-react";

export default function ANVISATracker() {
  // Mock current step - in real app, this would come from user data
  const currentStep = 2;

  const steps = [
    { id: 1, title: "Receita Médica", status: "completed" },
    { id: 2, title: "Documentação", status: "active" },
    { id: 3, title: "Análise ANVISA", status: "pending" },
    { id: 4, title: "Autorização", status: "pending" },
  ];

  const getStepIcon = (step: any) => {
    if (step.status === "completed") {
      return <Check className="h-4 w-4 text-white" />;
    }
    return <span className="text-white text-sm font-bold">{step.id}</span>;
  };

  const getStepColor = (step: any) => {
    if (step.status === "completed") return "bg-green-500";
    if (step.status === "active") return "bg-vitta-primary";
    return "bg-gray-300";
  };

  const getConnectorColor = (index: number) => {
    return index < currentStep - 1 ? "bg-green-500" : "bg-gray-300";
  };

  return (
    <section className="py-20 bg-white" data-testid="anvisa-tracker-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="anvisa-title">
            Intermediação ANVISA e Importação
          </h2>
          <p className="text-xl text-gray-600" data-testid="anvisa-description">
            Fazemos toda intermediação do processo ANVISA e importação pelo seu CPF conforme RDC 660/2022
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-gray-50 rounded-2xl p-8" data-testid="anvisa-tracker">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(step)}`}
                    data-testid={`step-indicator-${step.id}`}
                  >
                    {getStepIcon(step)}
                  </div>
                  <span 
                    className={`ml-3 text-sm font-medium ${
                      step.status === "completed" 
                        ? "text-gray-900" 
                        : step.status === "active" 
                        ? "text-vitta-primary" 
                        : "text-gray-500"
                    }`}
                    data-testid={`step-title-${step.id}`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-1 mx-4 ${getConnectorColor(index)}`}
                    data-testid={`connector-${index}`}
                  >
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Details */}
          <Card className="bg-white" data-testid="current-step-card">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-vitta-primary mr-3" />
                <h3 className="text-lg font-semibold" data-testid="current-step-title">
                  Envio de Documentação
                </h3>
                <Badge 
                  variant="secondary" 
                  className="ml-auto bg-yellow-100 text-yellow-800"
                  data-testid="current-step-status"
                >
                  Em Andamento
                </Badge>
              </div>
              <p className="text-gray-600 mb-4" data-testid="current-step-description">
                Nossa equipe está intermediando o envio de seus documentos à ANVISA. Todo processo é feito pelo seu CPF conforme legislação vigente.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm" data-testid="checklist-prescription">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Receita médica validada</span>
                </div>
                <div className="flex items-center text-sm" data-testid="checklist-documents">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Documentos pessoais anexados</span>
                </div>
                <div className="flex items-center text-sm" data-testid="checklist-form">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span>Formulário ANVISA em preparação</span>
                </div>
                <div className="flex items-center text-sm" data-testid="checklist-submission">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span>Envio para análise</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Timeline */}
          <div className="mt-6 bg-vitta-light rounded-lg p-4" data-testid="estimated-timeline">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-vitta-accent">
                Prazo estimado para aprovação:
              </span>
              <span className="text-lg font-bold text-vitta-primary" data-testid="estimated-time">
                2-5 dias úteis
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
