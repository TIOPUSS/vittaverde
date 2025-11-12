import { storage } from "./storage";

const sampleProducts = [
  // ÓLEOS CBD (4 produtos)
  {
    name: "CBD 3000 - Óleo Full Spectrum",
    description: "Óleo de CBD full spectrum de alta concentração, ideal para tratamento de dores crônicas, ansiedade e epilepsia. Contém terpenos naturais para efeito entourage.",
    category: "oil",
    activeSubstances: [
      { substance: "CBD", concentration: "3000mg/30ml" },
      { substance: "THC", concentration: "<0.2%" },
      { substance: "CBG", concentration: "150mg/30ml" }
    ],
    concentration: "100mg/ml",
    volume: "30ml",
    manufacturer: "Extractos del sur",
    origin: "Uruguai",
    price: "890.00",
    anvisaRequired: true,
    prescriptionRequired: true,
    indications: [
      "Epilepsia refratária",
      "Dores crônicas",
      "Ansiedade severa",
      "Transtorno do espectro autista",
      "Fibromialgia"
    ],
    contraindications: "Gravidez, amamentação, alergia a cannabis.",
    sideEffects: "Sonolência, boca seca, alterações do apetite.",
    dosageInstructions: "Iniciar com 0.25ml (25mg) duas vezes ao dia. Ajustar gradualmente conforme orientação médica.",
    imageUrl: "/assets/oil-cbd-3000.jpg"
  },
  {
    name: "CBD 1500 - Óleo de Cânhamo",
    description: "Óleo de CBD de concentração média, extraído de cânhamo industrial. Ideal para ansiedade, insônia e dores moderadas.",
    category: "oil",
    activeSubstances: [
      { substance: "CBD", concentration: "1500mg/30ml" },
      { substance: "CBN", concentration: "75mg/30ml" }
    ],
    concentration: "50mg/ml",
    volume: "30ml",
    manufacturer: "Litoral hemp",
    origin: "Uruguai",
    price: "520.00",
    anvisaRequired: true,
    prescriptionRequired: true,
    indications: [
      "Ansiedade generalizada",
      "Distúrbios do sono",
      "Dores articulares",
      "Síndrome do intestino irritável"
    ],
    contraindications: "Hipersensibilidade aos componentes.",
    sideEffects: "Leve sonolência, diminuição da pressão arterial.",
    dosageInstructions: "0.5ml (25mg) uma a duas vezes ao dia, preferencialmente antes de dormir.",
    imageUrl: "/assets/oil-cbd-1500.jpg"
  },
  {
    name: "CBD 6000 - Óleo Concentrado",
    description: "Óleo de CBD de altíssima concentração para casos severos. Uso exclusivamente médico supervisionado.",
    category: "oil",
    activeSubstances: [
      { substance: "CBD", concentration: "6000mg/30ml" },
      { substance: "CBDA", concentration: "300mg/30ml" }
    ],
    concentration: "200mg/ml",
    volume: "30ml",
    manufacturer: "KOBA",
    origin: "Paraguai",
    price: "1450.00",
    anvisaRequired: true,
    prescriptionRequired: true,
    indications: [
      "Epilepsia refratária severa",
      "Síndrome de Lennox-Gastaut",
      "Síndrome de Dravet",
      "Dores oncológicas"
    ],
    contraindications: "Insuficiência hepática severa, uso de varfarina.",
    sideEffects: "Sonolência intensa, alterações hepáticas, diarreia.",
    dosageInstructions: "Dose inicial 2.5mg/kg duas vezes ao dia. Titulação rigorosa sob supervisão médica.",
    imageUrl: "/assets/oil-cbd-6000.jpg"
  },
  {
    name: "CBD 750 - Óleo Iniciante",
    description: "Óleo de CBD de baixa concentração, ideal para iniciantes e crianças. Sabor natural de hortelã.",
    category: "oil",
    activeSubstances: [
      { substance: "CBD", concentration: "750mg/30ml" },
      { substance: "Terpenos", concentration: "Natural" }
    ],
    concentration: "25mg/ml",
    volume: "30ml",
    manufacturer: "Extractos del sur",
    origin: "Uruguai",
    price: "320.00",
    anvisaRequired: true,
    prescriptionRequired: true,
    indications: [
      "Ansiedade leve",
      "Transtorno de déficit de atenção",
      "Dores de cabeça",
      "Síndrome pré-menstrual"
    ],
    contraindications: "Menores de 2 anos sem supervisão especializada.",
    sideEffects: "Raros: leve sonolência.",
    dosageInstructions: "2-4 gotas (2.5-5mg) duas vezes ao dia. Para crianças, seguir rigorosamente prescrição médica.",
    imageUrl: "/assets/oil-cbd-750.jpg"
  },

  // GOMAS CBD (3 produtos)
  {
    name: "Gomas CBD 10mg - Frutas Vermelhas",
    description: "Gomas mastigáveis de CBD com sabor natural de frutas vermelhas. Dosagem precisa e sabor agradável.",
    category: "gummies",
    activeSubstances: [
      { substance: "CBD", concentration: "10mg por goma" },
      { substance: "Vitamina D3", concentration: "400UI por goma" }
    ],
    concentration: "10mg/unidade",
    volume: "30 unidades",
    manufacturer: "Litoral hemp",
    origin: "Uruguai",
    price: "280.00",
    anvisaRequired: true,
    prescriptionRequired: true,
    indications: [
      "Ansiedade social",
      "Dores musculares pós-exercício",
      "Insônia leve",
      "Suporte ao bem-estar geral"
    ],
    contraindications: "Diabetes descompensado, alergia a gelatina.",
    sideEffects: "Alterações no paladar, leve sonolência.",
    dosageInstructions: "1-2 gomas ao dia, preferencialmente 1 hora antes de dormir.",
    imageUrl: "/assets/gummies-cbd-10mg.jpg"
  },
  {
    name: "Gomas CBD+CBN 15mg - Sono",
    description: "Gomas especiais para distúrbios do sono, combinando CBD com CBN (cannabinol) para efeito sedativo natural.",
    category: "gummies",
    activeSubstances: [
      { substance: "CBD", concentration: "10mg por goma" },
      { substance: "CBN", concentration: "5mg por goma" },
      { substance: "Melatonina", concentration: "3mg por goma" }
    ],
    concentration: "15mg/unidade",
    volume: "20 unidades",
    manufacturer: "KOBA",
    origin: "Paraguai",
    price: "350.00",
    anvisaRequired: true,
    prescriptionRequired: true,
    indications: [
      "Insônia crônica",
      "Distúrbios do ritmo circadiano",
      "Ansiedade noturna",
      "Síndrome das pernas inquietas"
    ],
    contraindications: "Uso de benzodiazepínicos, trabalho noturno.",
    sideEffects: "Sonolência prolongada, tontura matinal.",
    dosageInstructions: "1 goma 30 minutos antes de dormir. Não dirigir após o uso.",
    imageUrl: "/assets/gummies-sleep.jpg"
  },
  {
    name: "Gomas CBD 25mg - Dor",
    description: "Gomas de alta concentração para tratamento de dores crônicas e inflamação. Fórmula com cúrcuma.",
    category: "gummies",
    activeSubstances: [
      { substance: "CBD", concentration: "25mg por goma" },
      { substance: "Curcumina", concentration: "100mg por goma" },
      { substance: "Gengibre", concentration: "50mg por goma" }
    ],
    concentration: "25mg/unidade",
    volume: "20 unidades",
    manufacturer: "Extractos del sur",
    origin: "Uruguai",
    price: "420.00",
    anvisaRequired: true,
    prescriptionRequired: true,
    indications: [
      "Artrite reumatóide",
      "Fibromialgia",
      "Dores pós-cirúrgicas",
      "Dores neuropáticas"
    ],
    contraindications: "Úlcera péptica ativa, uso de anticoagulantes.",
    sideEffects: "Desconforto gástrico leve, alterações no paladar.",
    dosageInstructions: "1 goma de 8 em 8 horas durante crises de dor. Máximo 3 gomas/dia.",
    imageUrl: "/assets/gummies-pain.jpg"
  },

  // CREMES CBD (2 produtos)
  {
    name: "Creme CBD 500mg - Alívio Tópico",
    description: "Creme tópico com CBD para aplicação local em dores musculares e articulares. Absorção rápida.",
    category: "cream",
    activeSubstances: [
      { substance: "CBD", concentration: "500mg/100g" },
      { substance: "Mentol", concentration: "2%" },
      { substance: "Arnica", concentration: "5%" }
    ],
    concentration: "5mg/g",
    volume: "100g",
    manufacturer: "Litoral hemp",
    origin: "Uruguai",
    price: "380.00",
    anvisaRequired: false,
    prescriptionRequired: true,
    indications: [
      "Dores musculares localizadas",
      "Artrite localizada",
      "Contusões e hematomas",
      "Dores pós-treino"
    ],
    contraindications: "Feridas abertas, hipersensibilidade cutânea.",
    sideEffects: "Possível irritação cutânea local.",
    dosageInstructions: "Aplicar camada fina na área afetada 2-3 vezes ao dia. Massagear até absorção.",
    imageUrl: "/assets/cream-cbd-500.jpg"
  },
  {
    name: "Creme CBD+CBC 1000mg - Anti-Inflamatório",
    description: "Creme de alta concentração com CBD e CBC para inflamações severas e dores articulares intensas.",
    category: "cream",
    activeSubstances: [
      { substance: "CBD", concentration: "800mg/100g" },
      { substance: "CBC", concentration: "200mg/100g" },
      { substance: "Capsaicina", concentration: "0.025%" }
    ],
    concentration: "10mg/g",
    volume: "100g",
    manufacturer: "KOBA",
    origin: "Paraguai",
    price: "540.00",
    anvisaRequired: false,
    prescriptionRequired: true,
    indications: [
      "Artrite severa",
      "Bursite",
      "Tendinite crônica",
      "Neuropatia periférica"
    ],
    contraindications: "Pele sensível, alergia a pimentas.",
    sideEffects: "Sensação de calor local, vermelhidão temporária.",
    dosageInstructions: "Aplicar pequena quantidade na área afetada 2 vezes ao dia. Lavar as mãos após aplicação.",
    imageUrl: "/assets/cream-cbd-1000.jpg"
  },

  // COSMÉTICOS CBD (2 produtos)
  {
    name: "Sérum Facial CBD 100mg - Anti-Idade",
    description: "Sérum facial com CBD, ácido hialurônico e vitamina C para rejuvenescimento e hidratação profunda.",
    category: "cosmetic",
    activeSubstances: [
      { substance: "CBD", concentration: "100mg/30ml" },
      { substance: "Ácido Hialurônico", concentration: "1%" },
      { substance: "Vitamina C", concentration: "10%" }
    ],
    concentration: "3.3mg/ml",
    volume: "30ml",
    manufacturer: "Extractos del sur",
    origin: "Uruguai",
    price: "450.00",
    anvisaRequired: false,
    prescriptionRequired: false,
    indications: [
      "Envelhecimento cutâneo",
      "Ressecamento facial",
      "Inflamação da pele",
      "Acne leve"
    ],
    contraindications: "Alergia a cannabis ou ácido hialurônico.",
    sideEffects: "Possível irritação inicial em peles sensíveis.",
    dosageInstructions: "Aplicar 2-3 gotas no rosto limpo, massagear suavemente. Usar manhã e noite.",
    imageUrl: "/assets/serum-cbd.jpg"
  },
  {
    name: "Bálsamo Labial CBD 25mg",
    description: "Bálsamo labial hidratante com CBD para lábios ressecados e rachados. Proteção natural.",
    category: "cosmetic",
    activeSubstances: [
      { substance: "CBD", concentration: "25mg/15g" },
      { substance: "Manteiga de Karité", concentration: "20%" },
      { substance: "Cera de Abelha", concentration: "15%" }
    ],
    concentration: "1.67mg/g",
    volume: "15g",
    manufacturer: "Litoral hemp",
    origin: "Uruguai",
    price: "120.00",
    anvisaRequired: false,
    prescriptionRequired: false,
    indications: [
      "Lábios ressecados",
      "Rachadura labial",
      "Proteção contra intempéries",
      "Herpes labial (suporte)"
    ],
    contraindications: "Alergia a produtos apícolas.",
    sideEffects: "Raros: reação alérgica local.",
    dosageInstructions: "Aplicar nos lábios sempre que necessário. Ideal usar antes de exposição ao sol ou vento.",
    imageUrl: "/assets/lip-balm-cbd.jpg"
  },

  // TÓPICOS CBD (1 produto)
  {
    name: "Spray Tópico CBD 750mg - Articulações",
    description: "Spray tópico de aplicação rápida para dores articulares e musculares. Fórmula com absorção instantânea.",
    category: "topical",
    activeSubstances: [
      { substance: "CBD", concentration: "750mg/100ml" },
      { substance: "CBG", concentration: "150mg/100ml" },
      { substance: "Salicilato de Metila", concentration: "10%" }
    ],
    concentration: "7.5mg/ml",
    volume: "100ml",
    manufacturer: "KOBA",
    origin: "Paraguai",
    price: "320.00",
    anvisaRequired: false,
    prescriptionRequired: true,
    indications: [
      "Dores articulares agudas",
      "Contraturas musculares",
      "Dores do exercício",
      "Artrite localizada"
    ],
    contraindications: "Alergia a salicilatos, feridas abertas.",
    sideEffects: "Possível irritação cutânea, odor forte.",
    dosageInstructions: "Borrifar 2-3 vezes na área afetada e massagear. Usar até 4 vezes ao dia.",
    imageUrl: "/assets/spray-cbd.jpg"
  }
];

export async function seedProducts() {
  console.log("🌱 Criando produtos CBD para demonstração...");
  
  try {
    for (const product of sampleProducts) {
      await storage.createProduct(product);
      console.log(`✅ Criado: ${product.name}`);
    }
    
    console.log(`🎉 ${sampleProducts.length} produtos CBD criados com sucesso!`);
    console.log("\nCategorias disponíveis:");
    console.log("- Óleos (4): Concentrações de 750mg a 6000mg");
    console.log("- Gomas (3): Para ansiedade, sono e dor");
    console.log("- Cremes (2): Aplicação tópica anti-inflamatória");
    console.log("- Cosméticos (2): Cuidados com a pele");
    console.log("- Tópicos (1): Spray para articulações");
    
    console.log("\nFornecedores disponíveis:");
    console.log("- Extractos del sur (Uruguai): 4 produtos");
    console.log("- Litoral hemp (Uruguai): 4 produtos");
    console.log("- KOBA (Paraguai): 4 produtos");
    
  } catch (error) {
    console.error("❌ Erro ao criar produtos:", error);
  }
}

// Executar se chamado diretamente
seedProducts().then(() => {
  console.log("✨ Seed completo!");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erro no seed:", error);
  process.exit(1);
});