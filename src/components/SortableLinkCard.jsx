import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import LinkCard from './LinkCard'

export default function SortableLinkCard(props) {
  const { link, ...rest } = props
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    rest.onContextMenu?.(e, link)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'link-card-wrap is-dragging' : 'link-card-wrap'}
      onContextMenu={handleContextMenu}
      {...attributes}
      {...listeners}
    >
      <LinkCard link={link} {...rest} />
    </div>
  )
}
