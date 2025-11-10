import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, FlatList, HStack, Text, VStack, useToast } from 'native-base'
import { TextInput, StyleSheet } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ProductDTO } from '@dtos/ProductDTO'
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import debounce from 'lodash.debounce'

// remove acentos
const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const INITIAL_SUGGESTIONS = 5
const PAGE_SIZE = 10

// gera id fallback estável
const makeTmpId = (seed: string, page: number, idx: number) =>
  `tmp-${page}-${idx}-${(seed || 'x').slice(0, 6)}`

// normaliza e garante id
const normalizeProducts = (raw: ProductDTO[], currentPage: number) =>
  (raw || []).map((p, idx) => {
    const base = String((p as any)?.id ?? (p as any)?._id ?? '')
    const safeId = base || makeTmpId(p?.name ?? '', currentPage, idx)
    return { ...p, id: safeId }
  })

export function SearchProducts() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const inputRef = useRef<TextInput>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  // foca no input ao abrir
  useFocusEffect(
    useCallback(() => {
      setTimeout(() => inputRef.current?.focus(), 100)
    }, []),
  )

  const handleOpenProductDetails = (productId: string) => {
    navigation.navigate('productDetails', { productId })
  }

  // busca ativa (com fallback)
  const fetchInitialSuggestions = useCallback(async () => {
    setIsLoading(true)
    setHasMore(true)
    try {
      // 1) tenta ativos
      const res = await api.get('/products/active', {
        params: { page: 1, limit: INITIAL_SUGGESTIONS },
      })
      let fetched = normalizeProducts(res.data?.products || [], 1)

      // 2) fallback: tenta retornar “algo”
      if (fetched.length === 0) {
        try {
          const res2 = await api.get('/products/search', {
            params: { query: 'a' },
          })
          fetched = normalizeProducts(res2.data?.products || [], 1).slice(
            0,
            INITIAL_SUGGESTIONS,
          )
        } catch {
          // ignora erro do fallback
        }
      }

      setProducts(fetched)
      setHasMore(fetched.length >= INITIAL_SUGGESTIONS)
    } catch (error) {
      const title =
        error instanceof AppError ? error.message : 'Erro ao carregar produtos.'
      toast.show({ title, placement: 'top', bgColor: 'red.500' })
      setProducts([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [toast])

  // paginação padrão (ativos)
  const fetchMore = useCallback(async (currentPage: number) => {
    try {
      const res = await api.get('/products/active', {
        params: { page: currentPage, limit: PAGE_SIZE },
      })
      const fetched = normalizeProducts(res.data?.products || [], currentPage)
      setProducts((prev) => [...prev, ...fetched])
      setHasMore(fetched.length >= PAGE_SIZE)
    } catch {
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [])

  // busca por texto
  const searchProducts = useCallback(
    debounce(async (query: string) => {
      try {
        setIsSearching(true)
        setIsLoading(true)

        const response = await api.get('/products/search', {
          params: { query },
        })
        const fetched = normalizeProducts(response.data?.products || [], 1)
        setProducts(fetched)
        setHasMore(false) // sem paginação no modo busca
      } catch (error) {
        const title =
          error instanceof AppError ? error.message : 'Erro ao buscar produtos.'
        toast.show({ title, placement: 'top', bgColor: 'red.500' })
        setProducts([])
      } finally {
        setIsLoading(false)
        setHasLoaded(true)
        setIsLoadingMore(false)
      }
    }, 500),
    [toast],
  )

  // input change
  const handleSearchChange = (text: string) => {
    setSearchTerm(text)
    const formattedQuery = removeAccents(text.trim())

    if (formattedQuery === '') {
      // volta p/ sugestões iniciais
      setIsSearching(false)
      setPage(1)
      setHasLoaded(false)
      fetchInitialSuggestions()
    } else {
      searchProducts(formattedQuery)
    }
  }

  // scroll infinito (somente quando NÃO está buscando)
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore || isSearching) return
    setIsLoadingMore(true)
    const next = page + 1
    setPage(next)
    fetchMore(next)
  }

  // primeira carga → sugestões iniciais
  useEffect(() => {
    fetchInitialSuggestions()
  }, [fetchInitialSuggestions])

  // loading inicial
  if (!hasLoaded && isLoading) {
    return (
      <VStack flex={1} bg="white" safeArea>
        <HomeScreen title="Pesquisar" />
        <Box px={4} pt={4}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Buscar produtos..."
            placeholderTextColor="#777"
            value={searchTerm}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCorrect={false}
          />
        </Box>
        <Loading />
      </VStack>
    )
  }

  return (
    <VStack flex={1} bg="white">
      <HomeScreen title="Pesquisar" />

      {/* Campo de busca */}
      <Box px={4} pt={4}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Digite o nome do produto"
          placeholderTextColor="#777"
          value={searchTerm}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          autoCorrect={false}
        />
      </Box>

      {/* Banner cashback */}
      <Box px={4} py={2} mx={4} mt={2} bg="primary.100" borderRadius="md">
        <HStack alignItems="center" space={1}>
          <MaterialIcons name="local-offer" size={18} color="#00875F" />
          <Text color="#00875F" fontWeight="bold">
            Todos os produtos oferecem cashback!
          </Text>
        </HStack>
      </Box>

      <FlatList
        data={products}
        keyExtractor={(item, index) =>
          item?.id ? `prod-${item.id}` : `idx-${index}`
        }
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleOpenProductDetails(item.id)}
          />
        )}
        onEndReached={!isSearching ? handleLoadMore : null}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          isLoading ? (
            <Loading />
          ) : (
            <Text textAlign="center" mt={10}>
              Nenhum produto encontrado.
            </Text>
          )
        }
        ListFooterComponent={isLoadingMore ? <Loading /> : null}
      />
    </VStack>
  )
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  contentContainer: {
    paddingBottom: 16,
  },
})
