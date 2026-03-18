import './Header.css'
import iconPng from '../assets/icon.png'

interface HeaderProps {
  isPremium?: boolean
}

export function Header({ isPremium = false }: HeaderProps): JSX.Element {
  return (
    <div className="header">
      <div className="header-inner">
        <img src={iconPng} alt="poche" className="header-logo" />
        <h1>Poche</h1>
        {isPremium && <span className="header-plus">+</span>}
      </div>
    </div>
  )
}

