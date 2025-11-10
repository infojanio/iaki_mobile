import React from 'react'
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack'

import { Localization } from '@screens/Localization'
import { SignIn } from '@screens/SignIn'
import { SignUp } from '@screens/SignUp'

import { Home } from '@screens/Home'
import { PrivacyPolicy } from '@screens/PrivacyPolicy'
import { TermsOfUse } from '@screens/TermsOfUse'

type AuthRoutes = {
  home: { userId: string }
  signin: undefined
  signup: undefined
  localization: undefined
  privacy: undefined
  terms: undefined
}

export type AuthNavigatorRoutesProps = NativeStackNavigationProp<AuthRoutes>

const { Navigator, Screen } = createNativeStackNavigator()

export function AuthRoutes() {
  return (
    <Navigator initialRouteName="signin" screenOptions={{ headerShown: false }}>
      <Screen name="signin" component={SignIn} />
      <Screen name="signup" component={SignUp} />

      <Screen name="home" component={Home} />
      <Screen name="localization" component={Localization} />
      <Screen name="privacy" component={PrivacyPolicy} />
      <Screen name="terms" component={TermsOfUse} />
    </Navigator>
  )
}

/*
      <Screen
        name="department"
        component={Department}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
        />

      <Screen
        name="tenantsByCity"
        component={TenantsByCity}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="productList"
        component={ProductList}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="productDetails"
        component={ProductDetails}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="categoryDetails"
        component={CategoryDetails}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="companiesByTenant"
        component={CompaniesByTenant}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="productBySubCategory"
        component={ProductBySubCategory}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

*/
