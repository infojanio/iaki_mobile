import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { api } from '@services/api'

type StorePointsWallet = {
  id: string
  balance: number
  earned: number
  spent: number
}

type StorePointsContextType = {
  wallet: StorePointsWallet | null
  balance: number
  earned: number
  spent: number
  isLoading: boolean
  currentStoreId: string | null
  fetchWallet: (storeId: string) => Promise<void>
  resetWallet: () => void
}

const StorePointsContext = createContext({} as StorePointsContextType)

type Props = {
  children: ReactNode
}

export function StorePointsProvider({ children }: Props) {
  const [wallet, setWallet] = useState<StorePointsWallet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)

  const fetchWallet = useCallback(async (storeId: string) => {
    if (!storeId) return

    try {
      setIsLoading(true)

      const response = await api.get(`/stores/${storeId}/points/me`)

      setWallet(response.data)
      setCurrentStoreId(storeId)
    } catch (error) {
      setWallet(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetWallet = useCallback(() => {
    setWallet(null)
    setCurrentStoreId(null)
  }, [])

  return (
    <StorePointsContext.Provider
      value={{
        wallet,
        balance: wallet?.balance ?? 0,
        earned: wallet?.earned ?? 0,
        spent: wallet?.spent ?? 0,
        isLoading,
        currentStoreId,
        fetchWallet,
        resetWallet,
      }}
    >
      {children}
    </StorePointsContext.Provider>
  )
}

export function useStorePoints() {
  return useContext(StorePointsContext)
}
