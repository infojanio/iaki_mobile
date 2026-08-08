import { useCallback, useContext, useEffect, useState } from 'react'

import { CityContext } from '@contexts/CityContext'
import { StoreListContent } from '@components/StoreListContent'
import { StoreDTO } from '@dtos/StoreDTO'
import { api } from '@services/api'

export function StoreList() {
  const { city } = useContext(CityContext)

  const [stores, setStores] = useState<StoreDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadStores = useCallback(
    async (isRefresh = false) => {
      if (!city?.id) {
        setStores([])
        setIsLoading(false)
        setRefreshing(false)
        return
      }

      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setIsLoading(true)
        }

        /*
         * Ajuste esta rota caso o endpoint usado no seu backend
         * possua outro endereço.
         */
        const response = await api.get('/stores', {
          params: {
            cityId: city.id,
            premium: true,
          },
        })

        const responseStores =
          response.data?.stores ?? response.data?.data ?? response.data ?? []

        setStores(Array.isArray(responseStores) ? responseStores : [])
      } catch (error: any) {
        console.error('[StoreList] Erro ao carregar lojas:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        })

        setStores([])
      } finally {
        setIsLoading(false)
        setRefreshing(false)
      }
    },
    [city?.id],
  )

  const handleRefresh = useCallback(() => {
    void loadStores(true)
  }, [loadStores])

  useEffect(() => {
    void loadStores()
  }, [loadStores])

  return (
    <StoreListContent
      stores={stores}
      isLoading={isLoading}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  )
}
