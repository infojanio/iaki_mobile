import { useEffect, useState, useContext, useMemo } from 'react'
import { VStack, Text, FlatList, useToast, Box, HStack } from 'native-base'
import { TouchableOpacity } from 'react-native'

import { ProductDTO } from '@dtos/ProductDTO'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { ProductCard } from '@components/ProductCard'
import { CityContext } from '@contexts/CityContext'

type Props = {
  onPressProduct: (product: ProductDTO) => void
}

export function ProductCashback({ onPressProduct }: Props) {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { city } = useContext(CityContext)
  const toast = useToast()

  async function fetchProductsByCashback() {
    try {
      setIsLoading(true)

      const response = await api.get('/products/cashback')
      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar os produtos com cashback.'

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
    fetchProductsByCashback()
  }, [])

  useEffect(() => {
    console.log('Produtos cashback:', products)
    console.log('Cidade atual:', city)
  }, [products, city])

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
            Maiores Cashback
          </Text>

          <TouchableOpacity>
            <Box
              borderBottomWidth={3}
              borderColor="yellow.300"
              borderRadius="md"
              px={1}
            >
              <Text fontSize="sm" color="green.700" fontWeight="semibold">
                Ver todos
              </Text>
            </Box>
          </TouchableOpacity>
        </HStack>

        <Box mt={1} width={24} height={1} bg="yellow.300" />
      </VStack>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard data={item} onPress={() => onPressProduct(item)} />
        )}
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
