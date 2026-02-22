import { Box, useTheme } from 'native-base'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '@hooks/useAuth'
import { AuthRoutes } from './auth.routes'
import { AppRoutes } from './app.routes'
import { Redirect } from '@screens/Redirect'
import { SelectCity } from '@screens/SelectCity'
import { Loading } from '@components/Loading'

import {
  NavigationHistoryProvider,
  useNavigationHistory,
} from '@contexts/NavigationHistoryContext'
import { useRef } from 'react'
import { getActiveRoute } from './getActiveRoute'

const Stack = createNativeStackNavigator()

function NavigationRoot() {
  const { colors } = useTheme()
  const { user, isLoadingUserStorageData } = useAuth()
  const { recordRoute } = useNavigationHistory()
  const stateRef = useRef<any>(null)

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
    <NavigationContainer
      theme={theme}
      onStateChange={(state) => {
        stateRef.current = state
        const active = getActiveRoute(state)
        recordRoute(active)
      }}
    >
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
  )
}

export function Routes() {
  return (
    <NavigationHistoryProvider>
      <NavigationRoot />
    </NavigationHistoryProvider>
  )
}
