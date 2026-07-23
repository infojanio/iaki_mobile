import { useEffect, useState, useContext, useMemo } from 'react'
import { VStack, Text, FlatList, useToast, Box, HStack } from 'native-base'
import { TouchableOpacity } from 'react-native'
import { CartContext } from '@contexts/CartContext'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { ProductDTO } from '@dtos/ProductDTO'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { ProductCard } from '@components/Product/ProductCard'

import { CityContext } from '@contexts/CityContext'
import { useNavigation } from '@react-navigation/native'

type Props = {
  onPressProduct: (product: ProductDTO) => void
}

export function ProductQuantity({ onPressProduct }: Props) {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { city } = useContext(CityContext)

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const toast = useToast()

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const handleOpenProductDetails = (productId: string) => {
    navigation.navigate('productDetails', { productId })
  }

  const handleOpenAllProduct = () => {
    navigation.navigate('allProductsQuantity')
  }

  async function fetchProductByQuantity() {
    try {
      setIsLoading(true)

      const response = await api.get('/products/quantity')
      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar os produtos que estão acabando.'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductByQuantity()
  }, [])

  /**
   * 🔹 Filtra produtos pela cidade selecionada
   */
  const filteredProducts = useMemo(() => {
    if (!city) return []

    return products.filter((product) => product.store?.cityId === city.id)
  }, [products, city])

  if (!city || filteredProducts.length === 0) {
    return null
  }

  function getProductStoreId(currentProduct: ProductDTO) {
    return currentProduct.storeId ?? currentProduct.store?.id ?? null
  }

  function getCartQuantity(currentProduct: ProductDTO) {
    const productStoreId = getProductStoreId(currentProduct)

    if (!productStoreId || activeStoreId !== productStoreId) {
      return 0
    }

    return (
      cartItems.find((cartItem) => cartItem.productId === currentProduct.id)
        ?.quantity ?? 0
    )
  }

  function isProductUpdating(productId: string) {
    return updatingProductIds.includes(productId)
  }

  function setProductUpdating(productId: string, updating: boolean) {
    setUpdatingProductIds((current) => {
      if (updating) {
        if (current.includes(productId)) {
          return current
        }

        return [...current, productId]
      }

      return current.filter((id) => id !== productId)
    })
  }

  async function handleIncrementProduct(currentProduct: ProductDTO) {
    if (isProductUpdating(currentProduct.id)) {
      return
    }

    const productStoreId = getProductStoreId(currentProduct)

    if (!productStoreId) {
      console.error('[SearchProducts] Produto sem storeId:', currentProduct)

      toast.show({
        title: 'Não foi possível identificar a loja',
        description: 'Atualize a tela e tente novamente.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    const stockQuantity = Number(currentProduct.quantity ?? 0)

    const cartQuantity = getCartQuantity(currentProduct)

    if (stockQuantity <= 0) {
      toast.show({
        title: 'Produto esgotado',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    if (cartQuantity >= stockQuantity) {
      toast.show({
        title: 'Estoque insuficiente',
        description: 'Quantidade máxima disponível atingida.',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    try {
      setProductUpdating(currentProduct.id, true)

      if (cartQuantity === 0) {
        await addProductCart({
          productId: currentProduct.id,
          storeId: productStoreId,
          quantity: 1,
        })
      } else {
        await incrementProduct(currentProduct.id)
      }
    } catch (error: any) {
      console.error(
        '[SearchProducts] Erro ao adicionar:',
        error?.response?.status,
        error?.response?.data,
        error?.message,
      )

      toast.show({
        title: 'Erro ao adicionar produto',
        description:
          error?.response?.data?.message ??
          error?.message ??
          'Não foi possível adicionar o produto.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setProductUpdating(currentProduct.id, false)
    }
  }

  async function handleDecrementProduct(currentProduct: ProductDTO) {
    if (isProductUpdating(currentProduct.id)) {
      return
    }

    const cartQuantity = getCartQuantity(currentProduct)

    if (cartQuantity <= 0) {
      return
    }

    try {
      setProductUpdating(currentProduct.id, true)

      await decrementProduct(currentProduct.id)
    } catch (error: any) {
      console.error(
        '[SearchProducts] Erro ao diminuir:',
        error?.response?.status,
        error?.response?.data,
        error?.message,
      )

      toast.show({
        title: 'Erro ao atualizar produto',
        description:
          error?.response?.data?.message ??
          error?.message ??
          'Não foi possível diminuir a quantidade.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setProductUpdating(currentProduct.id, false)
    }
  }

  return (
    <VStack bg="gray.100" h={240} mb={6}>
      <VStack>
        <VStack ml={1} mb={1}>
          <HStack justifyContent="space-between" mr={2}>
            <Text fontSize="md" fontWeight="semibold" ml={2}>
              Tá acabando
            </Text>

            <TouchableOpacity onPress={() => handleOpenAllProduct()}>
              <Box
                mr={6}
                borderBottomWidth={3}
                borderColor="yellow.300"
                borderRadius="md"
              >
                <Text
                  fontSize="sm"
                  color="green.700"
                  fontWeight="semibold"
                  ml={2}
                >
                  Ver todos
                </Text>
              </Box>
            </TouchableOpacity>
          </HStack>

          <Box ml={2} width={20} height={1} bg="yellow.300" />
        </VStack>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Box>
              <ProductCard
                product={item}
                cartQuantity={getCartQuantity(item)}
                isUpdating={isProductUpdating(item.id)}
                onIncrement={() => handleIncrementProduct(item)}
                onDecrement={() => handleDecrementProduct(item)}
                onPress={() => handleOpenProductDetails(item.id)}
              />
            </Box>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            marginLeft: 12,
            paddingBottom: 32,
          }}
        />
      </VStack>
    </VStack>
  )
}
