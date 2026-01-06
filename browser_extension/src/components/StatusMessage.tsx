import './StatusMessage.css'
import type { StatusType } from '../lib/types'

interface StatusMessageProps {
  message: string
  type: StatusType
}

export function StatusMessage({ message, type }: StatusMessageProps): JSX.Element | null {
  if (!message) return null
  
  return (
    <div className={`status-message ${type}`} style={{ opacity: message ? '1' : '0' }}>
      {message}
    </div>
  )
}

