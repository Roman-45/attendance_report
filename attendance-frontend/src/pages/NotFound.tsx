import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120] p-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-7xl font-bold text-[#4F46E5]">404</p>
        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">Page not found</h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}
