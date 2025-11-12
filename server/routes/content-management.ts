import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth";

// Schemas para conteúdo educacional
const educationalContentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  content: z.string().min(50, "Conteúdo deve ter pelo menos 50 caracteres"),
  contentType: z.enum(["article", "video", "course"]).default("article"),
  category: z.enum(["basics", "advanced", "clinical", "research", "cannabis-types"]),
  specialty: z.enum(["general", "neurology", "oncology", "psychiatry", "pain-management"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number().min(1, "Duração deve ser pelo menos 1 minuto"),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  targetAudience: z.enum(["doctor", "patient", "both"]).default("patient"),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metadata: z.any().optional() // Para armazenar módulos do curso
}).refine((data) => {
  // Se for curso, deve ter pelo menos 1 módulo com 1 lição
  if (data.contentType === 'course') {
    if (!data.metadata || !data.metadata.modules || data.metadata.modules.length === 0) {
      return false;
    }
    // Verificar se cada módulo tem pelo menos 1 lição
    for (const module of data.metadata.modules) {
      if (!module.lessons || module.lessons.length === 0) {
        return false;
      }
    }
  }
  return true;
}, {
  message: "Cursos devem ter pelo menos 1 módulo com 1 lição",
  path: ["metadata"]
});

const medicalNewsSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(50, "Conteúdo deve ter pelo menos 50 caracteres"),
  summary: z.string().min(20, "Resumo deve ter pelo menos 20 caracteres"),
  source: z.string().min(1, "Fonte é obrigatória"),
  category: z.enum(["research", "regulations", "clinical", "industry", "education"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  externalUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  publishedAt: z.string().datetime().optional()
});

const scientificArticleSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  abstract: z.string().min(100, "Resumo deve ter pelo menos 100 caracteres"),
  authors: z.array(z.string()).min(1, "Pelo menos um autor é obrigatório"),
  journal: z.string().min(1, "Revista é obrigatória"),
  doi: z.string().optional().or(z.literal("")),
  pubmedId: z.string().optional().or(z.literal("")),
  specialty: z.enum(["general", "neurology", "oncology", "psychiatry", "pain-management", "pediatrics"]),
  keywords: z.array(z.string()).min(3, "Pelo menos 3 palavras-chave são obrigatórias"),
  impactFactor: z.number().min(0).optional(),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  publishedAt: z.string().datetime().optional(),
  featured: z.boolean().default(false)
});

