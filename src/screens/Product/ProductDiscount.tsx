import { useEffect, useState, useContext, useMemo } from 'react'
import {
  VStack,
  Text,
  FlatList,
  useToast,
  Box,
  HStack,
  Badge,
} from 'native-base'
import { TouchableOpacity } from 'react-native'

import { ProductDTO } from '@dtos/ProductDTO'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { ProductCard } from '@components/ProductCard'
import { CityContext } from '@contexts/CityContext'

type Props = {
  onPressProduct: (product: ProductDTO) => void
}

export function ProductDiscount({ onPressProduct }: Props) {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { city } = useContext(CityContext)
  const toast = useToast()

  async function fetchProductsByDiscount() {
    try {
      setIsLoading(true)

      // ✅ pode manter /products/cashback e só trocar o texto na UI
      // ou trocar para /products/discounts quando você criar esse endpoint
      const response = await api.get('/products/cashback')

      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar os produtos com desconto.'

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
    fetchProductsByDiscount()
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

  return (
    <VStack bg="gray.100" mt={2}>
      <VStack px={4} mb={2}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="md" fontWeight="semibold">
            🔥 Maiores Descontos
          </Text>

          <TouchableOpacity>
            <Box
              borderBottomWidth={3}
              borderColor="red.400"
              borderRadius="md"
              px={1}
            >
              <Text fontSize="sm" color="red.600" fontWeight="semibold">
                Ver todos
              </Text>
            </Box>
          </TouchableOpacity>
        </HStack>

        <Box mt={1} width={24} height={1} bg="red.400" />
      </VStack>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <Box position="relative">
              {/* ✅ ProductCard continua igual. Você só troca o texto dentro dele (se mostrar cashback lá). */}
              <ProductCard data={item} onPress={() => onPressProduct(item)} />
            </Box>
          )
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 16,
          paddingBottom: 32,
        }}
      />
    </VStack>
  )
}
