import './Header.css'
import iconPng from '../assets/icon.png'

export function Header(): JSX.Element {
  return (
    <div className="header">
      <div className="header-inner">
        <img src={iconPng} alt="poche" className="header-logo" />
        <h1>Poche</h1>
      </div>
    </div>
  )
}

