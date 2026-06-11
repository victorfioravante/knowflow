import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

// Shell com navegação inferior (telas principais)
export default function AppShell() {
  return (
    <div className="min-h-full pb-16">
      <Outlet />
      <BottomNav />
    </div>
  )
}
