import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { articles } from '../db/schema.js';
import { extractArticle, decodeHtmlEntities } from '../lib/article-extractor.js';
import type { Session, User } from 'better-auth';

// Type for authenticated context
type AuthContext = {
  Variables: {
    user: User;
    session: Session;
  };
};

const app = new Hono<AuthContext>();

// Validation schemas
const createArticleSchema = z.object({
  url: z.string().url('Invalid URL'),
  tags: z.string().optional(),
});

const updateArticleSchema = z.object({
  tags: z.string().optional().nullable(),
  title: z.string().optional(),
  // Reading progress and favorites
  readingProgress: z.number().min(0).max(100).optional(),
  isFavorite: z.boolean().optional(),
});

// GET /articles - List all articles for the authenticated user
app.get('/', async (c) => {
  const user = c.get('user');

  try {
    const userArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.userId, user.id))
      .orderBy(desc(articles.createdAt));

    return c.json({ articles: userArticles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return c.json({ error: 'Failed to fetch articles' }, 500);
  }
});

// GET /articles/:id - Get a single article
app.get('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid article ID' }, 400);
  }

  try {
    const article = await db
      .select()
      .from(articles)
      .where(and(eq(articles.id, id), eq(articles.userId, user.id)))
      .limit(1);

    if (article.length === 0) {
      return c.json({ error: 'Article not found' }, 404);
    }

    return c.json({ article: article[0] });
  } catch (error) {
    console.error('Error fetching article:', error);
    return c.json({ error: 'Failed to fetch article' }, 500);
  }
});

// POST /articles - Create a new article from URL
app.post('/', async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const { url, tags } = createArticleSchema.parse(body);

    // Check if article with this URL already exists for this user
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(and(eq(articles.url, url), eq(articles.userId, user.id)))
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: 'Article already saved', articleId: existing[0].id }, 409);
    }

    // Extract article content from URL
    const extracted = await extractArticle(url);

    // Save to database
    const [newArticle] = await db
      .insert(articles)
      .values({
        userId: user.id,
        url,
        title: decodeHtmlEntities(extracted.title),
        content: extracted.content,
        excerpt: decodeHtmlEntities(extracted.excerpt),
        author: decodeHtmlEntities(extracted.author),
        siteName: extracted.siteName,
        wordCount: extracted.wordCount,
        tags: tags || null,
      })
      .returning();

    return c.json({ article: newArticle }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    console.error('Error creating article:', error);
    const message = error instanceof Error ? error.message : 'Failed to save article';
    return c.json({ error: message }, 500);
  }
});

// PATCH /articles/:id - Update an article (e.g., tags, progress, favorite)
app.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid article ID' }, 400);
  }

  try {
    const body = await c.req.json();
    const updates = updateArticleSchema.parse(body);

    // Build the update object with automatic timestamp handling
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date(),
    };

    // Handle reading progress timestamps
    if (updates.readingProgress !== undefined) {
      // Set startedAt when progress goes above 0 (first time reading)
      if (updates.readingProgress > 0) {
        const [existing] = await db
          .select({ startedAt: articles.startedAt })
          .from(articles)
          .where(and(eq(articles.id, id), eq(articles.userId, user.id)))
          .limit(1);
        
        if (existing && !existing.startedAt) {
          updateData.startedAt = new Date();
        }
      }

      // Set finishedAt when progress reaches 100
      if (updates.readingProgress === 100) {
        updateData.finishedAt = new Date();
      }
    }

    const [updated] = await db
      .update(articles)
      .set(updateData)
      .where(and(eq(articles.id, id), eq(articles.userId, user.id)))
      .returning();

    if (!updated) {
      return c.json({ error: 'Article not found' }, 404);
    }

    return c.json({ article: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    }
    console.error('Error updating article:', error);
    return c.json({ error: 'Failed to update article' }, 500);
  }
});

// DELETE /articles/:id - Delete an article
app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'Invalid article ID' }, 400);
  }

  try {
    const [deleted] = await db
      .delete(articles)
      .where(and(eq(articles.id, id), eq(articles.userId, user.id)))
      .returning({ id: articles.id });

    if (!deleted) {
      return c.json({ error: 'Article not found' }, 404);
    }

    return c.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error('Error deleting article:', error);
    return c.json({ error: 'Failed to delete article' }, 500);
  }
});

export default app;

