import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getArticles, deleteArticle, Article } from '../../lib/api'
import { tagToColor } from '@poche/shared'
import Logo from '../../components/Logo'

function formatReadingTime(wordCount: number | null): string {
  if (!wordCount) return ''
  const minutes = Math.ceil(wordCount / 200)
  return `${minutes} min read`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

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
      <header className="app-header">
        <div className='app-header-logo-container'>
          <Logo />
        </div>
        
        <div className="app-header-user">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleSignOut} className="btn btn-secondary btn-small">
            Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="articles-header">
          <h1>Your Articles</h1>
          <p>{filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}</p>
        </div>

        {allTags.length > 0 && (
          <div className="tags-filter">
            <button
              className={`tag-chip ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
                style={{ 
                  '--tag-color': tagToColor(tag),
                  backgroundColor: selectedTag === tag ? tagToColor(tag) : undefined
                } as React.CSSProperties}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="articles-loading">
            <div className="loading-spinner" />
            <p>Loading your articles...</p>
          </div>
        ) : error ? (
          <div className="articles-error">
            <p>{error}</p>
            <button onClick={loadArticles} className="btn btn-secondary">
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="articles-empty">
            <div className="empty-icon">📚</div>
            <h2>No articles yet</h2>
            <p>
              {selectedTag 
                ? `No articles tagged with "${selectedTag}"`
                : 'Save articles using the browser extension to see them here'
              }
            </p>
            {selectedTag && (
              <button onClick={() => setSelectedTag(null)} className="btn btn-secondary">
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <div className="articles-grid">
            {filteredArticles.map(article => (
              <Link 
                to={`/app/article/${article.id}`} 
                key={article.id}
                className={`article-card ${deletingId === article.id ? 'deleting' : ''}`}
              >
                <div className="article-card-content">
                  {/* <span className="article-date">{formatDate(article.createdAt)}</span> */}

                  <h2 className="article-card-title">
                    {article.title || 'Untitled Article'}
                  </h2>

                  <div className="article-card-meta">
                    {article.siteName && (
                      <span className="article-site">{article.siteName}</span>
                    )}
                    {article.wordCount && (
                      <span className="article-reading-time">
                        {formatReadingTime(article.wordCount)}
                      </span>
                    )}
                  </div>
                  
                  <div className="article-card-footer">
                      <div className="article-tags">
                        {(article.tags ?? "").split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="tag-chip small"
                            style={{ backgroundColor: tagToColor(tag) }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                    <button 
                      className="article-delete-btn"
                      onClick={(e) => handleDelete(article.id, e)}
                      disabled={deletingId === article.id}
                      title="Delete article"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

