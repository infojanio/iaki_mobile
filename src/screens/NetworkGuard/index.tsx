import React, { ReactNode, useCallback, useEffect, useState } from 'react'

import NetInfo from '@react-native-community/netinfo'
import { OfflineScreen } from '@components/OfflineScreen'

type Props = {
  children: ReactNode
}

export function NetworkGuard({ children }: Props) {
  const [isOffline, setIsOffline] = useState(false)

  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      /*
       * null significa que o NetInfo
       * ainda está descobrindo o estado.
       *
       * Não consideramos isso offline.
       */
      const disconnected =
        state.isConnected === false || state.isInternetReachable === false

      setIsOffline(disconnected)
    })

    return unsubscribe
  }, [])

  const handleRetry = useCallback(async () => {
    try {
      setIsRetrying(true)

      const state = await NetInfo.fetch()

      const disconnected =
        state.isConnected === false || state.isInternetReachable === false

      setIsOffline(disconnected)
    } finally {
      setIsRetrying(false)
    }
  }, [])

  if (isOffline) {
    return <OfflineScreen isRetrying={isRetrying} onRetry={handleRetry} />
  }

  return <>{children}</>
}
