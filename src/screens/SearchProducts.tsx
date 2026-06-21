import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Box,
  FlatList,
  HStack,
  Icon,
  Text,
  VStack,
  useToast,
} from 'native-base'
import { TextInput, StyleSheet, Pressable, RefreshControl } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import debounce from 'lodash.debounce'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ProductDTO } from '@dtos/ProductDTO'
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CityContext } from '@contexts/CityContext'

const PAGE_SIZE = 24

const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const makeTmpId = (seed: string, page: number, idx: number) =>
  `tmp-${page}-${idx}-${(seed || 'x').slice(0, 6)}`

const normalizeProducts = (raw: ProductDTO[], currentPage: number) =>
  (raw || []).map((p, idx) => {
    const base = String((p as any)?.id ?? (p as any)?._id ?? '')
    const safeId = base || makeTmpId(p?.name ?? '', currentPage, idx)

    return {
      ...p,
      id: safeId,
    }
  })

export function SearchProducts() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const inputRef = useRef<TextInput>(null)

  const { city } = useContext(CityContext)

  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<ProductDTO[]>([])

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleOpenProductDetails = (productId: string) => {
    navigation.navigate('productDetails', { productId })
  }

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => inputRef.current?.focus(), 150)
    }, []),
  )

  async function loadProducts(pageNumber = 1, shouldRefresh = false) {
    if (!city?.id) {
      setProducts([])
      setIsLoading(false)
      return
    }

    try {
      if (pageNumber === 1 && !shouldRefresh) {
        setIsLoading(true)
      }

      const response = await api.get('/products/active', {
        params: {
          cityId: city.id,
          page: pageNumber,
          pageSize: PAGE_SIZE,
        },
      })

      const fetched = normalizeProducts(
        response.data?.products || response.data || [],
        pageNumber,
      )

      setProducts((prev) =>
        pageNumber === 1 ? fetched : [...prev, ...fetched],
      )

      setHasMore(fetched.length >= PAGE_SIZE)
      setPage(pageNumber)
    } catch (error) {
      const title =
        error instanceof AppError ? error.message : 'Erro ao carregar produtos.'

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
      setIsRefreshing(false)
    }
  }

  const searchProducts = useCallback(
    debounce(async (query: string) => {
      if (!city?.id) return

      try {
        setIsSearching(true)
        setIsLoading(true)
        setHasMore(false)

        const response = await api.get('/products/search', {
          params: {
            query,
            cityId: city.id,
            page: 1,
            pageSize: PAGE_SIZE,
          },
        })

        const fetched = normalizeProducts(
          response.data?.products || response.data || [],
          1,
        )

        setProducts(fetched)
      } catch (error) {
        const title =
          error instanceof AppError ? error.message : 'Erro ao buscar produtos.'

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })

        setProducts([])
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
        setIsRefreshing(false)
      }
    }, 400),
    [city?.id, toast],
  )

  function handleSearchChange(text: string) {
    setSearchTerm(text)

    const formattedQuery = removeAccents(text.trim())

    if (!formattedQuery) {
      searchProducts.cancel()
      setIsSearching(false)
      setHasMore(true)
      loadProducts(1)
      return
    }

    searchProducts(formattedQuery)
  }

  function handleClearSearch() {
    setSearchTerm('')
    searchProducts.cancel()
    setIsSearching(false)
    setHasMore(true)
    loadProducts(1)
  }

  function handleLoadMore() {
    if (isLoadingMore || isLoading || !hasMore || isSearching) return

    setIsLoadingMore(true)
    loadProducts(page + 1)
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    searchProducts.cancel()
    setSearchTerm('')
    setIsSearching(false)
    setHasMore(true)
    await loadProducts(1, true)
  }

  useEffect(() => {
    loadProducts(1)

    return () => {
      searchProducts.cancel()
    }
  }, [city?.id])

  return (
    <VStack flex={1} bg="#F8FAFC">
      <HomeScreen title="Pesquisar" />

      <Box px={3} pt={3} pb={2} bg="#F8FAFC">
        <HStack
          h={12}
          bg="white"
          borderRadius={16}
          px={3}
          alignItems="center"
          borderWidth={1}
          borderColor="coolGray.200"
          shadow={1}
        >
          <Icon
            as={MaterialIcons}
            name="search"
            size={5}
            color="coolGray.400"
            mr={2}
          />

          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Buscar produtos no IAki"
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCorrect={false}
          />

          {searchTerm.length > 0 && (
            <Pressable onPress={handleClearSearch}>
              <Icon
                as={MaterialIcons}
                name="close"
                size={5}
                color="coolGray.500"
              />
            </Pressable>
          )}
        </HStack>

        <HStack mt={2} justifyContent="space-between" alignItems="center">
          <Text fontSize="xs" color="coolGray.500">
            {isSearching
              ? `${products.length} resultado(s) encontrados`
              : `${products.length} produto(s) carregados`}
          </Text>

          {!isSearching && (
            <Text fontSize="xs" color="blue.600" fontWeight="700">
              Todos os produtos
            </Text>
          )}
        </HStack>
      </Box>

      {isLoading && products.length === 0 ? (
        <Loading />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) =>
            item?.id ? `prod-${item.id}-${index}` : `idx-${index}`
          }
          numColumns={3}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.contentContainer,
            products.length === 0 && styles.emptyContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          renderItem={({ item }) => (
            <Box style={styles.cardWrapper}>
              <ProductCard
                product={item}
                onPress={() => handleOpenProductDetails(item.id)}
              />
            </Box>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <VStack alignItems="center" mt={20} px={8}>
              <Icon
                as={MaterialIcons}
                name="search-off"
                size={16}
                color="coolGray.300"
              />

              <Text mt={4} fontSize="lg" fontWeight="700" color="coolGray.700">
                Nenhum produto encontrado
              </Text>

              <Text
                mt={1}
                fontSize="sm"
                textAlign="center"
                color="coolGray.500"
              >
                Tente buscar por outro nome ou confira se a cidade selecionada
                possui produtos cadastrados.
              </Text>
            </VStack>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <Box py={4}>
                <Loading />
              </Box>
            ) : null
          }
        />
      )}
    </VStack>
  )
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  contentContainer: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 120,
  },
  cardWrapper: {
    width: '32%',
    marginBottom: 8,
  },
  emptyContainer: {
    flexGrow: 1,
  },
})
