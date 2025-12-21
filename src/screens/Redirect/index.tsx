import { useEffect, useContext, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useAuth } from '@hooks/useAuth'
import { CityContext } from '@contexts/CityContext'
import { RootStackParamList } from '@routes/types'
import { Loading } from '@components/Loading'

type RedirectNavigationProps = NativeStackNavigationProp<RootStackParamList>

export function Redirect() {
  const { user } = useAuth()
  const { city, isLoading } = useContext(CityContext)
  const navigation = useNavigation<RedirectNavigationProps>()

  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!user) return
    if (isLoading) return
    if (hasRedirected.current) return

    hasRedirected.current = true

    if (!city) {
      console.log('➡️ indo para SelectCity')
      navigation.reset({
        index: 0,
        routes: [{ name: 'selectCity' }],
      })
    } else {
      console.log('➡️ indo para AppRoutes')
      navigation.reset({
        index: 0,
        routes: [{ name: 'appRoutes' }],
      })
    }
  }, [user, city, isLoading])

  return <Loading />
}
