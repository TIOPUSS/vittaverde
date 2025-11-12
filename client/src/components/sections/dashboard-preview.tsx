import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingBag, Zap, RotateCcw, Calendar, MessageCircle } from "lucide-react";

export default function DashboardPreview() {
  const sampleOrders = [
    {
      id: "1",
      product: "Óleo CBD 600mg",
      date: "05/03/2024",
      status: "delivered",
      statusLabel: "Entregue"
    },
    {
      id: "2",
      product: "Creme CBD 500mg",
      date: "Processando",
      status: "processing",
      statusLabel: "Em andamento"
    }
  ];

  return (
    <section className="py-20 bg-gray-50" data-testid="dashboard-preview-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="dashboard-title">
            Seu Painel Pessoal
          </h2>
          <p className="text-xl text-gray-600" data-testid="dashboard-description">
            Gerencie todo seu tratamento em um só lugar
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Treatment Overview */}
          <Card className="bg-white shadow-md" data-testid="preview-treatment-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Meu Tratamento</CardTitle>
              <Heart className="h-5 w-5 text-vitta-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produto Atual:</span>
                  <span className="font-medium" data-testid="preview-current-product">
                    Óleo CBD 600mg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dosagem:</span>
                  <span className="font-medium" data-testid="preview-dosage">
                    0.5ml, 2x ao dia
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Próxima Consulta:</span>
                  <span className="font-medium text-vitta-primary" data-testid="preview-next-consultation">
                    15/03/2024
                  </span>
                </div>
              </div>
              <Button 
                className="w-full mt-4 bg-vitta-light text-vitta-primary hover:bg-vitta-primary hover:text-white transition-colors"
                data-testid="preview-view-details"
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>

          {/* Orders History */}
          <Card className="bg-white shadow-md" data-testid="preview-orders-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Meus Pedidos</CardTitle>
              <ShoppingBag className="h-5 w-5 text-vitta-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sampleOrders.map((order, index) => (
                  <div 
                    key={order.id} 
                    className={`border-l-4 pl-3 ${
                      order.status === "delivered" ? "border-green-500" : "border-blue-500"
                    }`}
                    data-testid={`preview-order-${index}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm" data-testid={`preview-order-product-${index}`}>
                          {order.product}
                        </p>
                        <p className="text-xs text-gray-500" data-testid={`preview-order-date-${index}`}>
                          {order.date}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`${
                          order.status === "delivered" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}
                        data-testid={`preview-order-status-${index}`}
                      >
                        {order.statusLabel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-4 bg-vitta-light text-vitta-primary hover:bg-vitta-primary hover:text-white transition-colors"
                data-testid="preview-view-all-orders"
              >
                Ver Todos
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white shadow-md" data-testid="preview-actions-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
              <Zap className="h-5 w-5 text-vitta-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-vitta-primary text-white py-3 rounded-lg font-medium hover:bg-vitta-accent transition-colors flex items-center justify-center"
                  data-testid="preview-repeat-order"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Repetir Último Pedido
                </Button>
                <Button 
                  variant="outline"
                  className="w-full py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                  data-testid="preview-schedule-consultation"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Consulta
                </Button>
                <Button 
                  variant="outline"
                  className="w-full py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                  data-testid="preview-contact-support"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar com Suporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Link href="/login" className="inline-block">
            <Button 
              className="bg-vitta-primary text-white hover:bg-vitta-accent px-8 py-3 rounded-lg font-medium"
              data-testid="preview-access-dashboard"
            >
              Acessar Meu Painel Completo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
