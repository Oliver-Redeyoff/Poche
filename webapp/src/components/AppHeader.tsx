import "./AppHeader.css"
import Logo from './Logo'

interface AppHeaderProps {
    userEmail?: string
    onSignOut?: () => void
    children?: React.ReactNode
}

function AppHeader({ userEmail, onSignOut, children }: AppHeaderProps) {
    return (
        <header className="app-header">
            <div className="app-header-logo-container">
                <Logo />
            </div>
            
            {children ? (
                <div className="app-header-right">
                    {children}
                </div>
            ) : (
                <div className="app-header-user">
                    {userEmail && (
                        <span className="user-email">{userEmail}</span>
                    )}
                    {onSignOut && (
                        <button onClick={onSignOut} className="btn btn-secondary btn-small">
                            Sign Out
                        </button>
                    )}
                </div>
            )}
        </header>
    )
}

export default AppHeader
