import { pgTable, varchar, text, timestamp, jsonb, boolean, integer, unique } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums para lesson types
export const lessonTypes = ['video', 'article', 'quiz', 'resource'] as const;
export type LessonType = typeof lessonTypes[number];

// Conteúdo educacional recebido do n8n
export const educationalContent = pgTable('educational_content', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(), // article, video, course, webinar, news
  source: varchar('source', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  specialty: varchar('specialty', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
  duration: integer('duration'), // em minutos
  imageUrl: varchar('image_url', { length: 500 }),
  videoUrl: varchar('video_url', { length: 500 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  targetAudience: varchar('target_audience', { length: 20 }).default('patient'), // doctor, patient, both
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  priority: varchar('priority', { length: 10 }).default('medium'),
  viewCount: integer('view_count').default(0),
  rating: integer('rating').default(0)
});

// Notícias médicas
export const medicalNews = pgTable('medical_news', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  source: varchar('source', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  sourceUrl: varchar('source_url', { length: 500 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  priority: varchar('priority', { length: 10 }).default('medium'),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('published'),
  viewCount: integer('view_count').default(0),
  featured: boolean('featured').default(false)
});

// Artigos científicos
export const scientificArticles = pgTable('scientific_articles', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 500 }).notNull(),
  abstract: text('abstract').notNull(),
  authors: jsonb('authors').$type<string[]>().notNull(),
  journal: varchar('journal', { length: 200 }).notNull(),
  doi: varchar('doi', { length: 100 }),
  pubmedId: varchar('pubmed_id', { length: 50 }),
  publishedAt: timestamp('published_at').notNull(),
  keywords: jsonb('keywords').$type<string[]>().default([]),
  specialty: varchar('specialty', { length: 50 }).notNull(),
  impactFactor: integer('impact_factor'),
  pdfUrl: varchar('pdf_url', { length: 500 }),
  citationCount: integer('citation_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('published'),
  featured: boolean('featured').default(false)
});

// Configurações dos webhooks n8n
export const n8nWebhooks = pgTable('n8n_webhooks', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  webhookUrl: varchar('webhook_url', { length: 500 }).notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull(),
  filters: jsonb('filters').$type<{
    keywords?: string[];
    categories?: string[];
    sources?: string[];
  }>().default({}),
  isActive: boolean('is_active').default(true),
  lastTriggered: timestamp('last_triggered'),
  successCount: integer('success_count').default(0),
  errorCount: integer('error_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Módulos de curso (para contentType = 'course')
export const courseModules = pgTable('course_modules', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: varchar('course_id').notNull().references(() => educationalContent.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  coverImageUrl: varchar('cover_image_url', { length: 500 }),
  orderIndex: integer('order_index').notNull().default(0),
  duration: integer('duration'), // em minutos
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  courseOrderUnique: unique().on(table.courseId, table.orderIndex)
}));

// Lições/recursos de módulo
export const courseLessons = pgTable('course_lessons', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  moduleId: varchar('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  lessonType: varchar('lesson_type', { length: 20 }).notNull(), // video, article, quiz, resource
  contentUrl: varchar('content_url', { length: 500 }), // URL do vídeo, PDF, etc
  coverImageUrl: varchar('cover_image_url', { length: 500 }),
  duration: integer('duration'), // em minutos (para vídeos)
  orderIndex: integer('order_index').notNull().default(0),
  isPreview: boolean('is_preview').default(false), // Permite visualização gratuita
  content: text('content'), // Texto/HTML para artigos
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  moduleLessonOrderUnique: unique().on(table.moduleId, table.orderIndex)
}));

// Esquemas de inserção
export const insertEducationalContentSchema = createInsertSchema(educationalContent);
export const insertMedicalNewsSchema = createInsertSchema(medicalNews);
export const insertScientificArticleSchema = createInsertSchema(scientificArticles);
export const insertN8nWebhookSchema = createInsertSchema(n8nWebhooks);
export const insertCourseModuleSchema = createInsertSchema(courseModules);
export const insertCourseLessonSchema = createInsertSchema(courseLessons).extend({
  lessonType: z.enum(lessonTypes)
}).refine(
  (data) => data.contentUrl || data.content,
  { message: "Lesson must have either contentUrl or content" }
);

// Tipos TypeScript
export type EducationalContent = typeof educationalContent.$inferSelect;
export type MedicalNews = typeof medicalNews.$inferSelect;
export type ScientificArticle = typeof scientificArticles.$inferSelect;
export type N8nWebhook = typeof n8nWebhooks.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;