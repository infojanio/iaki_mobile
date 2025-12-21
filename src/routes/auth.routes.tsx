import React from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack'

import { SignIn } from '@screens/SignIn'
import { SignUp } from '@screens/SignUp'
import { PrivacyPolicy } from '@screens/PrivacyPolicy'
import { TermsOfUse } from '@screens/TermsOfUse'

type AuthRoutes = {
  signin: undefined
  signup: undefined
  privacy: undefined
  terms: undefined
}

export type AuthNavigatorRoutesProps = NativeStackNavigationProp<AuthRoutes>

const { Navigator, Screen } = createNativeStackNavigator<AuthRoutes>()

export function AuthRoutes() {
  return (
    <Navigator initialRouteName="signin" screenOptions={{ headerShown: false }}>
      <Screen name="signin" component={SignIn} />
      <Screen name="signup" component={SignUp} />
      <Screen name="privacy" component={PrivacyPolicy} />
      <Screen name="terms" component={TermsOfUse} />
    </Navigator>
  )
}
