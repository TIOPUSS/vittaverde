#!/bin/bash

# 🚀 VittaVerde - Setup Script para VM
# Este script automatiza a configuração inicial da aplicação na VM

set -e  # Exit on error

echo "🌿 VittaVerde - Iniciando Setup da VM..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo -e "\n${YELLOW}1. Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 20+ primeiro.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION instalado${NC}"

# 2. Verificar PostgreSQL
echo -e "\n${YELLOW}2. Verificando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL não encontrado. Instale PostgreSQL primeiro.${NC}"
    exit 1
fi
POSTGRES_VERSION=$(psql --version)
echo -e "${GREEN}✅ $POSTGRES_VERSION instalado${NC}"

# 3. Verificar arquivo .env.production
echo -e "\n${YELLOW}3. Verificando arquivo .env.production...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Arquivo .env.production não encontrado!${NC}"
    echo -e "${YELLOW}📋 Criando template .env.production...${NC}"
    
    cat > .env.production << 'EOL'
# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/vittaverde

# Microsoft 365 Email
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_EMAIL_FROM=contato@vittaverde.com

# Session
SESSION_SECRET=

# Node Environment
NODE_ENV=production
PORT=5000

# Domain (opcional)
# DOMAIN=https://vittaverde.com
EOL
    
    echo -e "${YELLOW}⚠️  Template criado em .env.production${NC}"
    echo -e "${YELLOW}⚠️  EDITE O ARQUIVO com suas credenciais antes de continuar!${NC}"
    echo -e "${YELLOW}⚠️  Consulte VM_SETUP.md para instruções detalhadas${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Arquivo .env.production encontrado${NC}"

# 4. Verificar se credenciais foram configuradas
echo -e "\n${YELLOW}4. Verificando credenciais...${NC}"
source .env.production

if [ -z "$MICROSOFT_TENANT_ID" ] || [ -z "$MICROSOFT_CLIENT_ID" ] || [ -z "$MICROSOFT_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Credenciais Microsoft 365 não configuradas no .env.production${NC}"
    echo -e "${YELLOW}📋 Consulte VM_SETUP.md para obter as credenciais${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Credenciais configuradas${NC}"

# 5. Instalar dependências
echo -e "\n${YELLOW}5. Instalando dependências...${NC}"
npm install --production=false
echo -e "${GREEN}✅ Dependências instaladas${NC}"

# 6. Build da aplicação
echo -e "\n${YELLOW}6. Compilando aplicação...${NC}"
npm run build
echo -e "${GREEN}✅ Build concluído${NC}"

# 7. Configurar banco de dados
echo -e "\n${YELLOW}7. Configurando banco de dados...${NC}"
echo -e "${YELLOW}   Executando migrações...${NC}"
npm run db:push
echo -e "${GREEN}✅ Banco de dados configurado${NC}"

# 8. Configurar PM2 (se disponível)
echo -e "\n${YELLOW}8. Verificando PM2...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 encontrado${NC}"
    echo -e "${YELLOW}   Configurando PM2...${NC}"
    pm2 delete vittaverde 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✅ PM2 configurado${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 não encontrado. Instale com: npm install -g pm2${NC}"
    echo -e "${YELLOW}   Você pode iniciar manualmente com: npm start${NC}"
fi

# 9. Configurar permissões
echo -e "\n${YELLOW}9. Configurando permissões de segurança...${NC}"
chmod 600 .env.production
echo -e "${GREEN}✅ Permissões configuradas${NC}"

# 10. Teste de email (opcional)
echo -e "\n${YELLOW}10. Deseja testar o envio de email? (s/N)${NC}"
read -r RESPONSE
if [[ "$RESPONSE" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}    Digite o email para teste:${NC}"
    read -r TEST_EMAIL
    node test-email-vm.js "$TEST_EMAIL"
fi

# Sucesso!
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup concluído com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n📋 Próximos passos:\n"

if command -v pm2 &> /dev/null; then
    echo -e "  ${GREEN}•${NC} Aplicação está rodando com PM2"
    echo -e "  ${GREEN}•${NC} Ver logs: ${YELLOW}pm2 logs${NC}"
    echo -e "  ${GREEN}•${NC} Ver status: ${YELLOW}pm2 status${NC}"
    echo -e "  ${GREEN}•${NC} Reiniciar: ${YELLOW}pm2 restart vittaverde${NC}"
else
    echo -e "  ${GREEN}•${NC} Iniciar aplicação: ${YELLOW}npm start${NC}"
    echo -e "  ${GREEN}•${NC} Ou instale PM2: ${YELLOW}npm install -g pm2${NC}"
fi

echo -e "\n  ${GREEN}•${NC} Configure SSL/HTTPS com Nginx (veja VM_SETUP.md)"
echo -e "  ${GREEN}•${NC} Configure firewall: ${YELLOW}ufw allow 5000/tcp${NC}"
echo -e "\n🚀 VittaVerde pronto para produção!\n"
