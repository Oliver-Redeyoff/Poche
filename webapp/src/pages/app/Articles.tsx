import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Articles.css'
import { useAuth } from '../../contexts/AuthContext'
import { getArticles, deleteArticle, Article } from '../../lib/api'
import AppHeader from '../../components/AppHeader'
import ArticleCard from '../../components/ArticleCard'
import TagChip from '../../components/TagChip'
import EmptyState from '../../components/EmptyState'

export default function Articles() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setIsLoading(true)
      const data = await getArticles()
      setArticles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this article?')) return
    
    setDeletingId(id)
    try {
      await deleteArticle(id)
      setArticles(articles.filter(a => a.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete article')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/app/auth')
  }

  // Get all unique tags
  const allTags = [...new Set(
    articles
      .flatMap(a => a.tags?.split(',').map(t => t.trim()).filter(Boolean) || [])
  )].sort()

  // Filter articles by selected tag
  const filteredArticles = selectedTag
    ? articles.filter(a => a.tags?.split(',').map(t => t.trim()).includes(selectedTag))
    : articles

  return (
    <div className="app-articles-page">
      <AppHeader userEmail={user?.email} onSignOut={handleSignOut} />

      <main className="app-main">
        <div className="articles-header">
          <h1>Your Articles</h1>
          <p>{filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}</p>
        </div>

        {allTags.length > 0 && (
          <div className="tags-filter">
            <TagChip 
              tag="All" 
              active={!selectedTag} 
              onClick={() => setSelectedTag(null)}
              showColor={false}
            />
            {allTags.map(tag => (
              <TagChip
                key={tag}
                tag={tag}
                active={selectedTag === tag}
                onClick={() => setSelectedTag(tag)}
              />
            ))}
          </div>
        )}

        {isLoading ? (
          <EmptyState 
            type="loading" 
            message="Loading your articles..." 
          />
        ) : error ? (
          <EmptyState 
            type="error" 
            message={error}
          >
            <button onClick={loadArticles} className="btn btn-secondary">
              Try Again
            </button>
          </EmptyState>
        ) : filteredArticles.length === 0 ? (
          <EmptyState 
            icon="📚"
            title="No articles yet"
            message={selectedTag 
              ? `No articles tagged with "${selectedTag}"`
              : 'Save articles using the browser extension to see them here'
            }
          >
            {selectedTag && (
              <button onClick={() => setSelectedTag(null)} className="btn btn-secondary">
                Clear Filter
              </button>
            )}
          </EmptyState>
        ) : (
          <div className="articles-grid">
            {filteredArticles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                isDeleting={deletingId === article.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
