import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from 'react'
import {
  Box,
  FlatList,
  HStack,
  Text,
  VStack,
  useToast,
  Modal,
  Button,
} from 'native-base'
import { TextInput, StyleSheet } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
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
import { CartContext } from '@contexts/CartContext'

// remove acentos
const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const INITIAL_SUGGESTIONS = 5
const PAGE_SIZE = 10

const makeTmpId = (seed: string, page: number, idx: number) =>
  `tmp-${page}-${idx}-${(seed || 'x').slice(0, 6)}`

const normalizeProducts = (raw: ProductDTO[], currentPage: number) =>
  (raw || []).map((p, idx) => {
    const base = String((p as any)?.id ?? '')
    const safeId = base || makeTmpId(p?.name ?? '', currentPage, idx)
    return { ...p, id: safeId }
  })

export function SearchProducts() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const inputRef = useRef<TextInput>(null)

  const { city } = useContext(CityContext)
  const { setCurrentStoreId } = useContext(CartContext)

  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  const [isCityModalOpen, setIsCityModalOpen] = useState(false)

  // foco automático
  useFocusEffect(
    useCallback(() => {
      setTimeout(() => inputRef.current?.focus(), 100)
    }, []),
  )

  function handleSelectProduct(product: ProductDTO) {
    if (!city) {
      toast.show({
        title: 'Selecione uma cidade',
        placement: 'top',
        bgColor: 'orange.500',
      })
      return
    }

    const productCityId = product.store?.cityId

    if (productCityId && productCityId !== city.id) {
      setIsCityModalOpen(true)
      return
    }

    const storeId = product.store?.id ?? product.store_id
    setCurrentStoreId(storeId)

    navigation.navigate('productDetails', { productId: product.id })
  }

  const fetchInitialSuggestions = useCallback(async () => {
    setIsLoading(true)
    setHasMore(true)

    try {
      const res = await api.get('/products/active', {
        params: { page: 1, limit: INITIAL_SUGGESTIONS },
      })

      const fetched = normalizeProducts(res.data?.products || [], 1)
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

        //debugando filtro
        console.log(
          'DEBUG city:',
          city?.id,
          'sample:',
          (fetched?.[0] as any)?.store,
        )

        setHasMore(false)
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

  const handleSearchChange = (text: string) => {
    setSearchTerm(text)
    const formattedQuery = removeAccents(text.trim())

    if (formattedQuery === '') {
      setIsSearching(false)
      setPage(1)
      setHasLoaded(false)
      fetchInitialSuggestions()
    } else {
      searchProducts(formattedQuery)
    }
  }

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore || isSearching) return
    setIsLoadingMore(true)
    const next = page + 1
    setPage(next)
    fetchMore(next)
  }

  useEffect(() => {
    fetchInitialSuggestions()
  }, [fetchInitialSuggestions])

  const filteredProducts = city
    ? products.filter((p) => {
        const cityIdFromStore =
          (p as any)?.store?.cityId ?? (p as any)?.store?.city_id
        // se não tiver cityId da store, NÃO mostra (evita vazamento de outras cidades)
        if (!cityIdFromStore) return false
        return String(cityIdFromStore) === String(city.id)
      })
    : []

  if (!hasLoaded && isLoading) {
    return (
      <VStack flex={1} bg="white">
        <HomeScreen title="Pesquisar" />
        <Box px={4} pt={4}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChangeText={handleSearchChange}
          />
        </Box>
        <Loading />
      </VStack>
    )
  }

  return (
    <VStack flex={1} bg="white">
      <HomeScreen title="Pesquisar" />

      <Box px={4} pt={4}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Digite o nome do produto"
          value={searchTerm}
          onChangeText={handleSearchChange}
        />
      </Box>

      <Box px={4} py={2} mx={4} mt={2} bg="primary.100" borderRadius="md">
        <HStack alignItems="center" space={1}>
          <MaterialIcons name="local-offer" size={18} color="#00875F" />
          <Text color="#00875F" fontWeight="bold">
            Todos os produtos oferecem cashback!
          </Text>
        </HStack>
      </Box>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => `prod-${item.id}`}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleSelectProduct(item)}
          />
        )}
        onEndReached={!isSearching ? handleLoadMore : null}
        onEndReachedThreshold={0.1}
        ListFooterComponent={isLoadingMore ? <Loading /> : null}
        ListEmptyComponent={
          <Text textAlign="center" mt={10}>
            Nenhum produto encontrado.
          </Text>
        }
      />

      {/* Modal explicativo */}
      <Modal isOpen={isCityModalOpen} onClose={() => setIsCityModalOpen(false)}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Produto indisponível</Modal.Header>
          <Modal.Body>
            <Text>Este produto pertence a uma loja de outra cidade.</Text>
            <Text mt={2}>
              Para visualizar ou comprar, altere sua cidade atual.
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => setIsCityModalOpen(false)}>Entendi</Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
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
