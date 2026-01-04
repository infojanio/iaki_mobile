import { useEffect, useState } from 'react'
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

type RouteParams = {
  businessCategoryId: string
  storeId?: string // <-- aceita opcional para já abrir filtrado
}

export function ProductsByStore() {
  const toast = useToast()
  const route = useRoute()
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

  return (
    <VStack flex={1} bg="white" safeArea>
      <HomeScreen title="Produtos" />

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
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
          contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleOpenProductDetails(item.id)}
            />
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
