import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Shield, Stethoscope } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Partner {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  specialties?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

export default function PartnerSSOWidget() {
  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/partner/available"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Médicos Parceiros
          </CardTitle>
          <CardDescription>Conecte-se diretamente com nossos especialistas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!partners || partners.length === 0) {
    return null;
  }

  const handlePartnerClick = (partnerId: string) => {
    // Redireciona para o endpoint que gera o JWT e faz o SSO
    window.location.href = `/api/partner/redirect/${partnerId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Médicos Parceiros
        </CardTitle>
        <CardDescription>Acesse seu médico especialista com um clique</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="flex items-center gap-3 p-3 rounded-md border hover-elevate active-elevate-2 cursor-pointer transition-colors"
            onClick={() => handlePartnerClick(partner.id)}
            data-testid={`partner-item-${partner.id}`}
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={partner.logoUrl} alt={partner.name} />
              <AvatarFallback>
                <Stethoscope className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{partner.name}</h3>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
              {partner.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{partner.description}</p>
              )}
              {partner.specialties && partner.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {partner.specialties.slice(0, 3).map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {partner.specialties.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{partner.specialties.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="pt-2 text-xs text-muted-foreground border-t">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Login seguro - seus dados serão enviados automaticamente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
