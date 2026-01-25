import { Platform } from 'react-native'
import { useTheme } from 'native-base'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  createBottomTabNavigator,
  BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs'
import { useContext } from 'react'

import HomeSvg from '@assets/home.svg'
import SearchSvg from '@assets/search.svg'
import CashbackSvg from '@assets/checked.svg'
import ProfileSvg from '@assets/profile.svg'
import RequestSvg from '@assets/pedidos.svg'

import { Home } from '@screens/Home'
import { Cart } from '@screens/Cart'
import { Profile } from '@screens/Profile'
import { OrderHistory } from '@screens/OrderHistory'
import { OrderValidation } from '@screens/OrderValidation'
import { SearchProducts } from '@screens/SearchProducts'

import { useAuth } from '@hooks/useAuth'
import { CartContext } from '@contexts/CartContext'

/* telas fora da tab bar */
import { Checkout } from '@screens/Checkout'
import { OrderConfirmation } from '@screens/OrderConfirmation'
import { ProfileEdit } from '@screens/ProfileEdit'
import { ProductDetails } from '@screens/Product/ProductDetails'
import { ProductList } from '@screens/Product/ProductList'
import { ProductsBySubCategory } from '@screens/Product/ProductsBySubCategory'
import { ProductBySubCategory } from '@screens/Product/ProductBySubCategory'
import { Category } from '@components/Category'
import { AllProductsQuantity } from '@screens/AllProductsQuantity'
import { AllProductsCashback } from '@screens/AllProductsCashback'
import { About } from '@screens/About'
import { PrivacyPolicy } from '@screens/PrivacyPolicy'
import { TermsOfUse } from '@screens/TermsOfUse'

import { StorageCartProps } from '@storage/storageCart'

import { ProductsByStore } from '@screens/Product/ProductsByStore'
import { StoresByBusiness } from '@screens/StoresByBusiness'
import { StoreProducts } from '@screens/StoreProducts'
import { CartTabIcon } from '@components/CartTabIcon'
import { StoreRatings } from '@screens/StoreRatings'

/* =======================
   TIPAGEM DAS ROTAS
======================= */

type AppRoutes = {
  home: undefined
  searchProducts: undefined
  storeProducts: { storeId: string }
  cart: undefined
  orderHistory: undefined
  orderValidation: { orderId: string } | undefined
  profile: undefined

  checkout: { cart: StorageCartProps[] }
  orderConfirmation: {
    orderId: string
    cashbackEarned?: number
    cashbackUsed?: number
  }
  profileEdit: undefined
  productList: undefined
  productDetails: { productId: string }
  productsBySubCategory: {
    storeId: string
    categoryId: string
    subcategoryId?: string
  }
  productsByStore: { businessCategoryId: string; storeId?: string }
  productBySubCategory: { categoryId: string; storeId: string }
  storeByCategory: { businessCategoryId: string }
  storesByBusiness: { businessCategoryId: string }
  category: undefined
  allProductsQuantity: undefined
  allProductsCashback: undefined
  about: undefined
  privacy: undefined
  terms: undefined
  storeRatings: { storeId: string; storeName: string }
}

export type AppNavigatorRoutesProps = BottomTabNavigationProp<AppRoutes>

const { Navigator, Screen } = createBottomTabNavigator<AppRoutes>()

/* =======================
   APP TABS
======================= */

export function AppRoutes() {
  const { sizes, colors } = useTheme()
  const iconSize = sizes[5]
  const insets = useSafeAreaInsets()
  const { isAdmin } = useAuth()

  // 🔥 AQUI ESTÁ O AJUSTE PRINCIPAL
  const { cartBadgeCount } = useContext(CartContext)

  return (
    <Navigator
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.green[500],
        tabBarInactiveTintColor: colors.blueGray[800],
        tabBarStyle: {
          backgroundColor: colors.gray[100],
          borderTopWidth: 1,
          height:
            Platform.OS === 'android' ? 52 + insets.bottom : 55 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, sizes[2]),
          paddingTop: sizes[2],
        },
      }}
    >
      {/* HOME */}
      <Screen
        name="home"
        component={Home}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <HomeSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />

      {/* PESQUISA */}
      <Screen
        name="searchProducts"
        component={SearchProducts}
        options={{
          title: 'Pesquisar',
          tabBarIcon: ({ color }) => (
            <SearchSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />

      {/* CARRINHO */}
      <Screen
        name="cart"
        component={Cart}
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ color }) => (
            <CartTabIcon
              color={color}
              badgeCount={cartBadgeCount} // 🔥 AQUI
            />
          ),
        }}
      />

      {/* PEDIDOS */}
      <Screen
        name="orderHistory"
        component={OrderHistory}
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => (
            <RequestSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />

      {/* ADMIN */}
      {isAdmin && (
        <Screen
          name="orderValidation"
          component={OrderValidation}
          options={{
            title: 'Validar',
            tabBarIcon: ({ color }) => (
              <CashbackSvg fill={color} width={iconSize} height={iconSize} />
            ),
          }}
        />
      )}

      {/* PERFIL */}
      <Screen
        name="profile"
        component={Profile}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <ProfileSvg fill={color} width={iconSize} height={iconSize} />
          ),
        }}
      />

      {/* ===== ROTAS OCULTAS ===== */}
      <Screen
        name="checkout"
        component={Checkout}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="orderConfirmation"
        component={OrderConfirmation}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="profileEdit"
        component={ProfileEdit}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="productList"
        component={ProductList}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="storeProducts"
        component={StoreProducts}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="storeByCategory"
        component={StoresByBusiness}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="storesByBusiness"
        component={StoresByBusiness}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="productDetails"
        component={ProductDetails}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="productsBySubCategory"
        component={ProductsBySubCategory}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="productsByStore"
        component={ProductsByStore}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="productBySubCategory"
        component={ProductBySubCategory}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="category"
        component={Category}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="allProductsQuantity"
        component={AllProductsQuantity}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="allProductsCashback"
        component={AllProductsCashback}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="about"
        component={About}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="privacy"
        component={PrivacyPolicy}
        options={{ tabBarButton: () => null }}
      />
      <Screen
        name="terms"
        component={TermsOfUse}
        options={{ tabBarButton: () => null }}
      />

      <Screen
        name="storeRatings"
        component={StoreRatings}
        options={{ tabBarButton: () => null }}
      />
    </Navigator>
  )
}
