import { Box, useTheme } from 'native-base'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '@hooks/useAuth'
import { AuthRoutes } from './auth.routes'
import { AppRoutes } from './app.routes'
import { Redirect } from '@screens/Redirect'
import { SelectCity } from '@screens/SelectCity'
import { Loading } from '@components/Loading'

const Stack = createNativeStackNavigator()

export function Routes() {
  const { colors } = useTheme()
  const { user, isLoadingUserStorageData } = useAuth()

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.gray[100],
    },
  }

  if (isLoadingUserStorageData) {
    return <Loading />
  }

  return (
    <Box flex={1} bg="green.50">
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          initialRouteName="redirect"
          screenOptions={{ headerShown: false }}
        >
          {!user || !user.id ? (
            <Stack.Screen name="authRoutes" component={AuthRoutes} />
          ) : (
            <>
              <Stack.Screen name="redirect" component={Redirect} />
              <Stack.Screen name="selectCity" component={SelectCity} />
              <Stack.Screen name="appRoutes" component={AppRoutes} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Box>
  )
}
