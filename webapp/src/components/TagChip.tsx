import "./TagChip.css"
import { tagToColor } from '@poche/shared'

interface TagChipProps {
    tag: string
    size?: 'default' | 'small'
    active?: boolean
    onClick?: () => void
    showColor?: boolean
}

function TagChip({ tag, size = 'default', active = false, onClick, showColor = true }: TagChipProps) {
    const isButton = !!onClick
    const sizeClass = size !== 'default' ? size : ''
    const activeClass = active ? 'active' : ''
    const staticClass = !isButton ? 'static' : ''
    
    const style: React.CSSProperties = showColor && !active
        ? { '--tag-color': tagToColor(tag) } as React.CSSProperties
        : active && showColor
            ? { backgroundColor: tagToColor(tag) }
            : {}

    if (isButton) {
        return (
            <button
                className={`tag-chip ${sizeClass} ${activeClass} ${staticClass}`.trim()}
                onClick={onClick}
                style={style}
            >
                {tag}
            </button>
        )
    }

    return (
        <span
            className={`tag-chip ${sizeClass} ${activeClass} ${staticClass}`.trim()}
            style={showColor ? { backgroundColor: tagToColor(tag) } : {}}
        >
            {tag}
        </span>
    )
}

export default TagChip

