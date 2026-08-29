import { Platform, View } from 'react-native'
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
import ProfileSvg from '@assets/bank.svg'
import RequestSvg from '@assets/pedidos.svg'

import { Home } from '@screens/Home'
import { Cart } from '@screens/Cart'

import { ProfileWallet } from '@screens/ProfileWallet'
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
import { AllProductsDiscount } from '@screens/AllProductsDiscount'
import { About } from '@screens/About'
import { PrivacyPolicy } from '@screens/PrivacyPolicy'
import { TermsOfUse } from '@screens/TermsOfUse'

import { ProductsByStore } from '@screens/Product/ProductsByStore'
import { StoresByBusiness } from '@screens/StoresByBusiness'
import { StoreProducts } from '@screens/StoreProducts'
import { CartTabIcon } from '@components/CartTabIcon'
import { StoreRatings } from '@screens/StoreRatings'
import { StoreRewardCatalog } from '@screens/StoreRewardCatalog'
import { RewardQRCodeScreen } from '@screens/RewardQRCodeScreen'
import { Rewards } from '@screens/Rewards'
import { StoreList } from '@screens/StoreList'

/* =======================
   TIPAGEM DAS ROTAS
======================= */

type TabIconBoxProps = {
  children: React.ReactNode
}

function TabIconBox({ children }: TabIconBoxProps) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  )
}

type AppRoutes = {
  home: undefined
  searchProducts: undefined
  storeList: undefined
  storeProducts: { storeId: string }
  cart: undefined
  orderHistory: undefined
  orderValidation: { orderId: string } | undefined
  profile: undefined
  wallet: undefined
  rewards: undefined

  checkout: undefined
  orderConfirmation: {
    orderId: string
    pointsEarned?: number
    pointsUsed?: number
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
  category: {
    storeId: string
  }
  allProductsQuantity: undefined
  allProductsDiscount: undefined
  about: undefined
  privacy: undefined
  terms: undefined
  storeRatings: { storeId: string; storeName: string }
  storeRewardCatalog: { storeId: string; storeName?: string }
  rewardQRCode: { redemptionId: string; storeId: string }
}

export type AppNavigatorRoutesProps = BottomTabNavigationProp<AppRoutes>

const { Navigator, Screen } = createBottomTabNavigator<AppRoutes>()

const hiddenTabOptions = {
  tabBarButton: () => null,

  tabBarItemStyle: {
    display: 'none' as const,
  },
}

/* =======================
   APP TABS
======================= */

export function AppRoutes() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { isAdmin } = useAuth()
  const iconSize = isAdmin ? 24 : 20

  // 🔥 AQUI ESTÁ O AJUSTE PRINCIPAL
  const { cartBadgeCount } = useContext(CartContext)

  return (
    <Navigator
      initialRouteName="home"
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',

        tabBarActiveTintColor: colors.green[500],
        tabBarInactiveTintColor: colors.blueGray[800],

        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          backgroundColor: colors.gray[100],
          borderTopWidth: 1,

          height:
            Platform.OS === 'android' ? 68 + insets.bottom : 70 + insets.bottom,

          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
        },

        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 2,
        },

        tabBarIconStyle: {
          width: 24,
          height: 24,

          alignItems: 'center',
          justifyContent: 'center',

          marginTop: 0,
          marginBottom: 3,
        },

        tabBarLabelStyle: {
          fontSize: isAdmin ? 8 : 10,
          lineHeight: isAdmin ? 10 : 12,

          textAlign: 'center',

          marginTop: 0,
          marginBottom: 0,
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
            <TabIconBox>
              <HomeSvg fill={color} width={iconSize} height={iconSize} />
            </TabIconBox>
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
            <TabIconBox>
              <SearchSvg fill={color} width={iconSize} height={iconSize} />
            </TabIconBox>
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
            <TabIconBox>
              <CartTabIcon
                color={color}
                badgeCount={cartBadgeCount}
                size={iconSize}
              />
            </TabIconBox>
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
            <TabIconBox>
              <RequestSvg fill={color} width={iconSize} height={iconSize} />
            </TabIconBox>
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
              <TabIconBox>
                <CashbackSvg fill={color} width={iconSize} height={iconSize} />
              </TabIconBox>
            ),
          }}
        />
      )}

      {/* WALLET */}
      <Screen
        name="wallet"
        component={ProfileWallet}
        options={{
          title: 'Pontos',
          tabBarIcon: ({ color }) => (
            <TabIconBox>
              <ProfileSvg fill={color} width={iconSize} height={iconSize} />
            </TabIconBox>
          ),
        }}
      />

      {/* ===== ROTAS OCULTAS ===== */}
      <Screen name="checkout" component={Checkout} options={hiddenTabOptions} />
      <Screen
        name="orderConfirmation"
        component={OrderConfirmation}
        options={hiddenTabOptions}
      />
      <Screen
        name="profileEdit"
        component={ProfileEdit}
        options={hiddenTabOptions}
      />
      <Screen
        name="productList"
        component={ProductList}
        options={hiddenTabOptions}
      />

      <Screen
        name="storeList"
        component={StoreList}
        options={hiddenTabOptions}
      />

      <Screen
        name="storeProducts"
        component={StoreProducts}
        options={hiddenTabOptions}
      />
      <Screen
        name="storeByCategory"
        component={StoresByBusiness}
        options={hiddenTabOptions}
      />
      <Screen
        name="storesByBusiness"
        component={StoresByBusiness}
        options={hiddenTabOptions}
      />
      <Screen
        name="productDetails"
        component={ProductDetails}
        options={hiddenTabOptions}
      />
      <Screen
        name="productsBySubCategory"
        component={ProductsBySubCategory}
        options={hiddenTabOptions}
      />
      <Screen
        name="productsByStore"
        component={ProductsByStore}
        options={hiddenTabOptions}
      />
      <Screen
        name="productBySubCategory"
        component={ProductBySubCategory}
        options={hiddenTabOptions}
      />
      <Screen name="category" component={Category} options={hiddenTabOptions} />
      <Screen
        name="allProductsQuantity"
        component={AllProductsQuantity}
        options={hiddenTabOptions}
      />
      <Screen
        name="allProductsDiscount"
        component={AllProductsDiscount}
        options={hiddenTabOptions}
      />

      <Screen name="rewards" component={Rewards} options={hiddenTabOptions} />

      <Screen name="about" component={About} options={hiddenTabOptions} />
      <Screen
        name="privacy"
        component={PrivacyPolicy}
        options={hiddenTabOptions}
      />
      <Screen name="terms" component={TermsOfUse} options={hiddenTabOptions} />

      <Screen
        name="storeRatings"
        component={StoreRatings}
        options={hiddenTabOptions}
      />

      <Screen
        name="storeRewardCatalog"
        component={StoreRewardCatalog}
        options={hiddenTabOptions}
      />

      <Screen
        name="rewardQRCode"
        component={RewardQRCodeScreen}
        options={hiddenTabOptions}
      />
    </Navigator>
  )
}
