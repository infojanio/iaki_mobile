import { createContext, ReactNode, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Store = {
  id: string
  name: string
}

type StoreContextData = {
  store: Store | null
  setStore: (store: Store) => Promise<void>
  clearStore: () => Promise<void>
}

export const StoreContext = createContext({} as StoreContextData)

type StoreProviderProps = {
  children: ReactNode
}

const STORE_STORAGE_KEY = '@iaki:store'

export function StoreProvider({ children }: StoreProviderProps) {
  const [store, setStoreState] = useState<Store | null>(null)

  async function setStore(store: Store) {
    try {
      setStoreState(store)
      await AsyncStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(store))
    } catch (error) {
      console.error('Erro ao salvar loja:', error)
    }
  }

  async function clearStore() {
    try {
      setStoreState(null)
      await AsyncStorage.removeItem(STORE_STORAGE_KEY)
    } catch (error) {
      console.error('Erro ao limpar loja:', error)
    }
  }

  async function loadStoredStore() {
    try {
      const storedStore = await AsyncStorage.getItem(STORE_STORAGE_KEY)
      if (storedStore) {
        setStoreState(JSON.parse(storedStore))
      }
    } catch (error) {
      console.error('Erro ao carregar loja salva:', error)
    }
  }

  useEffect(() => {
    loadStoredStore()
  }, [])

  return (
    <StoreContext.Provider value={{ store, setStore, clearStore }}>
      {children}
    </StoreContext.Provider>
  )
}
