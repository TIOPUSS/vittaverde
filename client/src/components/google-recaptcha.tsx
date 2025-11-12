import { useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    recaptchaScriptLoaded?: boolean;
  }
}

interface GoogleReCaptchaProps {
  onVerify: (token: string) => void;
  action?: string;
}

export function GoogleReCaptcha({ onVerify, action = "submit" }: GoogleReCaptchaProps) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (!siteKey) {
      console.error("[reCAPTCHA] VITE_RECAPTCHA_SITE_KEY não configurada");
      // Mesmo sem reCAPTCHA, deixa o usuário prosseguir (fallback)
      onVerify("no-recaptcha-configured");
      return;
    }

    if (hasExecuted.current) {
      return;
    }

    const loadAndExecute = async () => {
      try {
        // Verificar se já existe um script carregado
        const existingScript = document.querySelector(`script[src*="google.com/recaptcha"]`);
        
        if (!existingScript && !window.recaptchaScriptLoaded) {
          // Criar e carregar o script apenas se não existir
          const script = document.createElement("script");
          script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
          script.async = true;
          script.defer = true;
          
          // Adicionar evento de load
          script.onload = () => {
            window.recaptchaScriptLoaded = true;
          };
          
          script.onerror = () => {
            console.error("[reCAPTCHA] Erro ao carregar script");
            // Fallback: deixa o usuário prosseguir
            onVerify("recaptcha-script-failed");
          };
          
          document.body.appendChild(script);
        }

        // Aguardar o reCAPTCHA estar pronto
        const waitForRecaptcha = () => {
          return new Promise<void>((resolve) => {
            if (window.grecaptcha?.ready) {
              window.grecaptcha.ready(() => resolve());
            } else {
              // Tentar novamente após 500ms
              setTimeout(() => {
                if (window.grecaptcha?.ready) {
                  window.grecaptcha.ready(() => resolve());
                } else {
                  // Após 2 tentativas, prosseguir sem reCAPTCHA
                  console.warn("[reCAPTCHA] Timeout - prosseguindo sem verificação");
                  resolve();
                }
              }, 500);
            }
          });
        };

        await waitForRecaptcha();

        // Executar reCAPTCHA
        if (window.grecaptcha?.execute && !hasExecuted.current) {
          hasExecuted.current = true;
          const token = await window.grecaptcha.execute(siteKey, { action });
          onVerify(token);
        } else if (!hasExecuted.current) {
          // Fallback se não conseguiu executar
          console.warn("[reCAPTCHA] grecaptcha.execute não disponível");
          hasExecuted.current = true;
          onVerify("recaptcha-unavailable");
        }
      } catch (error) {
        console.error("[reCAPTCHA] Erro geral:", error);
        if (!hasExecuted.current) {
          hasExecuted.current = true;
          // Fallback: deixa o usuário prosseguir
          onVerify("recaptcha-error");
        }
      }
    };

    loadAndExecute();
  }, [siteKey, action, onVerify]);

  return null; // reCAPTCHA v3 é invisível
}
