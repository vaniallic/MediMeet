import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        image="/img/icon-firstaid.png"
        title="Page not found"
        text="The page you’re looking for doesn’t exist."
        action={<Link to="/home" className="btn-primary">Go home</Link>}
      />
    </div>
  )
}
