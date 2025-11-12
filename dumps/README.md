# 🗄️ Backup do Banco de Dados VittaVerde

## 📦 Dump Atual

**vittaverde_completo_20251110.dump** (79KB)
- Data: 10/11/2025
- Formato: PostgreSQL Custom
- Conteúdo: Banco COMPLETO com estrutura e dados

## 🔄 Como Restaurar

```bash
# Restaurar banco completo
pg_restore --clean --if-exists -d $DATABASE_URL dumps/vittaverde_completo_20251110.dump
```

## ✅ Incluído neste Backup

- Estrutura completa do banco (tabelas, índices, constraints)
- Todos os dados:
  - Usuários e autenticação
  - Clientes e leads (CRM)
  - Produtos CBD
  - Consultas de parceiros via webhook
  - Configurações SSO de parceiros
  - Pedidos e rastreamento ANVISA
  - Sistema de afiliados/vendedores
  - Conteúdo educacional
  - Configurações do sistema

## 🛡️ Segurança

⚠️ Este arquivo contém dados sensíveis e NÃO deve ser compartilhado publicamente.
✅ Já está incluído no .gitignore

---
**VittaVerde Platform - Backup Automático**
