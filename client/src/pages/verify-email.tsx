import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already_verified'>('loading');
  const [message, setMessage] = useState('');
  
  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Verify email
  const { data, error, isLoading } = useQuery({
    queryKey: ['/api/verify-email', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('Token não fornecido');
      }
      
      const response = await fetch(`/api/verify-email?token=${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 410) {
          throw new Error('expired');
        }
        throw new Error(data.message || 'Erro ao verificar email');
      }
      
      return data;
    },
    enabled: !!token,
    retry: false
  });

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('Token de verificação não encontrado na URL');
      return;
    }

    if (data) {
      if (data.alreadyVerified) {
        setVerificationStatus('already_verified');
        setMessage(data.message);
      } else if (data.verified) {
        setVerificationStatus('success');
        setMessage(data.message);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          if (data.user?.role === 'client') {
            setLocation('/bem-estar');
          } else if (data.user?.role === 'admin') {
            setLocation('/admin/dashboard');
          } else if (data.user?.role === 'doctor') {
            setLocation('/medico/centro-medico');
          } else if (data.user?.role === 'consultant') {
            setLocation('/comercial/crm');
          } else {
            setLocation('/');
          }
        }, 3000);
      }
    }

    if (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'expired') {
        setVerificationStatus('expired');
        setMessage('O link de verificação expirou. Solicite um novo email de verificação.');
      } else {
        setVerificationStatus('error');
        setMessage(errorMessage);
      }
    }
  }, [data, error, token, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {verificationStatus === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verificando Email...</CardTitle>
              <CardDescription>Aguarde enquanto validamos seu email</CardDescription>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl text-emerald-600">Email Verificado!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {verificationStatus === 'already_verified' && (
            <>
              <div className="mx-auto mb-4">
                <AlertCircle className="w-16 h-16 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-600">Email Já Verificado</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {verificationStatus === 'expired' && (
            <>
              <div className="mx-auto mb-4">
                <AlertCircle className="w-16 h-16 text-amber-600" />
              </div>
              <CardTitle className="text-2xl text-amber-600">Link Expirado</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Erro na Verificação</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {verificationStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800 text-center">
                <strong>Redirecionando automaticamente...</strong><br />
                Você será redirecionado para sua área em alguns segundos.
              </p>
            </div>
          )}

          {(verificationStatus === 'error' || verificationStatus === 'expired' || verificationStatus === 'already_verified') && (
            <div className="flex gap-2">
              <Button
                onClick={() => setLocation('/login')}
                className="flex-1"
                data-testid="button-login"
              >
                Ir para Login
              </Button>
              {verificationStatus === 'expired' && (
                <Button
                  onClick={() => setLocation('/resend-verification')}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-resend"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reenviar
                </Button>
              )}
            </div>
          )}

          {verificationStatus === 'success' && (
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full"
              data-testid="button-home"
            >
              Voltar ao Início
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
