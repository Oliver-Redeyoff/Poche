import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getArticle, Article } from '../../lib/api'
import { tagToColor } from '@poche/shared'
import Markdown from '../../components/Markdown'

function formatReadingTime(wordCount: number | null): string {
  if (!wordCount) return ''
  const minutes = Math.ceil(wordCount / 200)
  return `${minutes} min read`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      navigate('/app')
      return
    }

    const loadArticle = async () => {
      try {
        setIsLoading(true)
        const data = await getArticle(parseInt(id))
        setArticle(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article')
      } finally {
        setIsLoading(false)
      }
    }

    loadArticle()
  }, [id, navigate])

  if (isLoading) {
    return (
      <div className="app-article-page">
        <div className="article-loading">
          <div className="loading-spinner" />
          <p>Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="app-article-page">
        <div className="article-error">
          <h2>Article Not Found</h2>
          <p>{error || 'This article could not be loaded.'}</p>
          <Link to="/app" className="btn btn-primary">
            Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  const tags = article.tags?.split(',').map(t => t.trim()).filter(Boolean) || []

  return (
    <div className="app-article-page">
      <header className="article-header">
        <Link to="/app" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Articles
        </Link>
      </header>

      <article className="article-content">
        <div className="article-meta">
          {article.siteName && (
            <span className="article-site">{article.siteName}</span>
          )}
          {article.author && (
            <span className="article-author">by {article.author}</span>
          )}
        </div>

        <h1 className="article-title">{article.title || 'Untitled Article'}</h1>

        <div className="article-info">
          <span className="article-date">{formatDate(article.createdAt)}</span>
          {article.wordCount && (
            <>
              <span className="article-divider">·</span>
              <span className="article-reading-time">
                {formatReadingTime(article.wordCount)}
              </span>
            </>
          )}
        </div>

        {tags.length > 0 && (
          <div className="article-tags">
            {tags.map(tag => (
              <span 
                key={tag} 
                className="tag-chip"
                style={{ backgroundColor: tagToColor(tag) }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {article.url && (
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="article-source-link"
          >
            View Original Article
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        )}

        <div className="article-body">
          {article.content ? (
            <Markdown baseUrl={article.url || undefined}>
              {article.content}
            </Markdown>
          ) : article.excerpt ? (
            <p className="article-excerpt">{article.excerpt}</p>
          ) : (
            <p className="article-no-content">No content available for this article.</p>
          )}
        </div>
      </article>
    </div>
  )
}

