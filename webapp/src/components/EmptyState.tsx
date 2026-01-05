import "./EmptyState.css"
import LoadingSpinner from './LoadingSpinner'

interface EmptyStateProps {
    type?: 'empty' | 'loading' | 'error'
    icon?: string
    title?: string
    message?: string
    children?: React.ReactNode
}

function EmptyState({ 
    type = 'empty', 
    icon, 
    title, 
    message, 
    children 
}: EmptyStateProps) {
    return (
        <div className={`empty-state ${type}`}>
            {type === 'loading' ? (
                <LoadingSpinner />
            ) : icon && (
                <div className="empty-state-icon">{icon}</div>
            )}
            
            {title && <h2>{title}</h2>}
            {message && <p>{message}</p>}
            {children}
        </div>
    )
}

export default EmptyState

