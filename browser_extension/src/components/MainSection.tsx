import './MainSection.css'
import { TagsInput } from './TagsInput'

interface MainSectionProps {
  userEmail: string
  onLogout: () => Promise<void>
  onSaveArticle: () => Promise<void>
  saveButtonDisabled: boolean
  saveButtonText: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
}

export function MainSection({ 
  userEmail, 
  onLogout, 
  onSaveArticle, 
  saveButtonDisabled, 
  saveButtonText, 
  tags, 
  onTagsChange 
}: MainSectionProps): JSX.Element {
  return (
    <div className="main-section">
      <TagsInput tags={tags} onTagsChange={onTagsChange} />

      <button
        className="btn btn-primary btn-large"
        onClick={onSaveArticle}
        disabled={saveButtonDisabled}
      >
        {saveButtonText}
      </button>

      <div className="user-info">
        <p>Logged in as <br /><strong>{userEmail}</strong></p>
        <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}

