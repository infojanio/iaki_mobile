import { useEffect, useState, useContext, useMemo } from 'react'
import { VStack, Text, FlatList, useToast, Box, HStack } from 'native-base'
import { TouchableOpacity } from 'react-native'

import { ProductDTO } from '@dtos/ProductDTO'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

import { ProductCard } from '@components/Product/ProductCard'

import { CityContext } from '@contexts/CityContext'

type Props = {
  onPressProduct: (product: ProductDTO) => void
}

export function ProductQuantity({ onPressProduct }: Props) {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { city } = useContext(CityContext)
  const toast = useToast()

  async function fetchProductByQuantity() {
    try {
      setIsLoading(true)

      const response = await api.get('/products/quantity')
      setProducts(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
          ? error.message
          : 'Não foi possível carregar os produtos que estão acabando.'

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
    fetchProductByQuantity()
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
    <VStack bg="gray.100" h={240}>
      <VStack>
        <VStack ml={1} mb={1}>
          <HStack justifyContent="space-between" mr={2}>
            <Text fontSize="md" fontWeight="semibold" ml={2}>
              Tá acabando
            </Text>

            <TouchableOpacity>
              <Box
                mr={6}
                borderBottomWidth={3}
                borderColor="yellow.300"
                borderRadius="md"
              >
                <Text
                  fontSize="sm"
                  color="green.700"
                  fontWeight="semibold"
                  ml={2}
                >
                  Ver todos
                </Text>
              </Box>
            </TouchableOpacity>
          </HStack>

          <Box ml={2} width={20} height={1} bg="yellow.300" />
        </VStack>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => onPressProduct(item)} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            marginLeft: 12,
            paddingBottom: 32,
          }}
        />
      </VStack>
    </VStack>
  )
}
