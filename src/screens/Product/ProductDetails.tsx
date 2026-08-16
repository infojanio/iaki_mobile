// src/screens/ProductDetailsScreen.tsx

import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  Box,
  Divider,
  Heading,
  HStack,
  Image,
  ScrollView,
  Text,
  useToast,
  VStack,
} from 'native-base'

import { useNavigation, useRoute } from '@react-navigation/native'

import { Button } from '@components/Button'
import { ButtonBack } from '@components/ButtonBack'
import { Loading } from '@components/Loading'

import { CartContext } from '@contexts/CartContext'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

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

  /*
   * Quantidade disponível em estoque.
   */
  quantity: number

  storeId?: string | null

  store?: {
    id: string
    name: string
  } | null
}

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/600'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function ProductDetails() {
  const route = useRoute()

  const { productId } = route.params as RouteParams

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const { cartItems, activeStoreId, addProductCart } = useContext(CartContext)

  const [product, setProduct] = useState<Product | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [isAdding, setIsAdding] = useState(false)

  const [loadError, setLoadError] = useState(false)

  /* =====================================
     CARREGAR PRODUTO
  ===================================== */

  const fetchProduct = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setIsLoading(true)
        setLoadError(false)

        const response = await api.get(`/products/${productId}`, {
          signal,
        })

        const data = response.data

        const normalizedProduct: Product = {
          id: data.id,
          name: data.name ?? 'Produto',
          description: data.description ?? null,
          price: Number(data.price ?? 0),
          image: data.image ?? null,
          cashbackPercentage: Number(data.cashbackPercentage ?? 0),
          quantity: Number(data.quantity ?? 0),
          storeId: data.storeId ?? data.store?.id ?? null,
          store: data.store
            ? {
                id: data.store.id,
                name: data.store.name,
              }
            : null,
        }

        setProduct(normalizedProduct)
      } catch (error: any) {
        /*
         * Não exibe erro quando a requisição foi cancelada
         * porque o usuário saiu da tela.
         */
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return
        }

        const title =
          error instanceof AppError
            ? error.message
            : 'Erro ao carregar os detalhes do produto'

        setProduct(null)
        setLoadError(true)

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [productId, toast],
  )

  useEffect(() => {
    const controller = new AbortController()

    fetchProduct(controller.signal)

    return () => {
      controller.abort()
    }
  }, [fetchProduct])

  /* =====================================
     DADOS DERIVADOS
  ===================================== */

  const productStoreId = useMemo(() => {
    if (!product) {
      return null
    }

    return product.storeId ?? product.store?.id ?? null
  }, [product])

  const cartQuantity = useMemo(() => {
    if (!product || !productStoreId || activeStoreId !== productStoreId) {
      return 0
    }

    return (
      cartItems.find((cartItem) => cartItem.productId === product.id)
        ?.quantity ?? 0
    )
  }, [activeStoreId, cartItems, product, productStoreId])

  const isOutOfStock = useMemo(() => {
    if (!product) {
      return true
    }

    return product.quantity <= 0
  }, [product])

  const hasReachedStockLimit = useMemo(() => {
    if (!product) {
      return false
    }

    return cartQuantity >= product.quantity
  }, [cartQuantity, product])

  const productImage = useMemo(() => {
    if (!product?.image) {
      return DEFAULT_PRODUCT_IMAGE
    }

    if (product.image.startsWith('http')) {
      return product.image
    }

    const normalizedBaseURL = api.defaults.baseURL?.replace(/\/+$/, '')

    if (!normalizedBaseURL) {
      return DEFAULT_PRODUCT_IMAGE
    }

    const normalizedImage = product.image.replace(/^\/+/, '')

    if (normalizedImage.startsWith('uploads/')) {
      return `${normalizedBaseURL}/${normalizedImage}`
    }

    return `${normalizedBaseURL}/uploads/${normalizedImage}`
  }, [product?.image])

  const formattedPrice = useMemo(() => {
    return currencyFormatter.format(product?.price ?? 0)
  }, [product?.price])

  /* =====================================
     ADICIONAR AO CARRINHO
  ===================================== */

  const handleAddToCart = useCallback(async () => {
    if (!product || !productStoreId || isAdding) {
      return
    }

    if (isOutOfStock) {
      toast.show({
        title: 'Produto esgotado',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    if (hasReachedStockLimit) {
      toast.show({
        title: 'Estoque insuficiente',
        description: 'Quantidade máxima disponível atingida.',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    setIsAdding(true)

    try {
      /*
       * Não chamamos ensureStoreContext() aqui.
       *
       * addProductCart() já executa essa verificação
       * internamente. Isso evita a validação duplicada.
       */
      await addProductCart({
        productId: product.id,
        storeId: productStoreId,
        quantity: 1,

        /*
         * Enviar os dados completos permite que o
         * CartContext atualize cartItems imediatamente.
         *
         * Isso elimina o GET do carrinho depois do POST.
         */
        product: {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          cashbackPercentage: product.cashbackPercentage,
          quantity: product.quantity,
        },
      })

      toast.show({
        title: 'Produto adicionado ao carrinho!',
        placement: 'top',
        bgColor: 'green.500',
      })

      navigation.navigate('cart')
    } catch (error: any) {
      console.error('[ProductDetails] Erro ao adicionar:', {
        productId: product.id,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      })

      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Não foi possível adicionar o produto ao carrinho'

      toast.show({
        title: 'Erro ao adicionar produto',
        description: message,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsAdding(false)
    }
  }, [
    addProductCart,
    hasReachedStockLimit,
    isAdding,
    isOutOfStock,
    navigation,
    product,
    productStoreId,
    toast,
  ])

  /* =====================================
     LOADING E ERRO
  ===================================== */

  if (isLoading) {
    return <Loading />
  }

  if (loadError || !product) {
    return (
      <VStack
        flex={1}
        bg="white"
        justifyContent="center"
        alignItems="center"
        px={6}
      >
        <Text textAlign="center" color="gray.600" fontSize="md" mb={4}>
          Não foi possível carregar os detalhes do produto.
        </Text>

        <Button title="Tentar novamente" onPress={() => fetchProduct()} />
      </VStack>
    )
  }

  /* =====================================
     TEXTO DO BOTÃO
  ===================================== */

  const buttonTitle = isOutOfStock
    ? 'Produto esgotado'
    : hasReachedStockLimit
      ? 'Quantidade máxima no carrinho'
      : cartQuantity > 0
        ? 'Adicionar mais uma unidade'
        : 'Adicionar ao carrinho'

  /* =====================================
     TELA
  ===================================== */

  return (
    <VStack flex={1} bg="white">
      <HStack mt={4}>
        <ButtonBack />
      </HStack>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Box
          bg="white"
          borderRadius="3xl"
          shadow={5}
          mt={4}
          mx={4}
          overflow="hidden"
        >
          <Image
            source={{
              uri: productImage,
            }}
            alt={product.name}
            width="full"
            height={200}
            resizeMode="contain"
            fallbackSource={{
              uri: DEFAULT_PRODUCT_IMAGE,
            }}
          />
        </Box>

        <VStack px={6} mt={4} space={4}>
          <Box bg="white" p={4} borderRadius="2xl" shadow={2}>
            <Heading fontSize="xl" color="gray.800" mb={1}>
              {product.name}
            </Heading>

            {product.store?.name ? (
              <Text fontSize="sm" color="blue.700">
                Vendido por {product.store.name}
              </Text>
            ) : null}

            <Divider my={3} />

            <HStack
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              mb={2}
            >
              <Text fontSize="20" fontWeight="bold" color="red.600">
                {formattedPrice}
              </Text>

              {product.cashbackPercentage > 0 ? (
                <Text fontSize="md" color="green.600" fontWeight="medium">
                  {product.cashbackPercentage}% de desconto
                </Text>
              ) : null}
            </HStack>

            <Text fontSize="md" color="gray.700" lineHeight="lg">
              {product.description?.trim() ||
                'Produto sem descrição disponível.'}
            </Text>

            {cartQuantity > 0 ? (
              <Box mt={4} px={3} py={2} bg="green.50" borderRadius="lg">
                <Text color="green.700" fontSize="sm" fontWeight="semibold">
                  {cartQuantity}{' '}
                  {cartQuantity === 1
                    ? 'unidade adicionada'
                    : 'unidades adicionadas'}
                </Text>
              </Box>
            ) : null}

            {product.quantity > 0 ? (
              <Text mt={3} fontSize="xs" color="gray.500">
                {product.quantity} unidades disponíveis
              </Text>
            ) : null}
          </Box>

          <Button
            title={buttonTitle}
            onPress={handleAddToCart}
            isLoading={isAdding}
            isDisabled={isAdding || isOutOfStock || hasReachedStockLimit}
          />
        </VStack>
      </ScrollView>
    </VStack>
  )
}
