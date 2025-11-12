import { Router } from 'express';
import { db } from '../db';
import { 
  educationalContent, 
  medicalNews, 
  scientificArticles, 
  n8nWebhooks,
  insertEducationalContentSchema,
  insertMedicalNewsSchema,
  insertScientificArticleSchema,
  insertN8nWebhookSchema
} from '../../shared/schema-n8n';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Webhook endpoint para receber conteúdos educacionais do n8n
router.post('/webhook/educational-content', async (req, res) => {
  try {
    // Validar webhook key para segurança
    const webhookKey = req.headers['x-webhook-key'];
    if (webhookKey !== process.env.N8N_WEBHOOK_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contentData = insertEducationalContentSchema.parse(req.body);
    
    // Inserir conteúdo educacional no banco
    const result = await db.insert(educationalContent).values({
      ...contentData,
      createdAt: new Date(),
      status: 'active'
    }).returning();

    res.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error processing n8n webhook:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Webhook para notícias médicas
router.post('/webhook/medical-news', async (req, res) => {
  try {
    const webhookKey = req.headers['x-webhook-key'];
    if (webhookKey !== process.env.N8N_WEBHOOK_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newsData = z.object({
      title: z.string(),
      content: z.string(),
      source: z.string(),
      category: z.string(),
      publishedAt: z.string(),
      imageUrl: z.string().optional(),
      tags: z.array(z.string()).default([]),
      priority: z.enum(['low', 'medium', 'high']).default('medium')
    }).parse(req.body);

    // Inserir notícia no banco
    const result = await db.insert(medicalNews).values({
      ...newsData,
      publishedAt: new Date(newsData.publishedAt),
      createdAt: new Date(),
      status: 'published'
    }).returning();

    res.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error processing medical news webhook:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Webhook para artigos científicos
router.post('/webhook/scientific-articles', async (req, res) => {
  try {
    const webhookKey = req.headers['x-webhook-key'];
    if (webhookKey !== process.env.N8N_WEBHOOK_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const articleData = z.object({
      title: z.string(),
      abstract: z.string(),
      authors: z.array(z.string()),
      journal: z.string(),
      doi: z.string().optional(),
      pubmedId: z.string().optional(),
      publishedAt: z.string(),
      keywords: z.array(z.string()),
      specialty: z.string(),
      impactFactor: z.number().optional(),
      pdfUrl: z.string().optional()
    }).parse(req.body);

    const result = await db.insert(scientificArticles).values({
      ...articleData,
      publishedAt: new Date(articleData.publishedAt),
      createdAt: new Date(),
      status: 'published'
    }).returning();

    res.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error processing scientific article webhook:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Endpoint para configurar webhooks n8n (COM AUTENTICAÇÃO ADMIN)
router.post('/configure-webhook', requireAuth, requireAdmin, async (req, res) => {
  try {
    const configData = z.object({
      webhookUrl: z.string().url(),
      contentType: z.enum(['educational', 'news', 'articles', 'courses']),
      frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']),
      filters: z.object({
        keywords: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        sources: z.array(z.string()).optional()
      }).optional(),
      isActive: z.boolean().default(true)
    }).parse(req.body);

    // Salvar configuração do webhook
    const result = await db.insert(n8nWebhooks).values({
      ...configData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.json({ success: true, webhook: result[0] });
  } catch (error) {
    console.error('Error configuring n8n webhook:', error);
    res.status(400).json({ error: 'Invalid configuration' });
  }
});

// Listar configurações de webhooks (COM AUTENTICAÇÃO ADMIN)
router.get('/webhooks', requireAuth, requireAdmin, async (req, res) => {
  try {
    const webhooks = await db.select().from(n8nWebhooks).orderBy(desc(n8nWebhooks.createdAt));
    res.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET endpoints para buscar conteúdos armazenados (consumo pela UI)
router.get('/educational-content', async (req, res) => {
  try {
    const { category, specialty, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(educationalContent).where(eq(educationalContent.status, 'active'));
    
    if (category) {
      query = query.where(eq(educationalContent.category, category as string));
    }
    if (specialty) {
      query = query.where(eq(educationalContent.specialty, specialty as string));
    }
    
    const content = await query
      .orderBy(desc(educationalContent.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching educational content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/medical-news', async (req, res) => {
  try {
    const { category, featured, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(medicalNews).where(eq(medicalNews.status, 'published'));
    
    if (category) {
      query = query.where(eq(medicalNews.category, category as string));
    }
    if (featured === 'true') {
      query = query.where(eq(medicalNews.featured, true));
    }
    
    const news = await query
      .orderBy(desc(medicalNews.publishedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json(news);
  } catch (error) {
    console.error('Error fetching medical news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/scientific-articles', async (req, res) => {
  try {
    const { specialty, journal, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(scientificArticles).where(eq(scientificArticles.status, 'published'));
    
    if (specialty) {
      query = query.where(eq(scientificArticles.specialty, specialty as string));
    }
    if (journal) {
      query = query.where(eq(scientificArticles.journal, journal as string));
    }
    
    const articles = await query
      .orderBy(desc(scientificArticles.publishedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching scientific articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ativar/desativar webhook (COM AUTENTICAÇÃO ADMIN)
router.patch('/webhooks/:id/toggle', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);

    const result = await db.update(n8nWebhooks)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(n8nWebhooks.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true, webhook: result[0] });
  } catch (error) {
    console.error('Error toggling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;