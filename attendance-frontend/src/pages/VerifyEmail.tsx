import { Navigate } from 'react-router-dom'

// Email verification is now OTP-based (not link-based).
// Any old links redirect users to the sign-in page.
export default function VerifyEmail() {
  return <Navigate to="/login" replace />
}
