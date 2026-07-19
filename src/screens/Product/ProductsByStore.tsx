import { useContext, useEffect, useState } from 'react'
import { CartContext } from '@contexts/CartContext'

import {
  Box,
  FlatList,
  HStack,
  ScrollView,
  Text,
  VStack,
  useToast,
} from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { StoreDTO } from '@dtos/StoreDTO'
import { ProductDTO } from '@dtos/ProductDTO'

import { StoreFilter } from '@components/Store/StoreFilter'
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { BackHome } from '@components/BackHome'

type RouteParams = {
  businessCategoryId: string
  storeId?: string // <-- aceita opcional para já abrir filtrado
}

export function ProductsByStore() {
  const toast = useToast()
  const route = useRoute()

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const { businessCategoryId, storeId: initialStoreId } =
    route.params as RouteParams

  const [stores, setStores] = useState<StoreDTO[]>([])
  const [selectedStore, setSelectedStore] = useState<string | null>(null)

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  async function fetchStores() {
    try {
      const { data } = await api.get<StoreDTO[]>('/stores/business-category', {
        params: { businessCategoryId },
      })

      setStores(data)

      // define a subcategoria selecionada:
      // 1) se veio pela rota e existe nessa categoria -> usa ela
      // 2) senão, usa a primeira da lista
      const existsFromRoute = initialStoreId
        ? data.some((s) => s.id === initialStoreId)
        : false

      const nextSelected =
        (existsFromRoute ? initialStoreId : data[0]?.id) ?? null

      setSelectedStore(nextSelected)
    } catch (error) {
      toast.show({
        title: 'Erro ao carregar lojas.',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  async function fetchProductsByStore(storeId: string) {
    try {
      setIsLoading(true)
      const response = await api.get<ProductDTO[]>(
        '/products/business-category',
        {
          params: { storeId },
        },
      )
      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError ? error.message : 'Erro ao buscar produtos.'
      toast.show({ title, placement: 'top', bgColor: 'red.500' })
    } finally {
      setIsLoading(false)
    }
  }

  // 1) carrega subcategorias quando a categoria muda
  useEffect(() => {
    fetchStores()
    // limpa produtos enquanto decide a subcategoria selecionada
    setProducts([])
  }, [businessCategoryId])

  // 2) sempre que a subcategoria selecionada mudar, busca os produtos
  useEffect(() => {
    if (selectedStore) {
      fetchProductsByStore(selectedStore)
    }
  }, [selectedStore])

  //funções para adicinar produtos no carrinho
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
      <BackHome title="Produtos" />

      {/* Filtros de subcategorias (horizontal) */}
      <Box px={4} pt={4}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space={3}>
            {stores.map((sub) => (
              <StoreFilter
                key={sub.id}
                title={sub.name}
                isActive={sub.id === selectedStore}
                onPress={() => setSelectedStore(sub.id)}
              />
            ))}
          </HStack>
        </ScrollView>
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          extraData={{
            cartItems,
            activeStoreId,
            updatingProductIds,
          }}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
          contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
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
          ListEmptyComponent={
            <Text textAlign="center" mt={10}>
              Nenhum produto encontrado para essa loja.
            </Text>
          }
        />
      )}
    </VStack>
  )
}
