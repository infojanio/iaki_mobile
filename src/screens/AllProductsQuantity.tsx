import React, { useContext, useEffect, useState } from 'react'

import {
  VStack,
  Text,
  FlatList,
  useToast,
  Box,
  HStack,
  Select,
  CheckIcon,
  Spinner,
} from 'native-base'

import { TouchableOpacity } from 'react-native'

import { useNavigation } from '@react-navigation/native'

import { MaterialIcons } from '@expo/vector-icons'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { ProductDTO } from '@dtos/ProductDTO'

import { api } from '@services/api'

import { AppError } from '@utils/AppError'

import { ProductCard } from '@components/Product/ProductCard'

import { HomeScreen } from '@components/HomeScreen'

import { CartContext } from '@contexts/CartContext'

export function AllProductsQuantity() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [filteredProducts, setFilteredProducts] = useState<ProductDTO[]>([])

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [quantityFilter, setQuantityFilter] = useState('all')

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', {
      productId,
    })
  }

  function applyQuantityFilter(productsList: ProductDTO[], filter: string) {
    let filtered = [...productsList]

    switch (filter) {
      case '5':
        filtered = productsList.filter(
          (product) => Number(product.quantity ?? 0) < 5,
        )
        break

      case '10':
        filtered = productsList.filter(
          (product) => Number(product.quantity ?? 0) < 10,
        )
        break

      case '15':
        filtered = productsList.filter(
          (product) => Number(product.quantity ?? 0) < 15,
        )
        break

      default:
        filtered = productsList
    }

    setFilteredProducts(filtered)
  }

  function handleQuantityFilterChange(value: string) {
    setQuantityFilter(value)
    applyQuantityFilter(products, value)
  }

  async function fetchProductByQuantity() {
    try {
      setIsLoading(true)

      const response = await api.get('/products/quantity')

      const fetchedProducts: ProductDTO[] =
        response.data?.products ?? response.data ?? []

      setProducts(fetchedProducts)

      applyQuantityFilter(fetchedProducts, quantityFilter)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar os produtos que estão esgotando!'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })

      setProducts([])
      setFilteredProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  /*
   * Retorna a loja responsável pelo produto.
   *
   * A rota /products/quantity precisa retornar
   * storeId ou store.id em cada produto.
   */
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
      console.error(
        '[AllProductsQuantity] Produto sem storeId:',
        currentProduct,
      )

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
        description: 'Este produto não possui unidades disponíveis.',
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
        '[AllProductsQuantity] Erro ao adicionar:',
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
        '[AllProductsQuantity] Erro ao diminuir:',
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

  useEffect(() => {
    fetchProductByQuantity()
  }, [])

  return (
    <VStack flex={1} bg="gray.100">
      <HomeScreen title="Esgotando" />

      <Box px={4} py={2} bg="primary.100" mx={4} my={2} borderRadius="md">
        <HStack alignItems="center" space={1}>
          <MaterialIcons name="local-offer" size={18} color="#00875F" />

          <Text color="#00875F" fontWeight="bold">
            Compre e acumule pontos!
          </Text>
        </HStack>
      </Box>

      <VStack flex={1}>
        <VStack justifyContent="space-between" ml={1} mb={1}>
          <HStack justifyContent="space-between" alignItems="center" mr={2}>
            <Text fontSize="md" color="gray.800" fontWeight="semibold" ml={2}>
              Tá acabando
            </Text>

            <Text mr={4} fontSize="xs" color="gray.500">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </Text>
          </HStack>

          <Box ml={2} width={20} height={1} bg="yellow.300" />
        </VStack>

        <Box px={4} mb={3}>
          <Select
            selectedValue={quantityFilter}
            minWidth="200"
            accessibilityLabel="Filtrar por quantidade"
            placeholder="Filtrar por quantidade"
            _selectedItem={{
              bg: 'yellow.100',
              endIcon: <CheckIcon size="5" />,
            }}
            mt={1}
            onValueChange={handleQuantityFilterChange}
          >
            <Select.Item label="Todos os produtos" value="all" />

            <Select.Item label="Quantidade menor que 5" value="5" />

            <Select.Item label="Quantidade menor que 10" value="10" />

            <Select.Item label="Quantidade menor que 15" value="15" />
          </Select>
        </Box>

        {isLoading ? (
          <VStack flex={1} alignItems="center" justifyContent="center">
            <Spinner color="yellow.500" size="lg" />

            <Text mt={2} color="gray.500">
              Carregando produtos...
            </Text>
          </VStack>
        ) : (
          <FlatList
            data={filteredProducts}
            extraData={{
              cartItems,
              activeStoreId,
              updatingProductIds,
            }}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: 32,
            }}
            renderItem={({ item }) => (
              <Box mr={2}>
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
            ListEmptyComponent={
              <VStack width="full" alignItems="center" mt={8} px={8}>
                <MaterialIcons name="inventory-2" size={48} color="#9CA3AF" />

                <Text textAlign="center" mt={4} color="gray.500">
                  Nenhum produto encontrado com esse filtro.
                </Text>
              </VStack>
            }
          />
        )}
      </VStack>
    </VStack>
  )
}
