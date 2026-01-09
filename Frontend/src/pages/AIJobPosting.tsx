import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/Hook/AuthContext'

const AIJobPosting = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to manual post if user has standard plan or no plan
    if (!user || user.plan === "standard") {
      navigate("/post/manual-post", { replace: true })
    }
  }, [user, navigate])

  // Show loading or nothing while redirecting
  if (!user || user.plan === "standard") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    )
  }

  return (
    <div>AIJobPosting</div>
  )
}

export default AIJobPosting