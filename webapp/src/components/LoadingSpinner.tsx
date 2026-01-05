import "./LoadingSpinner.css"

interface LoadingSpinnerProps {
    size?: 'small' | 'default' | 'large'
    className?: string
}

function LoadingSpinner({ size = 'default', className = '' }: LoadingSpinnerProps) {
    const sizeClass = size !== 'default' ? size : ''
    return (
        <div className={`loading-spinner ${sizeClass} ${className}`.trim()} />
    )
}

export default LoadingSpinner

