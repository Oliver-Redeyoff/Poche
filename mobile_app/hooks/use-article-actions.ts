import { Article } from '@poche/shared'
import {
  deleteArticleWithSync,
  updateArticleTagsWithSync,
  updateArticleWithSync
} from '@/lib/article-sync'

interface UseArticleActionsParams {
  userId: string | undefined
  articles: Article[]
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>
}

/**
 * Custom hook that provides article management actions (delete, update tags, toggle favorite)
 * with optimistic updates and error handling.
 */
export function useArticleActions({ userId, articles, setArticles }: UseArticleActionsParams) {
  
  async function deleteArticle(articleId: number) {
    if (!userId) return
    try {
      await deleteArticleWithSync(userId, articleId)
      setArticles(prev => prev.filter(a => a.id !== articleId))
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  async function updateArticleTags(articleId: number, tags: string) {
    if (!userId) return
    try {
      await updateArticleTagsWithSync(userId, articleId, tags)
      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, tags: tags || null } : a
      ))
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  async function toggleFavorite(articleId: number) {
    if (!userId) return
    const article = articles.find(a => a.id === articleId)
    if (!article) return
    
    const newFavoriteStatus = !article.isFavorite
    // Optimistic update
    setArticles(prev => prev.map(a => 
      a.id === articleId ? { ...a, isFavorite: newFavoriteStatus } : a
    ))
    
    try {
      await updateArticleWithSync(userId, articleId, { isFavorite: newFavoriteStatus })
    } catch (error) {
      // Revert on error
      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, isFavorite: !newFavoriteStatus } : a
      ))
      console.error('Error toggling favorite:', error)
    }
  }

  return {
    deleteArticle,
    updateArticleTags,
    toggleFavorite
  }
}
