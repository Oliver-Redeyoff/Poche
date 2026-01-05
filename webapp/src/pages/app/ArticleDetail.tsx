import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import './ArticleDetail.css'
import { getArticle, Article } from '../../lib/api'
import Markdown from '../../components/Markdown'
import TagChip from '../../components/TagChip'
import LoadingSpinner from '../../components/LoadingSpinner'

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
          <LoadingSpinner />
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
          <i className="fa-solid fa-arrow-left"></i>
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
              <TagChip key={tag} tag={tag} />
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
            <i className="fa-solid fa-up-right-from-square"></i>
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

