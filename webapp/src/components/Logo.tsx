import "./Logo.css"
import { Link } from 'react-router-dom'

function Logo() {
    return (
        <Link to="/app" className="logo">
          <img className='logo-img' src="/logo.png" alt="Poche" />
          <span className='logo-text'>Poche</span>
        </Link>
    )
}

export default Logo