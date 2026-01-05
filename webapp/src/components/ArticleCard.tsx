import "./ArticleCard.css"
import { Link } from 'react-router-dom'
import { Article } from '../lib/api'
import TagChip from './TagChip'

interface ArticleCardProps {
    article: Article
    isDeleting?: boolean
    onDelete?: (id: number, e: React.MouseEvent) => void
}

function formatReadingTime(wordCount: number | null): string {
    if (!wordCount) return ''
    const minutes = Math.ceil(wordCount / 200)
    return `${minutes} min read`
}

function ArticleCard({ article, isDeleting = false, onDelete }: ArticleCardProps) {
    const tags = (article.tags ?? "").split(',').map(tag => tag.trim()).filter(Boolean)

    return (
        <Link 
            to={`/app/article/${article.id}`}
            className={`article-card ${isDeleting ? 'deleting' : ''}`}
        >
            <div className="article-card-content">
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
                        {tags.slice(0, 3).map(tag => (
                            <TagChip key={tag} tag={tag} size="small" />
                        ))}
                    </div>

                    {onDelete && (
                        <button 
                            className="article-delete-btn"
                            onClick={(e) => onDelete(article.id, e)}
                            disabled={isDeleting}
                            title="Delete article"
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default ArticleCard

