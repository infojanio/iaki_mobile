import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation, useRoute } from '@react-navigation/native'

import { SafeAreaView } from 'react-native-safe-area-context'

import { CartContext } from '@contexts/CartContext'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

type RouteParams = {
  productId: string
}

type Product = {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  cashbackPercentage: number
  quantity: number
  storeId?: string | null

  store?: {
    id: string
    name: string
  } | null
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

function formatCurrency(value: number) {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  } catch {
    return `R$ ${value.toFixed(2).replace('.', ',')}`
  }
}

export function ProductDetails() {
  const route = useRoute()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const params = route.params as RouteParams | undefined

  const productId = params?.productId

  const { cartItems, activeStoreId, addProductCart } = useContext(CartContext)

  const [product, setProduct] = useState<Product | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [isAdding, setIsAdding] = useState(false)

  const [loadError, setLoadError] = useState(false)

  const [imageError, setImageError] = useState(false)

  const requestControllerRef = useRef<AbortController | null>(null)

  const requestIdRef = useRef(0)

  const mountedRef = useRef(true)

  /* ==============================
     MOUNT
  ============================== */

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false

      requestControllerRef.current?.abort()
    }
  }, [])

  /* ==============================
     CARREGAR PRODUTO
  ============================== */

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setLoadError(true)
      setIsLoading(false)

      return
    }

    requestControllerRef.current?.abort()

    const controller = new AbortController()

    requestControllerRef.current = controller

    const requestId = ++requestIdRef.current

    try {
      setIsLoading(true)
      setLoadError(false)
      setImageError(false)

      console.log('[ProductDetails] Carregando produto:', productId)

      const response = await api.get(`/products/${productId}`, {
        signal: controller.signal,
      })

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return
      }

      const data = response?.data

      if (!data || !data.id) {
        throw new Error('Produto inválido')
      }

      const normalizedProduct: Product = {
        id: String(data.id),

        name: data.name ?? 'Produto',

        description: data.description ?? null,

        price: safeNumber(data.price),

        image: data.image ?? null,

        cashbackPercentage: safeNumber(data.cashbackPercentage),

        quantity: safeNumber(data.quantity),

        storeId: data.storeId ?? data.store?.id ?? null,

        store: data.store?.id
          ? {
              id: data.store.id,

              name: data.store.name ?? 'Loja',
            }
          : null,
      }

      setProduct(normalizedProduct)
    } catch (error: any) {
      if (
        error?.code === 'ERR_CANCELED' ||
        error?.name === 'CanceledError' ||
        error?.message === 'canceled'
      ) {
        return
      }

      console.error('[ProductDetails] Erro ao carregar:', {
        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      if (mountedRef.current) {
        setProduct(null)
        setLoadError(true)

        Alert.alert(
          'Erro',
          error?.response?.data?.message ??
            'Não foi possível carregar os detalhes do produto.',
        )
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [productId])

  useEffect(() => {
    void fetchProduct()
  }, [fetchProduct])

  /* ==============================
     LOJA
  ============================== */

  const productStoreId = useMemo(() => {
    if (!product) {
      return null
    }

    return product.storeId ?? product.store?.id ?? null
  }, [product])

  /* ==============================
     QUANTIDADE NO CARRINHO
  ============================== */

  const cartQuantity = useMemo(() => {
    if (!product || !productStoreId || activeStoreId !== productStoreId) {
      return 0
    }

    const item = cartItems.find((cartItem) => cartItem.productId === product.id)

    return safeNumber(item?.quantity)
  }, [activeStoreId, cartItems, product, productStoreId])

  /* ==============================
     ESTOQUE
  ============================== */

  const isOutOfStock = useMemo(() => {
    return !product || safeNumber(product.quantity) <= 0
  }, [product])

  const hasReachedStockLimit = useMemo(() => {
    if (!product) {
      return false
    }

    return cartQuantity >= safeNumber(product.quantity)
  }, [cartQuantity, product])

  /* ==============================
     URL DA IMAGEM
  ============================== */

  const productImage = useMemo(() => {
    if (!product?.image) {
      return null
    }

    const image = product.image.trim()

    if (!image) {
      return null
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image
    }

    const baseURL = api.defaults.baseURL?.replace(/\/+$/, '')

    if (!baseURL) {
      return null
    }

    const normalizedImage = image.replace(/^\/+/, '')

    if (normalizedImage.startsWith('uploads/')) {
      return `${baseURL}/${normalizedImage}`
    }

    return `${baseURL}/uploads/${normalizedImage}`
  }, [product?.image])

  const formattedPrice = useMemo(() => {
    return formatCurrency(safeNumber(product?.price))
  }, [product?.price])

  /* ==============================
     ADICIONAR AO CARRINHO
  ============================== */

  const handleAddToCart = useCallback(async () => {
    if (!product || !productStoreId || isAdding) {
      return
    }

    if (isOutOfStock) {
      Alert.alert(
        'Produto esgotado',
        'Este produto não possui unidades disponíveis.',
      )

      return
    }

    if (hasReachedStockLimit) {
      Alert.alert(
        'Estoque insuficiente',
        'Quantidade máxima disponível atingida.',
      )

      return
    }

    try {
      setIsAdding(true)

      console.log('[ProductDetails] Adicionando produto:', {
        productId: product.id,

        storeId: productStoreId,
      })

      await addProductCart({
        productId: product.id,

        storeId: productStoreId,

        quantity: 1,

        product: {
          id: product.id,

          name: product.name,

          image: product.image,

          price: safeNumber(product.price),

          cashbackPercentage: safeNumber(product.cashbackPercentage),

          quantity: safeNumber(product.quantity),
        },
      })

      if (!mountedRef.current) {
        return
      }

      /*
       * Mantemos a navegação atual
       * após inclusão bem-sucedida.
       */
      navigation.navigate('cart')
    } catch (error: any) {
      console.error('[ProductDetails] Erro ao adicionar:', {
        productId: product.id,

        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      if (mountedRef.current) {
        Alert.alert(
          'Erro ao adicionar produto',
          error?.response?.data?.message ??
            error?.message ??
            'Não foi possível adicionar o produto ao carrinho.',
        )
      }
    } finally {
      if (mountedRef.current) {
        setIsAdding(false)
      }
    }
  }, [
    addProductCart,
    hasReachedStockLimit,
    isAdding,
    isOutOfStock,
    navigation,
    product,
    productStoreId,
  ])

  /* ==============================
     VOLTAR
  ============================== */

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('home')
    }
  }, [navigation])

  /* ==============================
     LOADING
  ============================== */

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#00875F" />

        <Text style={styles.loadingText}>Carregando produto...</Text>
      </SafeAreaView>
    )
  }

  /* ==============================
     ERRO
  ============================== */

  if (loadError || !product) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <MaterialIcons name="error-outline" size={54} color="#9CA3AF" />

        <Text style={styles.errorText}>
          Não foi possível carregar os detalhes do produto.
        </Text>

        <Pressable
          onPress={() => void fetchProduct()}
          style={({ pressed }) => [
            styles.retryButton,

            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>

        <Pressable onPress={handleBack} style={styles.backTextButton}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  /* ==============================
     TEXTO DO BOTÃO
  ============================== */

  const buttonTitle = isOutOfStock
    ? 'Produto esgotado'
    : hasReachedStockLimit
      ? 'Quantidade máxima no carrinho'
      : cartQuantity > 0
        ? 'Adicionar mais uma unidade'
        : 'Adicionar ao carrinho'

  const buttonDisabled = isAdding || isOutOfStock || hasReachedStockLimit

  /* ==============================
     TELA
  ============================== */

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* CABEÇALHO */}

      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,

            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="arrow-back" size={26} color="#111827" />
        </Pressable>

        <Text numberOfLines={1} style={styles.headerTitle}>
          Detalhes do produto
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGEM */}

        <View style={styles.imageContainer}>
          {productImage && !imageError ? (
            <Image
              source={{
                uri: productImage,
              }}
              style={styles.image}
              resizeMode="contain"
              resizeMethod="resize"
              fadeDuration={0}
              onError={(event) => {
                console.log(
                  '[ProductDetails] Erro ao carregar imagem:',
                  event.nativeEvent?.error,
                )

                setImageError(true)
              }}
            />
          ) : (
            <View style={styles.imageFallback}>
              <MaterialIcons
                name="image-not-supported"
                size={58}
                color="#9CA3AF"
              />

              <Text style={styles.imageFallbackText}>Imagem indisponível</Text>
            </View>
          )}
        </View>

        {/* DADOS */}

        <View style={styles.card}>
          <Text style={styles.productName}>{product.name}</Text>

          {product.store?.name ? (
            <Text style={styles.storeName}>
              Vendido por {product.store.name}
            </Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formattedPrice}</Text>

            {product.cashbackPercentage > 0 ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {product.cashbackPercentage}% de desconto
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.description}>
            {product.description?.trim() || 'Produto sem descrição disponível.'}
          </Text>

          {cartQuantity > 0 ? (
            <View style={styles.cartInfo}>
              <MaterialIcons name="shopping-cart" size={17} color="#15803D" />

              <Text style={styles.cartInfoText}>
                {cartQuantity}{' '}
                {cartQuantity === 1
                  ? 'unidade adicionada'
                  : 'unidades adicionadas'}
              </Text>
            </View>
          ) : null}

          {product.quantity > 0 ? (
            <Text style={styles.stockText}>
              {product.quantity} unidades disponíveis
            </Text>
          ) : (
            <Text style={styles.outOfStockText}>Produto esgotado</Text>
          )}
        </View>

        {/* BOTÃO */}

        <Pressable
          onPress={() => void handleAddToCart()}
          disabled={buttonDisabled}
          style={({ pressed }) => [
            styles.addButton,

            buttonDisabled && styles.addButtonDisabled,

            pressed && !buttonDisabled && styles.pressed,
          ]}
        >
          {isAdding ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator size="small" color="#FFFFFF" />

              <Text style={styles.addButtonText}>Adicionando...</Text>
            </View>
          ) : (
            <Text style={styles.addButtonText}>{buttonTitle}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  header: {
    minHeight: 56,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 12,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: '#E5E7EB',

    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 44,
    height: 44,

    alignItems: 'center',

    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,

    textAlign: 'center',

    fontSize: 17,

    fontWeight: '700',

    color: '#111827',
  },

  headerSpacer: {
    width: 44,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  imageContainer: {
    height: 230,

    marginHorizontal: 16,

    marginTop: 16,

    borderRadius: 16,

    overflow: 'hidden',

    backgroundColor: '#F9FAFB',

    elevation: 2,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageFallback: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',
  },

  imageFallbackText: {
    marginTop: 8,

    fontSize: 13,

    color: '#9CA3AF',
  },

  card: {
    marginHorizontal: 16,

    marginTop: 16,

    padding: 18,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    elevation: 2,
  },

  productName: {
    fontSize: 22,

    fontWeight: '700',

    color: '#1F2937',
  },

  storeName: {
    marginTop: 5,

    fontSize: 13,

    color: '#1D4ED8',
  },

  divider: {
    height: StyleSheet.hairlineWidth,

    marginVertical: 14,

    backgroundColor: '#E5E7EB',
  },

  priceRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    flexWrap: 'wrap',

    gap: 8,
  },

  price: {
    fontSize: 21,

    fontWeight: '700',

    color: '#DC2626',
  },

  discountBadge: {
    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 14,

    backgroundColor: '#DCFCE7',
  },

  discountText: {
    fontSize: 13,

    fontWeight: '600',

    color: '#15803D',
  },

  description: {
    marginTop: 16,

    fontSize: 15,

    lineHeight: 22,

    color: '#374151',
  },

  cartInfo: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 16,

    paddingHorizontal: 12,

    paddingVertical: 10,

    borderRadius: 10,

    backgroundColor: '#F0FDF4',
  },

  cartInfoText: {
    marginLeft: 6,

    fontSize: 13,

    fontWeight: '600',

    color: '#15803D',
  },

  stockText: {
    marginTop: 12,

    fontSize: 12,

    color: '#6B7280',
  },

  outOfStockText: {
    marginTop: 12,

    fontSize: 13,

    fontWeight: '600',

    color: '#DC2626',
  },

  addButton: {
    minHeight: 52,

    marginHorizontal: 16,

    marginTop: 16,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 16,

    backgroundColor: '#00875F',
  },

  addButtonDisabled: {
    backgroundColor: '#9CA3AF',

    opacity: 0.8,
  },

  addButtonText: {
    fontSize: 16,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  buttonLoading: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,
  },

  loadingScreen: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',
  },

  loadingText: {
    marginTop: 10,

    fontSize: 13,

    color: '#6B7280',
  },

  errorScreen: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,

    backgroundColor: '#FFFFFF',
  },

  errorText: {
    marginTop: 14,

    fontSize: 15,

    lineHeight: 22,

    textAlign: 'center',

    color: '#4B5563',
  },

  retryButton: {
    minHeight: 46,

    minWidth: 180,

    marginTop: 22,

    paddingHorizontal: 20,

    borderRadius: 8,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#00875F',
  },

  retryButtonText: {
    fontSize: 15,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  backTextButton: {
    marginTop: 18,

    padding: 10,
  },

  backText: {
    fontSize: 14,

    fontWeight: '600',

    color: '#6B7280',
  },

  pressed: {
    opacity: 0.7,
  },
})
