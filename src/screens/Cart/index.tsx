import {
  HStack,
  Image,
  Text,
  VStack,
  Button,
  Icon,
  Divider,
  ScrollView,
  Spinner,
  useToast,
  Box,
} from 'native-base'
import { AntDesign } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useEffect, useMemo, useState, useContext } from 'react'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CartContext } from '@contexts/CartContext'
import { formatCurrency } from '@utils/format'

export function Cart() {
  const {
    cartItems,
    stockInfo,
    updateProductQuantity,
    removeProductCart,
    fetchCart,
    getAvailableStock,
    getStockCalculation,
  } = useContext(CartContext)

  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({})

  // Carrega o carrinho e estoque inicial
  useEffect(() => {
    const loadCart = async () => {
      try {
        setIsLoading(true)
        await fetchCart()
      } catch (error) {
        showErrorToast('Não foi possível carregar o carrinho')
      } finally {
        setIsLoading(false)
      }
    }

    loadCart()
  }, [])

  // Mantém a ordem original dos itens
  const orderedCartItems = useMemo(() => [...cartItems], [cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0)
  }, [cartItems])

  const showErrorToast = (description: string) => {
    toast.show({
      title: 'Erro',
      description,
      bg: 'red.500',
      placement: 'top',
    })
  }

  const showWarningToast = (title: string, description: string) => {
    toast.show({
      title,
      description,
      bg: 'orange.500',
      placement: 'top',
      duration: 3000,
    })
  }

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setIsUpdating((prev) => ({ ...prev, [id]: true }))

    try {
      const availableStock = getAvailableStock(id)
      const currentItem = cartItems.find((item) => item.productId === id)

      if (!currentItem) return

      const quantityDifference = newQuantity - currentItem.quantity

      if (quantityDifference > availableStock) {
        showWarningToast(
          'Estoque insuficiente',
          `Você pode adicionar mais ${availableStock} unidades`,
        )
        return
      }

      await updateProductQuantity(id, newQuantity)
    } catch (error) {
      showErrorToast('Não foi possível atualizar a quantidade')
    } finally {
      setIsUpdating((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleIncrease = async (id: string, currentQty: number) => {
    const availableStock = getAvailableStock(id)

    if (availableStock <= 0) {
      showWarningToast(
        'Estoque esgotado',
        'Não há mais unidades disponíveis deste produto',
      )
      return
    }

    await handleQuantityChange(id, currentQty + 1)
  }

  const handleDecrease = async (id: string, currentQty: number) => {
    if (currentQty > 1) {
      await handleQuantityChange(id, currentQty - 1)
    }
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeProductCart(productId)
    } catch (error) {
      showErrorToast('Não foi possível remover o item')
    }
  }

  const handleCheckout = async () => {
    const outOfStockItems = cartItems.filter((item) => {
      const stockData = stockInfo[item.productId]
      return !stockData || item.quantity > stockData.totalStock
    })

    if (outOfStockItems.length > 0) {
      const errorMessage = outOfStockItems
        .map((item) => {
          const stockData = stockInfo[item.productId]
          return `${item.name} (Disponível: ${stockData?.totalStock || 0})`
        })
        .join('\n')

      showWarningToast(
        'Ajuste seu carrinho',
        `Estoque insuficiente:\n${errorMessage}`,
      )
      return
    }

    navigation.navigate('checkout', {
      cart: cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        cashback_percentage: item.cashback_percentage,
        storeId: item.storeId,
        quantity: item.quantity,
      })),
    })
  }

  const renderCartItem = (item: typeof cartItems[0]) => {
    const stockData = stockInfo[item.productId]
    const totalStock = stockData?.totalStock || 0
    const availableStock = getAvailableStock(item.productId)
    const isMaxQuantityReached = availableStock <= 0

    return (
      <HStack
        key={item.productId}
        bg="white"
        borderRadius="lg"
        p={3}
        mb={3}
        alignItems="center"
        justifyContent="space-between"
      >
        <HStack space={3} alignItems="center">
          <Image
            source={{ uri: item.image }}
            alt={item.name}
            size="sm"
            borderRadius="md"
            borderWidth={1}
            borderColor="gray.300"
          />
          <VStack>
            <Text bold>{item.name}</Text>
            <Text color="gray.500">
              {item.quantity}x {formatCurrency(Number(item.price))}
            </Text>

            <Text
              fontSize="xs"
              color={isMaxQuantityReached ? 'red.500' : 'gray.500'}
            >
              {availableStock > 0
                ? `Disponível: ${availableStock}`
                : 'Sem estoque'}
            </Text>
          </VStack>
        </HStack>

        <VStack alignItems="center">
          <HStack alignItems="center" space={2}>
            <Button
              size="xs"
              variant="outline"
              onPress={() => handleDecrease(item.productId, item.quantity)}
              isDisabled={isUpdating[item.productId]}
            >
              {isUpdating[item.productId] ? <Spinner size="sm" /> : '-'}
            </Button>
            <Text>{item.quantity}</Text>
            <Button
              size="xs"
              variant="outline"
              onPress={() => handleIncrease(item.productId, item.quantity)}
              isDisabled={isUpdating[item.productId] || isMaxQuantityReached}
            >
              {isUpdating[item.productId] ? <Spinner size="sm" /> : '+'}
            </Button>
          </HStack>
          <Button
            mt={2}
            size="xs"
            variant="ghost"
            colorScheme="danger"
            onPress={() => handleRemoveItem(item.productId)}
            leftIcon={<Icon as={AntDesign} name="delete" size="xs" />}
          >
            Remover
          </Button>
        </VStack>
      </HStack>
    )
  }

  return (
    <VStack flex={1}>
      <HomeScreen title="Carrinho" />

      <VStack flex={1} bg="gray.100" p={2} mb={2}>
        {isLoading ? (
          <Spinner mt={10} />
        ) : cartItems.length === 0 ? (
          <Text textAlign="center" mt={10} color="red.500" fontSize={16}>
            Seu carrinho está vazio.
          </Text>
        ) : (
          <>
            <ScrollView flex={1}>
              {orderedCartItems.map(renderCartItem)}
            </ScrollView>

            <Divider my={4} />
            <HStack justifyContent="space-between" alignItems="center" mb={4}>
              <Text fontSize="lg" fontWeight="bold">
                Subtotal:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {formatCurrency(subtotal)}
              </Text>
            </HStack>
            <Button
              colorScheme="green"
              onPress={handleCheckout}
              isLoading={Object.values(isUpdating).some(Boolean)}
              isDisabled={cartItems.length === 0}
            >
              Próximo
            </Button>
          </>
        )}
      </VStack>
    </VStack>
  )
}
