# 🌿 VittaVerde - Plataforma Cannabis Medicinal

Plataforma completa para intermediação da importação de produtos CBD com autorização ANVISA e prescrição médica especializada. Sistema regulamentado pela RDC 660/2022.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Deploy em VM](#-deploy-em-vm)
- [Desenvolvimento Local](#-desenvolvimento-local)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🎯 Visão Geral

VittaVerde é uma plataforma brasileira pioneira que facilita o acesso legal a produtos medicinais de CBD, gerenciando toda a jornada do paciente:

1. **Telemedicina** - Consultas com médicos especializados
2. **ANVISA** - Assistência para autorização regulatória
3. **Importação** - Intermediação da importação de produtos
4. **Acompanhamento** - Monitoramento da jornada do paciente

---

## ✨ Funcionalidades

### Autenticação & Segurança
- ✅ Sistema de verificação de email com código de 6 dígitos
- ✅ Autenticação role-based (Paciente, Consultor, Médico, Admin)
- ✅ Integração Microsoft 365 para envio de emails
- ✅ Admin bypass de verificação
- ✅ Validação de telefone internacional
- ✅ Sessões seguras com PostgreSQL

### Gestão de Pacientes
- 📋 Formulário de intake médico (patologias)
- 📊 Dashboard de bem-estar
- 🏥 Histórico de consultas
- 📄 Upload de documentos (prescrição, ANVISA)
- 📦 Rastreamento de pedidos

### Sistema CRM
- 🎯 Kanban de leads com drag & drop
- 📝 Histórico de interações
- 📊 Dashboard de vendas
- 👥 Gestão de equipe

### E-commerce
- 🛒 Catálogo de produtos CBD
- 💳 Checkout configurável (múltiplos gateways)
- 📦 Gestão de estoque
- 🚚 Rastreamento de entrega

### Painel Médico
- 👨‍⚕️ Prontuário eletrônico
- 📝 Sistema de prescrições
- 📊 Acompanhamento de pacientes
- 🔬 Calculadora de dosagem

### Universidade
- 📚 Cursos profissionais
- 📰 Artigos e notícias
- 🎥 Vídeos educacionais
- 📖 Base de conhecimento

---

## 🛠 Tecnologias

### Frontend
- **React** com TypeScript
- **Vite** - Build tool moderno
- **Wouter** - Roteamento leve
- **TanStack Query** - Gerenciamento de estado server
- **Shadcn/ui** - Componentes UI (Radix UI)
- **Tailwind CSS** - Estilização

### Backend
- **Node.js** + **Express**
- **TypeScript** com ES modules
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** (Neon serverless)
- **Passport.js** - Autenticação

### Integrações
- **Microsoft 365** - Envio de emails transacionais
- **Object Storage** - Upload de arquivos
- **Payment Gateways** - Stripe, Asaas, PagSeguro, etc.

---

## 🚀 Deploy em VM

### Pré-requisitos
- VM Linux (Ubuntu/Debian)
- Node.js 20+
- PostgreSQL
- Conta Microsoft 365

### Guia Rápido

1. **Clone o projeto**
```bash
git clone [repositório]
cd vittaverde
npm install
```

2. **Configure .env.production**
```bash
cp .env.example .env.production
# Edite com suas credenciais
```

3. **Execute setup**
```bash
./setup-vm.sh
```

4. **Inicie com PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 📚 Documentação Completa
- 📋 [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) - Checklist completo
- 📖 [VM_SETUP.md](VM_SETUP.md) - Guia detalhado
- ⚙️ [ecosystem.config.js](ecosystem.config.js) - Configuração PM2

---

## 💻 Desenvolvimento Local

### Instalação
```bash
npm install
```

### Configurar .env
```bash
# Copie o template
cp .env.example .env

# Configure suas variáveis
DATABASE_URL=postgresql://...
MICROSOFT_CLIENT_ID=...
# etc.
```

### Iniciar Desenvolvimento
```bash
npm run dev
```

Aplicação disponível em: `http://localhost:5000`

### Comandos Úteis
```bash
npm run dev          # Inicia dev server
npm run build        # Build para produção
npm run db:push      # Sincroniza schema com DB
npm run db:studio    # Drizzle Studio (GUI)
```

---

## 📁 Estrutura do Projeto

```
vittaverde/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── lib/          # Utilitários e configs
│   │   └── App.tsx       # App principal
│   └── index.html
│
├── server/                # Backend Node.js
│   ├── routes.ts         # Rotas da API
│   ├── auth.ts           # Autenticação
│   ├── db.ts             # Configuração DB
│   ├── email-service.ts  # Serviço de email
│   └── index.ts          # Servidor Express
│
├── shared/               # Código compartilhado
│   └── schema.ts        # Schema Drizzle + Zod
│
├── scripts/             # Scripts utilitários
│   └── test-email.js   # Teste de email
│
├── .env.example         # Template de variáveis
├── ecosystem.config.js  # Configuração PM2
├── drizzle.config.ts   # Configuração Drizzle
├── vite.config.ts      # Configuração Vite
└── package.json        # Dependências
```

---

## 🔐 Segurança

- 🔒 Senhas hasheadas com bcrypt
- 🛡️ Proteção CSRF
- 📝 Validação de dados com Zod
- 🔑 Sessões seguras com PostgreSQL
- ✉️ Verificação de email obrigatória
- 👤 Controle de acesso baseado em roles

---

## 📧 Sistema de Email

### Desenvolvimento (Replit)
- OAuth2 com Microsoft Graph API
- Configuração via Azure AD

### Produção (VM)
- SMTP Office 365
- Credenciais seguras via .env.production

### Teste
```bash
node scripts/test-email.js
```

---

## 🧪 Testes

O sistema inclui verificação de email com código de 6 dígitos:

1. **Registro** → Código enviado por email
2. **Verificação** → Validação do código
3. **Auto-login** → Sessão criada automaticamente
4. **Redirecionamento** → Cliente vai para /patologias

---

## 📊 Monitoramento (Produção)

```bash
# Status PM2
pm2 status

# Logs em tempo real
pm2 logs

# Monitoramento
pm2 monit
```

---

## 🆘 Suporte

### Problemas Comuns

**Email não envia**
- Verifique credenciais no .env
- Confirme permissões no Azure AD
- Teste: `node scripts/test-email.js`

**Erro de banco**
- Verifique PostgreSQL: `systemctl status postgresql`
- Execute: `npm run db:push --force`

**Aplicação não inicia**
- Veja logs: `pm2 logs`
- Verifique variáveis de ambiente
- Teste: `npm start`

---

## 📄 Licença

© 2025 VittaVerde. Todos os direitos reservados.

---

## 🌱 Status do Projeto

**✅ PRODUCTION READY**

Sistema completo, testado e pronto para deploy em VM com:
- Verificação de email com código de 6 dígitos
- Integração Microsoft 365
- Validação internacional de telefone
- Sistema de autenticação completo
- Documentação de deploy completa

---

**Desenvolvido com 💚 para revolucionar o acesso a cannabis medicinal no Brasil**
