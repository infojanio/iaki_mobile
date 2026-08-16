import React from 'react'

import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack'

import { SignIn } from '@screens/SignIn'
import { SignUp } from '@screens/SignUp'
import { PrivacyPolicy } from '@screens/PrivacyPolicy'
import { TermsOfUse } from '@screens/TermsOfUse'
import { ForgotPassword } from '@screens/ForgotPassword'
import { ResetPassword } from '@screens/ResetPassword'
import { PasswordResetSuccess } from '@screens/PasswordResetSuccess'

export type AuthRoutesParams = {
  signin: undefined

  signup: undefined

  privacy: undefined

  terms: undefined

  forgotPassword: undefined

  resetPassword: {
    email: string
    challenge: string
  }

  passwordResetSuccess: undefined
}

export type AuthNavigatorRoutesProps =
  NativeStackNavigationProp<AuthRoutesParams>

const { Navigator, Screen } = createNativeStackNavigator<AuthRoutesParams>()

export function AuthRoutes() {
  return (
    <Navigator
      initialRouteName="signin"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Screen name="signin" component={SignIn} />

      <Screen name="signup" component={SignUp} />

      <Screen name="privacy" component={PrivacyPolicy} />

      <Screen name="terms" component={TermsOfUse} />

      <Screen name="forgotPassword" component={ForgotPassword} />

      <Screen name="resetPassword" component={ResetPassword} />

      <Screen name="passwordResetSuccess" component={PasswordResetSuccess} />
    </Navigator>
  )
}
