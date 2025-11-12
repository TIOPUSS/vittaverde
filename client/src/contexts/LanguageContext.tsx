// Stub temporário - sistema 100% em português
export const useLanguage = () => {
  return {
    t: (key: string) => key, // Retorna a chave mesmo - páginas precisarão atualizar
    language: 'pt-BR',
    setLanguage: () => {},
  };
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => children;
