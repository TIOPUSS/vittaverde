import { db } from "./db";
import { users, patients, consultants, doctors, products, doctorAvailability } from "@shared/schema";
import { hash } from "bcryptjs";

// SEED DATA - Dados iniciais para o banco de dados
// Este arquivo contém todos os dados necessários para inicializar o sistema

export async function seedDatabase() {
  console.log("🌱 Iniciando seed do banco de dados...");
  
  try {
    // 1. CRIAR USUÁRIOS BÁSICOS
    console.log("👥 Criando usuários...");
    
    // Admin
    const adminUser = await db.insert(users).values({
      username: "admin",
      email: "admin@vittaverde.com",
      password: await hash("admin123", 10),
      fullName: "Administrador VittaVerde",
      phone: "11999999999",
      role: "admin"
    }).returning();
    
    // Médicos
    const medico1User = await db.insert(users).values({
      username: "dra.silva",
      email: "ana.silva@vittaverde.com", 
      password: await hash("medico123", 10),
      fullName: "Dra. Ana Silva",
      phone: "11987654321",
      role: "doctor"
    }).returning();
    
    const medico2User = await db.insert(users).values({
      username: "dr.santos",
      email: "carlos.santos@vittaverde.com",
      password: await hash("medico123", 10), 
      fullName: "Dr. Carlos Santos",
      phone: "11987654322",
      role: "doctor"
    }).returning();
    
    const medico3User = await db.insert(users).values({
      username: "dra.costa",
      email: "maria.costa@vittaverde.com",
      password: await hash("medico123", 10),
      fullName: "Dra. Maria Costa", 
      phone: "11987654323",
      role: "doctor"
    }).returning();
    
    // Consultor
    const consultorUser = await db.insert(users).values({
      username: "consultor1",
      email: "consultor@vittaverde.com",
      password: await hash("consultor123", 10),
      fullName: "João Consultor",
      phone: "11987654324", 
      role: "consultant"
    }).returning();
    
    // Paciente de teste
    const pacienteUser = await db.insert(users).values({
      username: "paciente1", 
      email: "paciente@exemplo.com",
      password: await hash("paciente123", 10),
      fullName: "Maria Paciente Silva",
      phone: "11987654325",
      role: "patient"
    }).returning();
    
    console.log("✅ Usuários criados!");

    // 2. CRIAR PERFIS DE MÉDICOS
    console.log("👨‍⚕️ Criando perfis de médicos...");
    
    const doctor1 = await db.insert(doctors).values({
      userId: medico1User[0].id,
      crm: "CRM-SP 123456",
      specialization: "Neurologia - Cannabis Medicinal",
      isActive: true,
      workingHours: {
        monday: { start: "08:00", end: "18:00", enabled: true },
        tuesday: { start: "08:00", end: "18:00", enabled: true },
        wednesday: { start: "08:00", end: "18:00", enabled: true },
        thursday: { start: "08:00", end: "18:00", enabled: true },
        friday: { start: "08:00", end: "16:00", enabled: true },
        saturday: { start: "08:00", end: "12:00", enabled: false },
        sunday: { start: "08:00", end: "12:00", enabled: false }
      },
      consultationDuration: 60,
      breakBetweenConsultations: 15
    }).returning();
    
    const doctor2 = await db.insert(doctors).values({
      userId: medico2User[0].id,
      crm: "CRM-SP 234567", 
      specialization: "Oncologia - Tratamento da Dor",
      isActive: true,
      workingHours: {
        monday: { start: "09:00", end: "17:00", enabled: true },
        tuesday: { start: "09:00", end: "17:00", enabled: true },
        wednesday: { start: "09:00", end: "17:00", enabled: true },
        thursday: { start: "09:00", end: "17:00", enabled: true },
        friday: { start: "09:00", end: "15:00", enabled: true },
        saturday: { start: "09:00", end: "13:00", enabled: true },
        sunday: { start: "09:00", end: "13:00", enabled: false }
      },
      consultationDuration: 45,
      breakBetweenConsultations: 15
    }).returning();
    
    const doctor3 = await db.insert(doctors).values({
      userId: medico3User[0].id,
      crm: "CRM-SP 345678",
      specialization: "Psiquiatria - Ansiedade e Depressão", 
      isActive: true,
      workingHours: {
        monday: { start: "10:00", end: "19:00", enabled: true },
        tuesday: { start: "10:00", end: "19:00", enabled: true },
        wednesday: { start: "10:00", end: "19:00", enabled: true },
        thursday: { start: "10:00", end: "19:00", enabled: true },
        friday: { start: "10:00", end: "17:00", enabled: true },
        saturday: { start: "10:00", end: "14:00", enabled: false },
        sunday: { start: "10:00", end: "14:00", enabled: false }
      },
      consultationDuration: 50,
      breakBetweenConsultations: 10
    }).returning();
    
    console.log("✅ Médicos criados!");

    // 3. CRIAR DISPONIBILIDADES DOS MÉDICOS PARA OS PRÓXIMOS 30 DIAS
    console.log("📅 Criando disponibilidades dos médicos...");
    
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Pular finais de semana para alguns médicos
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Domingo = 0, Sábado = 6
      
      // Para cada médico, criar slots disponíveis
      for (const doctor of [doctor1[0], doctor2[0], doctor3[0]]) {
        const startHour = doctor.userId === doctor1[0].userId ? 8 : 
                         doctor.userId === doctor2[0].userId ? 9 : 10;
        const endHour = 17;
        const duration = doctor.consultationDuration;
        
        // Criar slots de manhã e tarde
        for (let hour = startHour; hour < endHour; hour += 2) {
          if (hour === 12) continue; // Pular horário de almoço
          
          const startTime = `${hour.toString().padStart(2, '0')}:00`;
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
          
          await db.insert(doctorAvailability).values({
            doctorId: doctor.id,
            date: date,
            startTime: startTime,
            endTime: endTime,
            isAvailable: true,
            type: "appointment",
            notes: "Consulta de Telemedicina"
          });
        }
      }
    }
    
    console.log("✅ Disponibilidades criadas!");

    // 4. CRIAR CONSULTOR
    console.log("👔 Criando consultor...");
    
    await db.insert(consultants).values({
      userId: consultorUser[0].id,
      crm: null,
      specialization: "Atendimento e Suporte ao Paciente",
      commissionRate: "0.15",
      isActive: true
    });
    
    console.log("✅ Consultor criado!");

    // 5. CRIAR PACIENTE DE EXEMPLO
    console.log("🤒 Criando paciente de exemplo...");
    
    await db.insert(patients).values({
      userId: pacienteUser[0].id,
      cpf: "123.456.789-00",
      birthDate: new Date("1985-05-15"),
      address: {
        street: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567"
      },
      healthCondition: "Ansiedade e Dores Crônicas",
      consultantId: null,
      anvisaStatus: "pending",
      anvisaNumber: null,
      trackingCode: "VV2024001"
    });
    
    console.log("✅ Paciente criado!");

    // 6. CRIAR PRODUTOS CBD
    console.log("🌿 Criando produtos CBD...");
    
    const products_data = [
      {
        name: "CBD Oil Full Spectrum 1000mg",
        description: "Óleo de CBD de espectro completo, ideal para ansiedade e dores crônicas",
        category: "oil",
        activeSubstances: [{ substance: "CBD", concentration: "33mg/ml" }],
        concentration: "1000mg (30ml)",
        volume: "30ml",
        manufacturer: "Charlotte's Web",
        origin: "Estados Unidos",
        anvisaRequired: true,
        prescriptionRequired: true,
        price: "299.90",
        imageUrl: "/public-objects/cbd-oil-1000mg.jpg",
        indications: ["Ansiedade", "Depressão", "Dores Crônicas", "Insônia"],
        contraindications: "Gravidez, amamentação, menores de 18 anos",
        sideEffects: "Sonolência, boca seca, tontura leve",
        dosageInstructions: "Iniciar com 0.25ml (8mg) duas vezes ao dia, aumentar gradualmente",
        isActive: true
      },
      {
        name: "CBD Gummies 25mg",
        description: "Gomas mastigáveis de CBD, sabor frutas vermelhas",
        category: "gummies", 
        activeSubstances: [{ substance: "CBD", concentration: "25mg por unidade" }],
        concentration: "25mg por goma",
        volume: "30 unidades",
        manufacturer: "Green Roads",
        origin: "Canadá",
        anvisaRequired: true,
        prescriptionRequired: true,
        price: "189.90",
        imageUrl: "/public-objects/cbd-gummies-25mg.jpg",
        indications: ["Ansiedade", "Distúrbios do Sono", "Relaxamento"],
        contraindications: "Gravidez, amamentação, menores de 18 anos",
        sideEffects: "Leve sonolência, relaxamento muscular",
        dosageInstructions: "1 goma ao dia, preferencialmente à noite",
        isActive: true
      },
      {
        name: "CBD Cream 500mg",
        description: "Creme tópico de CBD para aplicação local em dores musculares",
        category: "cream",
        activeSubstances: [{ substance: "CBD", concentration: "500mg por tubo" }],
        concentration: "500mg (50g)",
        volume: "50g",
        manufacturer: "PlusCBD Oil",
        origin: "Estados Unidos", 
        anvisaRequired: true,
        prescriptionRequired: true,
        price: "159.90",
        imageUrl: "/public-objects/cbd-cream-500mg.jpg",
        indications: ["Dores Musculares", "Artrite", "Inflamações Locais"],
        contraindications: "Feridas abertas, alergia a componentes",
        sideEffects: "Raramente irritação local",
        dosageInstructions: "Aplicar pequena quantidade na área afetada 2-3 vezes ao dia",
        isActive: true
      },
      {
        name: "CBD+THC Oil 1:1 Ratio",
        description: "Óleo balanceado CBD:THC para casos mais severos",
        category: "oil",
        activeSubstances: [
          { substance: "CBD", concentration: "15mg/ml" },
          { substance: "THC", concentration: "15mg/ml" }
        ],
        concentration: "CBD:THC 1:1 (30ml)",
        volume: "30ml",
        manufacturer: "Tilray",
        origin: "Canadá",
        anvisaRequired: true,
        prescriptionRequired: true,
        price: "449.90",
        imageUrl: "/public-objects/cbd-thc-oil-11.jpg",
        indications: ["Epilepsia", "Câncer", "Dores Severas", "Espasmos"],
        contraindications: "Gravidez, amamentação, menores de 18 anos, condução de veículos",
        sideEffects: "Sonolência, alteração de humor, boca seca, olhos vermelhos",
        dosageInstructions: "Iniciar com 0.1ml duas vezes ao dia, sob supervisão médica estrita",
        isActive: true
      }
    ];
    
    for (const product of products_data) {
      await db.insert(products).values(product);
    }
    
    console.log("✅ Produtos criados!");
    
    console.log("🎉 Seed do banco concluído com sucesso!");
    console.log(`
    📋 DADOS CRIADOS:
    
    👑 ADMIN:
    Email: admin@vittaverde.com
    Senha: admin123
    
    👨‍⚕️ MÉDICOS:
    1. Dra. Ana Silva (ana.silva@vittaverde.com) - Senha: medico123
    2. Dr. Carlos Santos (carlos.santos@vittaverde.com) - Senha: medico123  
    3. Dra. Maria Costa (maria.costa@vittaverde.com) - Senha: medico123
    
    👔 CONSULTOR:
    Email: consultor@vittaverde.com
    Senha: consultor123
    
    🤒 PACIENTE:
    Email: paciente@exemplo.com  
    Senha: paciente123
    
    🌿 PRODUTOS: 4 produtos CBD cadastrados
    📅 AGENDA: 30 dias de disponibilidade médica
    `);
    
  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
    throw error;
  }
}

// Função para limpar e recriar o banco
export async function resetDatabase() {
  console.log("🗑️ Limpando banco de dados...");
  
  try {
    // Deletar dados em ordem para respeitar foreign keys
    await db.delete(doctorAvailability);
    await db.delete(consultants);
    await db.delete(doctors);
    await db.delete(patients);
    await db.delete(products);
    await db.delete(users);
    
    console.log("✅ Banco limpo!");
    
    // Recriar dados
    await seedDatabase();
    
  } catch (error) {
    console.error("❌ Erro ao resetar banco:", error);
    throw error;
  }
}