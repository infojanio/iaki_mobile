import React, { useEffect, useState, useCallback } from 'react'
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
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

export function AllProductsCashback() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const [products, setProducts] = useState<ProductDTO[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [cashbackFilter, setCashbackFilter] = useState<string>('all')

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const ITEMS_PER_PAGE = 6

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  const fetchProducts = useCallback(
    async (pageNumber = 1, filter = cashbackFilter) => {
      try {
        if (pageNumber === 1) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }

        const response = await api.get('/products/active', {
          params: {
            page: pageNumber,
            perPage: ITEMS_PER_PAGE,
          },
        })

        const fetchedProducts: ProductDTO[] =
          response.data.products || response.data || []

        if (pageNumber === 1) {
          setProducts(fetchedProducts)
          applyCashbackFilter(fetchedProducts, filter)
        } else {
          setProducts((prev) => [...prev, ...fetchedProducts])
          applyCashbackFilter([...products, ...fetchedProducts], filter)
        }

        const isLastPage = fetchedProducts.length < ITEMS_PER_PAGE
        setHasMore(!isLastPage)

        setPage(pageNumber)
      } catch (error) {
        const isAppError = error instanceof AppError
        const title = isAppError ? error.message : 'Erro ao carregar produtos.'

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [toast], // Removi as dependências que causavam o loop
  )

  const applyCashbackFilter = useCallback(
    (productsList: ProductDTO[], filter: string) => {
      let filtered = [...productsList]
      switch (filter) {
        case '5':
          filtered = productsList.filter(
            (product) => product.cashback_percentage > 5,
          )
          break
        case '10':
          filtered = productsList.filter(
            (product) => product.cashback_percentage > 10,
          )
          break
        case '15':
          filtered = productsList.filter(
            (product) => product.cashback_percentage > 15,
          )
          break
        default:
          filtered = productsList
      }
      setFilteredProducts(filtered)
    },
    [],
  )

  const handleCashbackFilterChange = (value: string) => {
    setCashbackFilter(value)
    fetchProducts(1, value) // Recarrega os produtos com o novo filtro
  }

  function handleLoadMore() {
    if (hasMore && !isLoadingMore) {
      fetchProducts(page + 1)
    }
  }

  useEffect(() => {
    fetchProducts(1)
  }, []) // Removi a dependência fetchProducts para evitar loop

  return (
    <VStack flex={1} bg="white" safeArea>
      <HomeScreen title="Maiores cashbacks" />

      <Box px={4} py={2} bg="primary.100" mx={4} my={2} borderRadius="md">
        <HStack alignItems="center" space={1}>
          <MaterialIcons name="local-offer" size={18} color="#00875F" />
          <Text color="#00875F" fontWeight="bold">
            Todos os produtos oferecem cashback!
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
            Filtrar por cashback
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
          accessibilityLabel="Filtrar por cashback"
          placeholder="Filtrar por cashback"
          _selectedItem={{
            bg: 'primary.100',
            endIcon: <CheckIcon size="5" />,
          }}
          mt={1}
          onValueChange={handleCashbackFilterChange}
        >
          <Select.Item label="Todos os produtos" value="all" />
          <Select.Item label="Cashback > 5%" value="5" />
          <Select.Item label="Cashback > 10%" value="10" />
          <Select.Item label="Cashback > 15%" value="15" />
        </Select>
      </Box>

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleOpenProductDetails(item.id)}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 16,
            paddingHorizontal: 16,
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
