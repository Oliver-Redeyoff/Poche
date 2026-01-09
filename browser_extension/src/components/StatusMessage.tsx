import './StatusMessage.css'
import type { StatusType } from '../lib/types'

interface StatusMessageProps {
  show: boolean
  message: string
  type: StatusType
}

export function StatusMessage({ show, message, type }: StatusMessageProps): JSX.Element | null {
  return (
    <div className={`status-message ${type} ${show ? 'visible' : 'hidden'}`}>
      {message}
    </div>
  )
}

