import React from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack'

import { Initial } from '@screens/Initial'
import { Localization } from '@screens/Localization'
import { AppRoutes } from './app.routes'
import { BottomRoutes } from './bottom.routes'
import { SignIn } from '@screens/SignIn'
import { SignUp } from '@screens/SignUp'

import { CitySelect } from '@utils/inuteis/CitySelect'
import { CompaniesByTenant } from '@screens/Company/CompaniesByTenant'
import { TenantsByCity } from '@utils/Tenant/TenantsByCity'
import { Home } from '@screens/Home'

type StackRoutes = {
  initial: undefined

  home: { companyId: string }
  signin: undefined
  signup: undefined

  //supermarket: undefined
  //forgotPassword: undefined
  // address: undefined
  localization: undefined
}

export type StackNavigatorRoutesProps = NativeStackNavigationProp<StackRoutes>

const { Navigator, Screen } = createNativeStackNavigator()

export function StackRoutes() {
  return (
    <Navigator initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Screen name="home" component={Initial} />
      <Screen name="signin" component={SignIn} />
      <Screen name="signup" component={SignUp} />

      <Screen name="localization" component={Localization} />
    </Navigator>
  )
}
