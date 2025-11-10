import { Platform } from 'react-native'
import { useTheme } from 'native-base'

import {
  createBottomTabNavigator,
  BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs'

import HomeSvg from '@assets/home.svg'
import SearchSvg from '@assets/search.svg'
import CartSvg from '@assets/cart.svg'
import RequestSvg from '@assets/request.svg'
import ProfileSvg from '@assets/profile.svg'

import { Home } from '@screens/Home'
import { Search } from '@screens/Search'

import { Cart } from '@screens/Cart'
import { Request } from '@screens/Request'
import { Profile } from '@screens/Profile'
import { ProductList } from '@screens/Product/ProductList'
import { ProductDetails } from '@screens/Product/ProductDetails'

import { ProductBySubCategory } from '@screens/Product/ProductBySubCategory'

import { CategoryDetails } from '@utils/inuteis/CategoryDetails'

type BottomRoutes = {
  //home: undefined
  homeScreen: { userId: string } // undefined
  search: undefined
  cart: undefined
  request: undefined
  profile: undefined
  productList: undefined
  signUp: undefined
  productDetails: { productId: string }
  productBySubCategory: { categoryId: string }
  categoryDetails: undefined
}

export type BottomNavigatorRoutesProps = BottomTabNavigationProp<BottomRoutes>

const { Navigator, Screen } = createBottomTabNavigator<BottomRoutes>()

//rotas da aplicação
export function BottomRoutes() {
  //definição do tamanho dos ícones
  const { sizes, colors } = useTheme()
  const iconSize = sizes[8]

  return (
    <Navigator
      initialRouteName="homeScreen"
      screenOptions={{
        headerShown: false,
        //  tabBarShowLabel: true,
        tabBarActiveTintColor: colors.green[500],
        tabBarInactiveTintColor: colors.blueGray[800],
        tabBarStyle: {
          backgroundColor: colors.gray[100],
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 'auto' : 96,
          paddingBottom: sizes[8],
          paddingTop: sizes[6],
        },
      }}
    >
      <Screen
        name="homeScreen"
        component={Home}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <HomeSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />
      <Screen
        name="search"
        component={Search}
        options={{
          title: 'Pesquisar',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SearchSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />

      <Screen
        name="cart"
        component={Cart}
        options={{
          title: 'Carrinho',
          headerStyle: {
            backgroundColor: '#c6c9c1',
          },
          headerTintColor: '#272525',
          headerTitleStyle: {
            fontSize: 18,
          },

          tabBarIcon: ({ color }) => (
            <CartSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />
      <Screen
        name="request"
        component={Request}
        options={{
          title: 'Pedidos',
          headerStyle: {
            backgroundColor: '#c6c9c1',
          },
          headerTintColor: '#272525',
          headerTitleStyle: {
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: 18,
          },
          tabBarIcon: ({ color }) => (
            <RequestSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />
      <Screen
        name="profile"
        component={Profile}
        options={{
          title: 'Perfil',

          headerStyle: {
            backgroundColor: '#c6c9c1',
          },

          headerTintColor: '#272525',
          headerTitleStyle: {
            justifyContent: 'center',
            textAlign: 'center',
            fontSize: 18,
          },

          tabBarIcon: ({ color }) => (
            <ProfileSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
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
        name="productBySubCategory"
        component={ProductBySubCategory}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />
    </Navigator>
  )
}
