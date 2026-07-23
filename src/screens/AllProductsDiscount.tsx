import React, {
  useEffect,
  useState,
  useCallback,
  useContext,
  useMemo,
} from 'react'
import {
  VStack,
  Text,
  FlatList,
  useToast,
  Box,
  HStack,
  Spinner,
  Select,
  CheckIcon,
} from 'native-base'
import { StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ProductDTO } from '@dtos/ProductDTO'
import { ProductCard } from '@components/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
//add produto carrinho
import { CartContext } from '@contexts/CartContext'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

export function AllProductsDiscount() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [cashbackFilter, setCashbackFilter] = useState<string>('all')

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const ITEMS_PER_PAGE = 6

  //add produto carrinho
  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  const fetchProducts = useCallback(
    async (pageNumber = 1) => {
      try {
        if (pageNumber === 1) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const response = await api.get('/products', {
          params: {
            page: pageNumber,
            perPage: ITEMS_PER_PAGE,
          },
        })

        const fetchedProducts: ProductDTO[] = Array.isArray(
          response.data?.products,
        )
          ? response.data.products
          : Array.isArray(response.data)
            ? response.data
            : []

        setProducts((currentProducts) => {
          if (pageNumber === 1) {
            return fetchedProducts
          }

          const newProducts = fetchedProducts.filter(
            (newProduct) =>
              !currentProducts.some(
                (currentProduct) => currentProduct.id === newProduct.id,
              ),
          )

          return [...currentProducts, ...newProducts]
        })

        setHasMore(fetchedProducts.length >= ITEMS_PER_PAGE)

        setPage(pageNumber)
      } catch (error) {
        const title =
          error instanceof AppError
            ? error.message
            : 'Erro ao carregar produtos.'

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })

        if (pageNumber === 1) {
          setProducts([])
        }

        setHasMore(false)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [toast],
  )

  const filteredProducts = useMemo(() => {
    const minimumDiscount =
      cashbackFilter === 'all' ? 0 : Number(cashbackFilter)

    return products.filter((product) => {
      const discountPercentage = Number(product.cashbackPercentage ?? 0)

      /*
       * Como esta é a tela de descontos,
       * "Todos" exibe apenas produtos que
       * possuem algum desconto.
       */
      if (cashbackFilter === 'all') {
        return discountPercentage > 0
      }

      return discountPercentage > minimumDiscount
    })
  }, [products, cashbackFilter])

  function handleCashbackFilterChange(value: string) {
    setCashbackFilter(value)
  }

  function handleLoadMore() {
    if (!hasMore || isLoading || isLoadingMore) {
      return
    }

    fetchProducts(page + 1)
  }

  useEffect(() => {
    fetchProducts(1)
  }, []) // Removi a dependência fetchProducts para evitar loop

  //funções para adicionar e remover produtos diretamente no carrinho:
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
    <VStack flex={1} bg="white" safeArea>
      <HomeScreen title="Maiores descontos" />

      <Box px={4} py={2} bg="primary.100" mx={4} my={2} borderRadius="md">
        <HStack alignItems="center" space={1}>
          <MaterialIcons name="local-offer" size={18} color="#00875F" />
          <Text color="#00875F" fontWeight="bold">
            Todos os produtos oferecem descontos!
          </Text>
        </HStack>
      </Box>

      <VStack justifyContent={'space-between'} ml={1} mb={1}>
        <HStack justifyContent={'space-between'} mr={2}>
          <Text
            fontSize={'md'}
            color={'black.200'}
            fontWeight={'semibold'}
            ml={'2'}
          >
            Filtrar por desconto
          </Text>

          <Box
            mr={6}
            borderBottomWidth={'3.5'}
            borderColor={'yellow.300'}
            borderRadius={'md'}
          ></Box>
        </HStack>
        <Box ml={2} width={20} height={1} bg={'yellow.300'}>
          {''}
        </Box>
      </VStack>

      <Box px={4} mb={2}>
        <Select
          selectedValue={cashbackFilter}
          minWidth="200"
          accessibilityLabel="Filtrar por desconto"
          placeholder="Filtrar por desconto"
          _selectedItem={{
            bg: 'primary.100',
            endIcon: <CheckIcon size="5" />,
          }}
          mt={1}
          onValueChange={handleCashbackFilterChange}
        >
          <Select.Item label="Todos os produtos" value="all" />
          <Select.Item label="desconto > 5%" value="5" />
          <Select.Item label="desconto > 10%" value="10" />
          <Select.Item label="desconto > 15%" value="15" />
        </Select>
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={filteredProducts}
          extraData={{
            cartItems,
            activeStoreId,
            updatingProductIds,
          }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              data={item}
              cartQuantity={getCartQuantity(item)}
              isUpdating={isProductUpdating(item.id)}
              onIncrement={() => handleIncrementProduct(item)}
              onDecrement={() => handleDecrementProduct(item)}
              onPress={() => handleOpenProductDetails(item.id)}
            />
          )}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 16,
            paddingHorizontal: 4,
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            isLoadingMore ? <Spinner color="primary.500" mb={4} /> : null
          }
          ListEmptyComponent={
            <Text textAlign="center" mt={10} color="gray.500">
              Nenhum produto encontrado com esse filtro.
            </Text>
          }
        />
      )}
    </VStack>
  )
}

const styles = StyleSheet.create({
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
})