export function registerContentManagementRoutes(app: Express) {
  
  // =====================
  // ROTAS PÚBLICAS (UNIVERSIDADES)
  // =====================
  
  // Buscar conteúdo educacional por público-alvo (público - para universidades)
  app.get("/api/university/educational-content", async (req, res) => {
    try {
      const { audience } = req.query;
      
      if (!audience || (audience !== 'doctor' && audience !== 'patient' && audience !== 'both')) {
        return res.status(400).json({ message: "Parâmetro 'audience' inválido. Use: doctor, patient ou both" });
      }
      
      // Buscar conteúdo de todas as fontes
      const [manualContent, n8nContent] = await Promise.all([
        storage.getEducationalContentBySource('manual'),
        storage.getEducationalContentBySource('n8n')
      ]);
      
      // Combinar conteúdo
      let allContent = [
        ...manualContent.map((c: any) => ({ ...c, source: 'manual' })),
        ...n8nContent.map((c: any) => ({ ...c, source: 'n8n' }))
      ];
      
      // Filtrar por audiência e status ativo
      allContent = allContent.filter((c: any) => {
        const isActive = c.isActive || c.status === 'active';
        const matchesAudience = c.targetAudience === audience || c.targetAudience === 'both';
        return isActive && matchesAudience;
      });
      
      // Ordenar por prioridade e data
      allContent.sort((a: any, b: any) => {
        // Primeiro destaque
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        
        // Depois por data
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      });
      
      res.json(allContent);
    } catch (error) {
      console.error("Error fetching university content:", error);
      res.status(500).json({ message: "Error fetching content" });
    }
  });

  // Buscar conteúdo educacional específico por ID (público - para visualização)
  app.get("/api/university/educational-content/:id", async (req, res) => {
    try {
      const content = await storage.getEducationalContentById(req.params.id);
      
      if (!content) {
        return res.status(404).json({ message: "Conteúdo não encontrado" });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching educational content by ID:", error);
      res.status(500).json({ message: "Error fetching content" });
    }
  });
  
  // =====================
  // ESTATÍSTICAS GERAIS
  // =====================
  
  // Buscar estatísticas de conteúdo (duas modalidades: telemedicina + sistema interno)
  app.get("/api/admin/content-stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      console.log('[CONTENT-STATS] API called - fetching data from database...');
      
      // Buscar dados das duas modalidades
      const [
        manualEducational,
        manualNews, 
        manualArticles,
        n8nEducational,
        n8nNews,
        n8nArticles,
        telemedicineConsultations,
        telemedicineRecords
      ] = await Promise.all([
        // Conteúdo manual (sistema interno)
        storage.getEducationalContentBySource('manual'),
        storage.getMedicalNewsBySource('manual'),
        storage.getScientificArticlesBySource('manual'),
        
        // Conteúdo N8N (automático)
        storage.getEducationalContentBySource('n8n'),
        storage.getMedicalNewsBySource('n8n'),
        storage.getScientificArticlesBySource('n8n'),
        
        // Dados de telemedicina
        storage.getTelemedicineConsultations(),
        storage.getMedicalRecords()
      ]);

      // Combinar conteúdo educacional para contagem por audiência
      const allEducational = [...manualEducational, ...n8nEducational];
      const doctorContent = allEducational.filter((c: any) => c.targetAudience === 'doctor').length;
      const patientContent = allEducational.filter((c: any) => c.targetAudience === 'patient').length;

      // Contar APENAS conteúdo ativo
      const activeManualEducational = manualEducational.filter((c: any) => c.isActive || c.status === 'active');
      const activeManualNews = manualNews.filter((c: any) => c.status === 'published');
      const activeManualArticles = manualArticles.filter((c: any) => c.status === 'published');
      const activeN8nEducational = n8nEducational.filter((c: any) => c.isActive || c.status === 'active');
      const activeN8nNews = n8nNews.filter((c: any) => c.status === 'published');
      const activeN8nArticles = n8nArticles.filter((c: any) => c.status === 'published');

      const stats = {
        // Conteúdo por fonte (APENAS conteúdo ativo)
        manualContent: activeManualEducational.length + activeManualNews.length + activeManualArticles.length,
        n8nContent: activeN8nEducational.length + activeN8nNews.length + activeN8nArticles.length,
        telemedicineContent: telemedicineConsultations.length + telemedicineRecords.length,
        
        // Total ativo
        totalActive: (activeManualEducational.length + 
                     activeManualNews.length + 
                     activeManualArticles.length +
                     activeN8nEducational.length + 
                     activeN8nNews.length + 
                     activeN8nArticles.length),
        
        // Conteúdo por audiência (campos que faltavam!)
        doctorContent: doctorContent,
        patientContent: patientContent,
        
        // Breakdown por tipo
        educational: {
          manual: manualEducational.length,
          n8n: n8nEducational.length,
          total: manualEducational.length + n8nEducational.length
        },
        news: {
          manual: manualNews.length,
          n8n: n8nNews.length,
          total: manualNews.length + n8nNews.length
        },
        articles: {
          manual: manualArticles.length,
          n8n: n8nArticles.length,
          total: manualArticles.length + n8nArticles.length
        },
        
        // Dados telemedicina
        telemedicine: {
          consultations: telemedicineConsultations.length,
          medicalRecords: telemedicineRecords.length,
          total: telemedicineConsultations.length + telemedicineRecords.length
        }
      };

      console.log('[CONTENT-STATS] Returning stats:', JSON.stringify(stats, null, 2));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching content statistics:", error);
      res.status(500).json({ message: "Error fetching content statistics" });
    }
  });

  // ==============================
  // CONTEÚDO EDUCACIONAL (MANUAL)
  // ==============================
  
  // Listar conteúdo educacional com filtros (integra todas as fontes)
  app.get("/api/admin/educational-content", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { category, specialty, source, limit = 50, offset = 0 } = req.query;
      
      // Buscar de todas as fontes
      const [manualContent, n8nContent] = await Promise.all([
        storage.getEducationalContentBySource('manual'),
        storage.getEducationalContentBySource('n8n')
      ]);

      // Combinar e padronizar dados
      let allContent = [
        ...manualContent.map((c: any) => ({ ...c, source: 'manual' })),
        ...n8nContent.map((c: any) => ({ ...c, source: 'n8n' }))
      ];

      // Aplicar filtros
      if (category && category !== 'all') {
        allContent = allContent.filter(c => c.category === category);
      }
      if (specialty && specialty !== 'all') {
        allContent = allContent.filter(c => c.specialty === specialty);
      }
      if (source && source !== 'all') {
        allContent = allContent.filter(c => c.source === source);
      }

      // Ordenar por data de criação (mais recente primeiro)
      allContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Paginação
      const startIndex = parseInt(offset as string);
      const limitNum = parseInt(limit as string);
      const paginatedContent = allContent.slice(startIndex, startIndex + limitNum);

      res.json(paginatedContent);
    } catch (error) {
      console.error("Error fetching educational content:", error);
      res.status(500).json({ message: "Error fetching educational content" });
    }
  });

  // Criar novo conteúdo educacional (manual)
  app.post("/api/admin/educational-content", requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = educationalContentSchema.parse(req.body);
      
      const content = await storage.createEducationalContent({
        ...validatedData,
        source: 'manual', // Marca como conteúdo manual
        createdBy: req.user!.id, // ID do admin que criou
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json({ 
        message: "Conteúdo educacional criado com sucesso", 
        content 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating educational content:", error);
      res.status(500).json({ message: "Error creating educational content" });
    }
  });

  // Atualizar conteúdo educacional
  app.put("/api/admin/educational-content/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Buscar o conteúdo existente para validação
      const existing = await storage.getEducationalContentById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Conteúdo não encontrado" });
      }

      // Validação base para update (campos opcionais)
      const updateSchema = z.object({
        title: z.string().min(1).optional(),
        description: z.string().min(10).optional(),
        content: z.string().min(50).optional(),
        contentType: z.enum(["article", "video", "course"]).optional(),
        category: z.enum(["basics", "advanced", "clinical", "research", "cannabis-types"]).optional(),
        specialty: z.enum(["general", "neurology", "oncology", "psychiatry", "pain-management"]).optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        duration: z.number().min(1).optional(),
        tags: z.array(z.string()).optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
        videoUrl: z.string().url().optional().or(z.literal("")),
        targetAudience: z.enum(["doctor", "patient", "both"]).optional(),
        featured: z.boolean().optional(),
        isActive: z.boolean().optional(),
        metadata: z.any().optional()
      }).refine((data) => {
        // Determinar o tipo final após merge
        const finalType = data.contentType || existing.contentType;
        
        // Se o tipo final for "course", validar estrutura
        if (finalType === 'course') {
          // Usar metadata do update ou do existente
          const finalMetadata = data.metadata !== undefined ? data.metadata : existing.metadata;
          
          if (!finalMetadata || !finalMetadata.modules || !Array.isArray(finalMetadata.modules)) {
            return false;
          }
          if (finalMetadata.modules.length === 0) {
            return false;
          }
          // Verificar se todos os módulos têm pelo menos 1 lição válida
          return finalMetadata.modules.every((module: any) => {
            if (!module.lessons || !Array.isArray(module.lessons) || module.lessons.length === 0) {
              return false;
            }
            // Verificar se todas as lições têm estrutura mínima (title)
            return module.lessons.every((lesson: any) => 
              lesson && typeof lesson === 'object' && lesson.title && lesson.title.trim().length > 0
            );
          });
        }
        return true;
      }, {
        message: "Cursos devem ter pelo menos 1 módulo com pelo menos 1 lição válida (com título)",
        path: ["metadata"]
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      const content = await storage.updateEducationalContent(req.params.id, {
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: req.user!.id
      });

      res.json({ 
        message: "Conteúdo educacional atualizado com sucesso", 
        content 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating educational content:", error);
      res.status(500).json({ message: "Error updating educational content" });
    }
  });

  // Deletar conteúdo educacional
  app.delete("/api/admin/educational-content/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteEducationalContent(req.params.id);
      res.json({ message: "Conteúdo educacional deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting educational content:", error);
      res.status(500).json({ message: "Error deleting educational content" });
    }
  });

  // ========================
  // NOTÍCIAS MÉDICAS (MANUAL)
  // ========================
  
  // Listar notícias médicas com filtros (integra todas as fontes)
  app.get("/api/admin/medical-news", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { category, priority, source, limit = 50, offset = 0 } = req.query;
      
      // Buscar de todas as fontes
      const [manualNews, n8nNews] = await Promise.all([
        storage.getMedicalNewsBySource('manual'),
        storage.getMedicalNewsBySource('n8n')
      ]);

      let allNews = [
        ...manualNews.map((n: any) => ({ ...n, source: 'manual' })),
        ...n8nNews.map((n: any) => ({ ...n, source: 'n8n' }))
      ];

      // Aplicar filtros
      if (category && category !== 'all') {
        allNews = allNews.filter(n => n.category === category);
      }
      if (priority && priority !== 'all') {
        allNews = allNews.filter(n => n.priority === priority);
      }
      if (source && source !== 'all') {
        allNews = allNews.filter(n => n.source === source);
      }

      // Ordenar por prioridade e data
      allNews.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      // Paginação
      const startIndex = parseInt(offset as string);
      const limitNum = parseInt(limit as string);
      const paginatedNews = allNews.slice(startIndex, startIndex + limitNum);

      res.json(paginatedNews);
    } catch (error) {
      console.error("Error fetching medical news:", error);
      res.status(500).json({ message: "Error fetching medical news" });
    }
  });

  // Criar nova notícia médica (manual)
  app.post("/api/admin/medical-news", requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = medicalNewsSchema.parse(req.body);
      
      const news = await storage.createMedicalNews({
        ...validatedData,
        source: 'manual',
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date(),
        createdBy: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'published'
      });

      res.status(201).json({ 
        message: "Notícia médica criada com sucesso", 
        news 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating medical news:", error);
      res.status(500).json({ message: "Error creating medical news" });
    }
  });

  // =============================
  // ARTIGOS CIENTÍFICOS (MANUAL)
  // =============================
  
  // Listar artigos científicos com filtros (integra todas as fontes)
  app.get("/api/admin/scientific-articles", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { specialty, journal, source, limit = 50, offset = 0 } = req.query;
      
      // Buscar de todas as fontes
      const [manualArticles, n8nArticles] = await Promise.all([
        storage.getScientificArticlesBySource('manual'),
        storage.getScientificArticlesBySource('n8n')
      ]);

      let allArticles = [
        ...manualArticles.map((a: any) => ({ ...a, source: 'manual' })),
        ...n8nArticles.map((a: any) => ({ ...a, source: 'n8n' }))
      ];

      // Aplicar filtros
      if (specialty && specialty !== 'all') {
        allArticles = allArticles.filter(a => a.specialty === specialty);
      }
      if (journal && journal !== 'all') {
        allArticles = allArticles.filter(a => a.journal === journal);
      }
      if (source && source !== 'all') {
        allArticles = allArticles.filter(a => a.source === source);
      }

      // Ordenar por impact factor e data
      allArticles.sort((a, b) => {
        if (a.impactFactor && b.impactFactor && a.impactFactor !== b.impactFactor) {
          return b.impactFactor - a.impactFactor;
        }
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      // Paginação
      const startIndex = parseInt(offset as string);
      const limitNum = parseInt(limit as string);
      const paginatedArticles = allArticles.slice(startIndex, startIndex + limitNum);

      res.json(paginatedArticles);
    } catch (error) {
      console.error("Error fetching scientific articles:", error);
      res.status(500).json({ message: "Error fetching scientific articles" });
    }
  });

  // Criar novo artigo científico (manual)
  app.post("/api/admin/scientific-articles", requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = scientificArticleSchema.parse(req.body);
      
      const article = await storage.createScientificArticle({
        ...validatedData,
        source: 'manual',
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date(),
        createdBy: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'published'
      });

      res.status(201).json({ 
        message: "Artigo científico criado com sucesso", 
        article 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating scientific article:", error);
      res.status(500).json({ message: "Error creating scientific article" });
    }
  });

  // ==============================
  // INTEGRAÇÃO TELEMEDICINA
  // ==============================
  
  // Sincronizar dados de telemedicina para conteúdo educacional
  app.post("/api/admin/sync-telemedicine-content", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { consultationIds, recordIds } = req.body;
      
      let synced = 0;
      
      // Processar consultas de telemedicina
      if (consultationIds && consultationIds.length > 0) {
        for (const consultationId of consultationIds) {
          const consultation = await storage.getTelemedicineConsultationById(consultationId);
          if (consultation && consultation.diagnosis) {
            // Criar conteúdo educacional baseado na consulta
            await storage.createEducationalContent({
              title: `Caso Clínico: ${(consultation as any).patientCondition || 'Cannabis Medicinal'}`,
              description: `Estudo de caso baseado em consulta real de telemedicina`,
              content: `## Caso Clínico Real\n\n**Condição:** ${(consultation as any).patientCondition}\n\n**Diagnóstico:** ${consultation.diagnosis}\n\n**Tratamento Proposto:** ${(consultation as any).treatmentPlan || 'Cannabis medicinal personalizado'}\n\n**Observações Médicas:** ${(consultation as any).notes || 'Consulta realizada via telemedicina'}`,
              category: 'clinical',
              specialty: (consultation as any).specialty || 'general',
              difficulty: 'intermediate',
              duration: 20,
              tags: ['telemedicina', 'caso-clinico', (consultation as any).patientCondition?.toLowerCase()].filter(Boolean),
              source: 'telemedicine',
              featured: false,
              isActive: true,
              createdBy: req.user!.id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            synced++;
          }
        }
      }

      // Processar registros médicos
      if (recordIds && recordIds.length > 0) {
        for (const recordId of recordIds) {
          const record = await storage.getMedicalRecordById(recordId);
          if (record && record.anamnesis) {
            // Criar artigo científico baseado no registro médico
            await storage.createScientificArticle({
              title: `Análise Clínica: ${(record as any).primaryDiagnosis || 'Cannabis Medicinal'}`,
              abstract: (record.anamnesis as string)?.substring(0, 300) + '...' || 'Resumo indisponível',
              authors: [(record as any).doctorName || 'Dr. Anônimo'],
              journal: 'VittaVerde Medical Journal',
              specialty: (record as any).specialty || 'general',
              keywords: [(record as any).primaryDiagnosis, 'cannabis', 'telemedicina'].filter(Boolean),
              source: 'telemedicine',
              publishedAt: record.createdAt ? new Date(record.createdAt) : new Date(),
              featured: false,
              createdBy: req.user!.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'published'
            });
            synced++;
          }
        }
      }

      res.json({
        message: `${synced} itens sincronizados com sucesso da telemedicina`,
        synced
      });
    } catch (error) {
      console.error("Error syncing telemedicine content:", error);
      res.status(500).json({ message: "Error syncing telemedicine content" });
    }
  });

  console.log("Content Management routes registered successfully");
}