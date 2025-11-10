// src/screens/Redirect.tsx
import { useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { Loading } from '@components/Loading'

export function Redirect() {
  const { user } = useAuth()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  useEffect(() => {
    async function checkLocation() {
      try {
        const response = await api.get(`/users/${user.id}/location`)

        if (response.data?.latitude && response.data?.longitude) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'home', params: { userId: user.id } }],
          })
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'home', params: { userId: user.id } }],
            // routes: [{ name: 'localization', params: { userId: user.id } }],
          })
        }
      } catch (error) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'home', params: { userId: user.id } }],
          //routes: [{ name: 'localization', params: { userId: user.id } }],
        })
      }
    }

    checkLocation()
  }, [])

  return <Loading />
}
