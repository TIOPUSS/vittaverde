import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CartProvider } from "@/hooks/useCart";
import WhatsAppFloatButton from "@/components/whatsapp-float-button";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/cookie-consent";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ComoFunciona from "@/pages/como-funciona";
import Anvisa from "@/pages/anvisa";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/dashboard/admin";
import PatientDashboard from "@/pages/dashboard/patient";
import DoctorDashboard from "@/pages/dashboard/doctor";
import ConsultantDashboard from "@/pages/dashboard/consultant";
import VendorDashboard from "@/pages/vendedor/dashboard";
import VendorReports from "@/pages/vendedor/relatorios";
import AdminUsers from "@/pages/admin/users";
import AdminProducts from "@/pages/admin/products";
import AdminTags from "@/pages/admin/tags";
import AdminContentManagement from "@/pages/admin/content-management";
import AdminN8nConfig from "@/pages/admin/n8n-config";
import AdminStockControl from "@/pages/admin/stock-control";
import AdminLeadStages from "@/pages/admin/lead-stages";
import AdminFinanceiro from "@/pages/admin/financeiro";
import AdminCustos from "@/pages/admin/custos";
import AdminPedidos from "@/pages/admin/pedidos";
import AdminPacienteBemEstar from "@/pages/admin/paciente-bem-estar";
import AdminWhatsappConfig from "@/pages/admin/whatsapp-config";
import AdminEmailConfig from "@/pages/admin/email-config";
import AdminSmsConfig from "@/pages/admin/sms-config";
import AdminYampiConfig from "@/pages/admin/yampi-config";
import AdminIntegrations from "@/pages/admin/integrations";
import AdminConfiguracoes from "@/pages/admin/configuracoes";
import AdminPartnerIntegrations from "@/pages/admin/partner-integrations";
import ComercialCRM from "@/pages/comercial/crm";
import MedicoCentroMedico from "@/pages/medico/centro-medico";
import MedicoPacientes from "@/pages/medico/pacientes";
import MedicoUniversidade from "@/pages/medico/universidade";
import MedicoHistorico from "@/pages/medico/historico";
import MedicoEducacional from "@/pages/medico/educacional";
import MedicoCalculadora from "@/pages/medico/calculadora";
import MedicoLaboratorio from "@/pages/medico/laboratorio";
import MedicoConteudo from "@/pages/medico/conteudo";
import PacientePedidos from "@/pages/paciente/pedidos";
import PacienteCheckout from "@/pages/paciente/checkout";
import PacienteUniversidade from "@/pages/paciente/universidade";
import PacienteConteudo from "@/pages/paciente/conteudo";
import ComercialConteudo from "@/pages/comercial/conteudo";
import ComercialUniversidade from "@/pages/comercial/universidade";
import BemEstar from "@/pages/bem-estar";
import Patologias from "@/pages/patologias";
import Loja from "@/pages/loja";
import Carrinho from "@/pages/carrinho";
import PoliticaPrivacidade from "@/pages/politica-privacidade";
import TermosUso from "@/pages/termos-uso";
import VerifyEmail from "@/pages/verify-email";
import VerifyCode from "@/pages/verify-code";
import ForgotPassword from "@/pages/forgot-password";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/produtos" component={Loja} />
      <Route path="/loja" component={Loja} />
      <Route path="/carrinho" component={Carrinho} />
      <Route path="/como-funciona" component={ComoFunciona} />
      <Route path="/anvisa" component={Anvisa} />
      <Route path="/patologias" component={Patologias} />
      <Route path="/bem-estar" component={BemEstar} />
      <Route path="/politica-privacidade" component={PoliticaPrivacidade} />
      <Route path="/termos-uso" component={TermosUso} />
      <Route path="/login" component={Login} />
      <Route path="/esqueci-senha" component={ForgotPassword} />
      <Route path="/registro" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/verificar-email" component={VerifyCode} />
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/paciente" component={PatientDashboard} />
      <Route path="/medico">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><DoctorDashboard /></ProtectedRoute>
      </Route>
      <Route path="/comercial">
        <ProtectedRoute allowedRoles={["consultant", "admin"]}><ConsultantDashboard /></ProtectedRoute>
      </Route>
      <Route path="/vendedor">
        <ProtectedRoute allowExternalVendor={true}><VendorDashboard /></ProtectedRoute>
      </Route>
      
      {/* Protected functionality pages - only accessible after login */}
      <Route path="/admin/usuarios">
        <ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>
      </Route>
      <Route path="/admin/produtos">
        <ProtectedRoute allowedRoles={["admin"]}><AdminProducts /></ProtectedRoute>
      </Route>
      <Route path="/admin/tags">
        <ProtectedRoute allowedRoles={["admin"]}><AdminTags /></ProtectedRoute>
      </Route>
      <Route path="/admin/content-management">
        <ProtectedRoute allowedRoles={["admin"]}><AdminContentManagement /></ProtectedRoute>
      </Route>
      <Route path="/admin/gestao-conteudo">
        <ProtectedRoute allowedRoles={["admin"]}><AdminContentManagement /></ProtectedRoute>
      </Route>
      <Route path="/admin/n8n-config">
        <ProtectedRoute allowedRoles={["admin"]}><AdminN8nConfig /></ProtectedRoute>
      </Route>
      <Route path="/admin/estoque">
        <ProtectedRoute allowedRoles={["admin"]}><AdminStockControl /></ProtectedRoute>
      </Route>
      <Route path="/admin/lead-stages">
        <ProtectedRoute allowedRoles={["admin"]}><AdminLeadStages /></ProtectedRoute>
      </Route>
      <Route path="/admin/financeiro">
        <ProtectedRoute allowedRoles={["admin"]}><AdminFinanceiro /></ProtectedRoute>
      </Route>
      <Route path="/admin/custos">
        <ProtectedRoute allowedRoles={["admin"]}><AdminCustos /></ProtectedRoute>
      </Route>
      <Route path="/admin/pedidos">
        <ProtectedRoute allowedRoles={["admin"]}><AdminPedidos /></ProtectedRoute>
      </Route>
      <Route path="/admin/whatsapp-config">
        <ProtectedRoute allowedRoles={["admin"]}><AdminWhatsappConfig /></ProtectedRoute>
      </Route>
      <Route path="/admin/email-config">
        <ProtectedRoute allowedRoles={["admin"]}><AdminEmailConfig /></ProtectedRoute>
      </Route>
      <Route path="/admin/sms-config">
        <ProtectedRoute allowedRoles={["admin"]}><AdminSmsConfig /></ProtectedRoute>
      </Route>
      <Route path="/admin/yampi-config">
        <ProtectedRoute allowedRoles={["admin"]}><AdminYampiConfig /></ProtectedRoute>
      </Route>
      <Route path="/admin/integrations">
        <ProtectedRoute allowedRoles={["admin"]}><AdminIntegrations /></ProtectedRoute>
      </Route>
      <Route path="/admin/partner-integrations">
        <ProtectedRoute allowedRoles={["admin"]}><AdminPartnerIntegrations /></ProtectedRoute>
      </Route>
      <Route path="/admin/configuracoes">
        <ProtectedRoute allowedRoles={["admin"]}><AdminConfiguracoes /></ProtectedRoute>
      </Route>
      <Route path="/admin/paciente/:id/bem-estar">
        <ProtectedRoute allowedRoles={["admin", "doctor"]}><AdminPacienteBemEstar /></ProtectedRoute>
      </Route>
      <Route path="/comercial/crm">
        <ProtectedRoute><ComercialCRM /></ProtectedRoute>
      </Route>
      <Route path="/medico/centro-medico">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoCentroMedico /></ProtectedRoute>
      </Route>
      <Route path="/medico/pacientes">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoPacientes /></ProtectedRoute>
      </Route>
      <Route path="/medico/universidade">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoUniversidade /></ProtectedRoute>
      </Route>
      <Route path="/medico/historico">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoHistorico /></ProtectedRoute>
      </Route>
      <Route path="/medico/educacional">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoEducacional /></ProtectedRoute>
      </Route>
      <Route path="/medico/calculadora">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoCalculadora /></ProtectedRoute>
      </Route>
      <Route path="/medico/laboratorio">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoLaboratorio /></ProtectedRoute>
      </Route>
      <Route path="/medico/conteudo/:id">
        <ProtectedRoute allowedRoles={["doctor", "admin"]}><MedicoConteudo /></ProtectedRoute>
      </Route>
      <Route path="/paciente/pedidos">
        <ProtectedRoute><PacientePedidos /></ProtectedRoute>
      </Route>
      <Route path="/paciente/checkout/:productId">
        <ProtectedRoute><PacienteCheckout /></ProtectedRoute>
      </Route>
      <Route path="/paciente/universidade">
        <ProtectedRoute><PacienteUniversidade /></ProtectedRoute>
      </Route>
      <Route path="/paciente/conteudo/:id">
        <ProtectedRoute><PacienteConteudo /></ProtectedRoute>
      </Route>
      <Route path="/comercial/universidade">
        <ProtectedRoute allowedRoles={["consultant", "admin"]}><ComercialUniversidade /></ProtectedRoute>
      </Route>
      <Route path="/comercial/conteudo/:id">
        <ProtectedRoute allowedRoles={["consultant", "admin"]}><ComercialConteudo /></ProtectedRoute>
      </Route>

      {/* Vendor Routes */}
      <Route path="/vendedor/relatorios">
        <ProtectedRoute allowedRoles={["vendor", "admin"]}><VendorReports /></ProtectedRoute>
      </Route>
      <Route path="/vendedor/universidade">
        <ProtectedRoute allowedRoles={["vendor", "admin"]}><ComercialUniversidade /></ProtectedRoute>
      </Route>
      <Route path="/vendedor/conteudo/:id">
        <ProtectedRoute allowedRoles={["vendor", "admin"]}><ComercialConteudo /></ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <ScrollToTop />
          <Toaster />
          <Router />
          <WhatsAppFloatButton />
          <CookieConsent />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
