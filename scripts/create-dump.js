#!/usr/bin/env node

/**
 * Script para criar dump do banco de dados VittaVerde
 * 
 * Este script gera um dump completo do banco PostgreSQL que pode ser
 * restaurado em qualquer outro ambiente PostgreSQL.
 * 
 * Uso: node scripts/create-dump.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada. Certifique-se de que o banco está configurado.');
  process.exit(1);
}

// Extrair informações da URL do banco
const dbUrl = new URL(DATABASE_URL);
const dbName = dbUrl.pathname.slice(1); // Remove a barra inicial
const dbUser = dbUrl.username;
const dbPassword = dbUrl.password;
const dbHost = dbUrl.hostname;
const dbPort = dbUrl.port || 5432;

// Nome do arquivo de dump com timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dumpFileName = `vittaverde-dump-${timestamp}.sql`;
const dumpPath = path.join(process.cwd(), dumpFileName);

console.log('🗃️  Criando dump do banco de dados VittaVerde...');
console.log(`📁 Arquivo: ${dumpFileName}`);

try {
  // Configurar variáveis de ambiente para pg_dump
  const env = {
    ...process.env,
    PGPASSWORD: dbPassword
  };

  // Comando pg_dump
  const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --verbose --clean --if-exists --create`;
  
  console.log('🔄 Executando pg_dump...');
  
  // Executar pg_dump e salvar no arquivo
  const output = execSync(command, { 
    env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50 // 50MB buffer
  });
  
  // Salvar o dump no arquivo
  fs.writeFileSync(dumpPath, output);
  
  // Verificar se o arquivo foi criado com sucesso
  const stats = fs.statSync(dumpPath);
  const fileSizeKB = Math.round(stats.size / 1024);
  
  console.log('✅ Dump criado com sucesso!');
  console.log(`📊 Tamanho: ${fileSizeKB} KB`);
  console.log(`📍 Local: ${dumpPath}`);
  
  // Instruções para restaurar
  console.log('\n📋 INSTRUÇÕES PARA RESTAURAR:');
  console.log('1. Copie o arquivo para o servidor de destino');
  console.log('2. Execute: psql -h HOST -p PORT -U USER -d DATABASE_NAME -f ' + dumpFileName);
  console.log('3. Ou use o pgAdmin/DBeaver para importar o arquivo');
  
  // Informações sobre o conteúdo
  console.log('\n📦 CONTEÚDO DO DUMP:');
  console.log('- ✅ Estrutura completa das tabelas');
  console.log('- ✅ Dados de usuários (admin, médicos, consultores, pacientes)');
  console.log('- ✅ Produtos CBD cadastrados');
  console.log('- ✅ Disponibilidades médicas');
  console.log('- ✅ Configurações e relacionamentos');
  
  console.log('\n🔐 CREDENCIAIS INCLUÍDAS NO DUMP:');
  console.log('Admin: admin@vittaverde.com / admin123');
  console.log('Médicos: ana.silva@vittaverde.com / medico123');
  console.log('Consultor: consultor@vittaverde.com / consultor123');
  console.log('Paciente: paciente@exemplo.com / paciente123');

} catch (error) {
  console.error('❌ Erro ao criar dump:', error.message);
  
  // Verificar se pg_dump está disponível
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
  } catch {
    console.error('\n💡 SOLUÇÃO: pg_dump não está instalível. Instale PostgreSQL client:');
    console.error('- Ubuntu/Debian: sudo apt-get install postgresql-client');
    console.error('- macOS: brew install postgresql');
    console.error('- Windows: Baixe PostgreSQL do site oficial');
  }
  
  process.exit(1);
}