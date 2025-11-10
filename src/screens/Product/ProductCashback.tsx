import { useEffect, useState } from 'react'
import { VStack, Text, FlatList, useToast, Box, HStack } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { TouchableOpacity } from 'react-native'

import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { ProductDTO } from '@dtos/ProductDTO'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'
//import { ProductCard } from '@components/Product/ProductCard'
import { ProductCard } from '@components/ProductCard'

export function ProductCashback() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  function handleViewAllCashbacks() {
    // Aqui você pode redirecionar para uma tela de "todos os produtos com cashback", se quiser
    navigation.navigate('allProductsCashback')
  }

  async function fetchProductsByCashback() {
    try {
      setIsLoading(true)

      const response = await api.get('/products/cashback')
      setProducts(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
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

  return (
    <VStack flex={1} bg="gray.100" h={150} mt={2}>
      <VStack px={4} mb={2}>
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="md" color="black.200" fontWeight="semibold">
            Maiores Cashback
          </Text>

          <TouchableOpacity onPress={handleViewAllCashbacks}>
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
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            data={item}
            onPress={() => handleOpenProductDetails(item.id)}
          />
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
