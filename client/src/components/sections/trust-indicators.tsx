export default function TrustIndicators() {
  const indicators = [
    { value: "1000+", label: "Pacientes Atendidos", delay: 0 },
    { value: "98%", label: "Aprovação ANVISA", delay: 0.1 },
    { value: "24h", label: "Prazo Médio", delay: 0.2 },
    { value: "100%", label: "Legal e Seguro", delay: 0.3 },
  ];

  return (
    <section className="bg-white py-16" data-testid="trust-indicators-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {indicators.map((indicator, index) => (
            <div 
              key={index}
              className="slide-in"
              style={{ animationDelay: `${indicator.delay}s` }}
              data-testid={`indicator-${index}`}
            >
              <div className="text-3xl font-bold text-vitta-primary mb-2" data-testid={`indicator-value-${index}`}>
                {indicator.value}
              </div>
              <p className="text-gray-600" data-testid={`indicator-label-${index}`}>
                {indicator.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
