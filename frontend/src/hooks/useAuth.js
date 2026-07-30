import { useAuth as contextUseAuth } from '../context/AuthContext'

export function useAuth() {
  return contextUseAuth()
}
