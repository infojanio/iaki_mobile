import { useContext, useEffect } from 'react'
//contexto de navegação
import { Box, useTheme } from 'native-base'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'

import { useAuth } from '@hooks/useAuth'

import { AuthRoutes } from './auth.routes'
import { AppRoutes } from './app.routes'
import { Loading } from '@components/Loading'

export function Routes() {
  const { colors } = useTheme()
  const { user, isLoadingUserStorageData } = useAuth()

  console.log('Usuário logado =>', user)

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.gray[100],
    },
  }

  useEffect(() => {
    //console.log('Usuário logado =>', user.name)
  }, [user])

  //verifica se os dados do user estão sendo carregados
  if (isLoadingUserStorageData) {
    return <Loading />
  }

  return (
    <Box flex={1} bg="green.50">
      {' '}
      {/*garante não aparecer fundo branco na trasição da tela */}
      <NavigationContainer theme={theme}>
        {
          user && user.id ? (
            <AppRoutes />
          ) : (
            <AuthRoutes />
          ) /*se não tiver logado vai p/ rota StackRoutes*/
        }
      </NavigationContainer>
    </Box>
  )
}
