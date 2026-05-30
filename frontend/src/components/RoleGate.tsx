import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { can, type Action, type Resource } from '../hooks/usePermissions'

interface RoleGateProps {
  action: Action
  resource: Resource
  children: ReactNode
  fallback?: ReactNode
}

export default function RoleGate({
  action,
  resource,
  children,
  fallback = null,
}: RoleGateProps) {
  const { user } = useAuth()

  if (!can(user, action, resource)) {
    return fallback
  }

  return children
}
