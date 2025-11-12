import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      id: "1",
      name: "Maria Silva",
      condition: "Dor Crônica",
      rating: 5,
      text: "Depois de anos lidando com dor crônica, finalmente encontrei um tratamento que funciona. O processo foi muito simples e o suporte excepcional.",
      initials: "M"
    },
    {
      id: "2", 
      name: "João Santos",
      condition: "Ansiedade",
      rating: 5,
      text: "A ansiedade que me acompanhava há anos melhorou significativamente. O atendimento médico foi muito profissional e acolhedor.",
      initials: "J"
    },
    {
      id: "3",
      name: "Ana Costa",
      condition: "Epilepsia (filha)",
      rating: 5,
      text: "Como mãe de uma criança com epilepsia, estava preocupada com o processo legal. A VittaVerde nos guiou em cada etapa com segurança total.",
      initials: "A"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star 
        key={index}
        className={`h-4 w-4 ${index < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <section className="py-20 bg-white" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="testimonials-title">
            Depoimentos de Pacientes
          </h2>
          <p className="text-xl text-gray-600" data-testid="testimonials-description">
            Veja como o CBD mudou a vida dos nossos pacientes
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-gray-50 rounded-xl p-6"
              data-testid={`testimonial-${testimonial.id}`}
            >
              <div className="flex items-center mb-4" data-testid={`testimonial-rating-${testimonial.id}`}>
                <div className="flex">
                  {renderStars(testimonial.rating)}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic" data-testid={`testimonial-text-${testimonial.id}`}>
                "{testimonial.text}"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-vitta-primary rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.initials}
                </div>
                <div className="ml-3">
                  <p className="font-medium" data-testid={`testimonial-name-${testimonial.id}`}>
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500" data-testid={`testimonial-condition-${testimonial.id}`}>
                    {testimonial.condition}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
