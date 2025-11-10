import { Platform } from 'react-native'
import { useTheme } from 'native-base'
import { useSafeAreaInsets } from 'react-native-safe-area-context' // 👈
import {
  createBottomTabNavigator,
  BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs'

import HomeSvg from '@assets/home.svg'
import SearchSvg from '@assets/search.svg'

import CashbackSvg from '@assets/checked.svg'
import ProfileSvg from '@assets/profile.svg'
import RequestSvg from '@assets/pedidos.svg'

import { Home } from '@screens/Home'

import { Cart } from '@screens/Cart'
import { Checkout } from '@screens/Checkout'

import { Profile } from '@screens/Profile'
import { ProfileEdit } from '@screens/ProfileEdit'

import { ProductDetails } from '@screens/ProductDetails'

import { Category } from '@components/Category'

import { OrderConfirmation } from '@screens/OrderConfirmation'
import { StorageCartProps } from '@storage/storageCart'
import { OrderHistory } from '@screens/OrderHistory'
import { SearchProducts } from '@screens/SearchProducts'
import { AllProductsQuantity } from '@screens/AllProductsQuantity'
import { AllProductsCashback } from '@screens/AllProductsCashback'
import { OrderValidation } from '@screens/OrderValidation'
import { Localization } from '@screens/Localization'
import { CartTabIcon } from '@components/CartTabIcon.tsx'

import { useAuth } from '@hooks/useAuth'
import { Redirect } from '@screens/Redirect'
import { ProductList } from '@screens/Product/ProductList'
import { ProductBySubCategory } from '@screens/Product/ProductBySubCategory'
import { ProductsBySubCategory } from '@screens/Product/ProductsBySubCategory'

import { About } from '@screens/About'
import { PrivacyPolicy } from '@screens/PrivacyPolicy'
import { TermsOfUse } from '@screens/TermsOfUse'

type AppRoutes = {
  home: { userId: string }
  //homeScreen: { UserId: string } // undefined
  search: undefined
  cart: undefined
  request: undefined
  redirect: undefined
  profile: undefined
  profileEdit: undefined
  productList: undefined
  signUp: undefined

  about: undefined
  privacy: undefined
  terms: undefined

  localization: { userId: string }
  searchProducts: { productId: string }
  checkout: { cart: StorageCartProps[] }
  orderConfirmation: {
    orderId: string
    cashbackEarned?: number
    cashbackUsed?: number
  } // Modificado para receber apenas o ID
  orderHistory: undefined //
  productDetails: { productId: string }
  productBySubCategory: { categoryId: string }
  productsBySubCategory: { categoryId: string; subcategoryId?: string }
  category: undefined
  allProductsQuantity: undefined
  allProductsCashback: undefined
  orderValidation: { orderId: string }
}

export type AppNavigatorRoutesProps = BottomTabNavigationProp<AppRoutes>

const { Navigator, Screen } = createBottomTabNavigator<AppRoutes>()

//rotas da aplicação
export function AppRoutes() {
  //definição do tamanho dos ícones
  const { sizes, colors } = useTheme()
  const iconSize = sizes[5]

  const { isAdmin } = useAuth()

  const insets = useSafeAreaInsets() // 👈

  return (
    <Navigator
      initialRouteName="redirect"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12, // Ajuste conforme o desejado
          fontWeight: '400',
        },
        tabBarActiveTintColor: colors.green[500],
        tabBarInactiveTintColor: colors.blueGray[800],
        tabBarStyle: {
          backgroundColor: colors.gray[100],
          borderTopWidth: 1,
          // Altura e padding que respeitam a área segura inferior
          height:
            Platform.OS === 'android' ? 52 + insets.bottom : 55 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, sizes[2]),
          paddingTop: sizes[2],
        },
      }}
    >
      <Screen
        name="home"
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
        name="searchProducts"
        component={SearchProducts}
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
          tabBarIcon: ({ color }) => <CartTabIcon color={color} />,
        }}
      />

      <Screen
        name="orderHistory"
        component={OrderHistory}
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

      {/* 🔐 Rota protegida para Admin */}
      {isAdmin && (
        <Screen
          name="orderValidation"
          component={OrderValidation}
          options={{
            title: 'Validar',
            headerStyle: {
              backgroundColor: '#c6c9c1',
            },
            headerTintColor: '#272525',
            headerTitleStyle: {
              fontSize: 18,
            },

            tabBarIcon: ({ color }) => (
              <CashbackSvg fill={color} width={iconSize} height={iconSize} />
            ),
          }}
        />
      )}

      <Screen
        name="profile"
        component={Profile}
        options={{
          title: 'Perfil',

          headerStyle: {
            backgroundColor: '#688633',
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
        name="redirect"
        component={Redirect}
        options={{
          tabBarButton: () => null,
        }}
      />

      <Screen
        name="orderConfirmation"
        component={OrderConfirmation}
        //initialParams={{ orderId: '' }} // Definindo um valor inicial para evitar erro
        options={{
          tabBarButton: () => null, // oculta da tab bar
        }}
      />

      <Screen
        name="checkout"
        component={Checkout}
        options={{
          tabBarButton: () => null, // oculta da tab bar
        }}
      />

      <Screen
        name="profileEdit"
        component={ProfileEdit}
        options={{
          tabBarButton: () => null, // oculta da tab bar
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
        name="about"
        component={About}
        options={{
          tabBarButton: () => null, // oculta da tab bar
        }}
      />
      <Screen
        name="privacy"
        component={PrivacyPolicy}
        options={{
          tabBarButton: () => null, // oculta da tab bar
        }}
      />
      <Screen
        name="terms"
        component={TermsOfUse}
        options={{
          tabBarButton: () => null, // oculta da tab bar
        }}
      />

      <Screen
        name="productDetails"
        component={ProductDetails}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="localization"
        component={Localization}
        options={{
          tabBarStyle: { display: 'none' }, // Oculta completamente a tab bar
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="allProductsCashback"
        component={AllProductsCashback}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="allProductsQuantity"
        component={AllProductsQuantity}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="category"
        component={Category}
        options={{
          tabBarButton: () => null,
        }} //não mostra ícone
      />

      <Screen
        name="productsBySubCategory"
        component={ProductsBySubCategory}
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
