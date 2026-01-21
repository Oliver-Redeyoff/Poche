import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Articles.css'
import { useAuth } from '../../contexts/AuthContext'
import { getArticles, deleteArticle, Article } from '../../lib/api'
import AppHeader from '../../components/AppHeader'
import ArticleCard from '../../components/ArticleCard'
import TagChip from '../../components/TagChip'
import EmptyState from '../../components/EmptyState'

export default function Articles() {
  const { user, signOut, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const accountMenuRef = useRef<HTMLDivElement>(null)
  
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false)
      }
    }

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAccountMenu])

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

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletePassword) {
      setDeleteError('Please enter your password')
      return
    }
    
    setIsDeleting(true)
    setDeleteError('')
    
    try {
      await deleteAccount(deletePassword)
      navigate('/app/auth')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteModal = () => {
    setShowAccountMenu(false)
    setShowDeleteModal(true)
    setDeletePassword('')
    setDeleteError('')
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletePassword('')
    setDeleteError('')
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
      <AppHeader>
        <div className="account-menu-container" ref={accountMenuRef}>
          <button 
            className="account-button"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            aria-label="Account menu"
          >
            <i className="fa-solid fa-user"></i>
          </button>
          
          {showAccountMenu && (
            <div className="account-popover">
              <div className="account-popover-header">
                <span className="account-email">{user?.email}</span>
              </div>
              <div className="account-popover-divider"></div>
              <button 
                className="account-popover-item"
                onClick={handleSignOut}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Sign Out
              </button>
              <button 
                className="account-popover-item account-popover-item-danger"
                onClick={openDeleteModal}
              >
                <i className="fa-solid fa-trash"></i>
                Delete Account
              </button>
            </div>
          )}
        </div>
      </AppHeader>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Delete Account</h2>
            <p className="modal-warning">
              This action cannot be undone. All your articles and data will be permanently deleted.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <div className="form-group">
                <label htmlFor="delete-password">Enter your password to confirm:</label>
                <input
                  type="password"
                  id="delete-password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  autoFocus
                />
              </div>
              {deleteError && (
                <p className="error-message">{deleteError}</p>
              )}
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={closeDeleteModal} 
                  className="btn btn-secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
