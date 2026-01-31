import { FlatList, VStack, Text, useToast } from 'native-base'
import { useContext } from 'react'

import { CartContext } from '@contexts/CartContext'
import { ItemCartCard } from '@components/Cart/ItemCartCard'

export function ItemsCart() {
  const { cartItems, removeProductCart, incrementProduct, decrementProduct } =
    useContext(CartContext)

  const toast = useToast()

  async function handleRemove(productId: string) {
    try {
      await removeProductCart(productId)
      toast.show({
        title: 'Produto removido',
        placement: 'top',
        bgColor: 'green.500',
      })
    } catch {
      toast.show({
        title: 'Erro ao remover produto',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  return (
    <VStack flex={1}>
      <Text fontSize="15" fontWeight="bold" mb={2}>
        Produtos ({cartItems.length})
      </Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => {
          const isMaxReached = item.quantity >= item.stock

          return (
            <ItemCartCard
              data={item}
              isMaxReached={isMaxReached} // 🔥 NOVO
              onIncrement={() => {
                if (isMaxReached) {
                  toast.show({
                    title: 'Estoque insuficiente',
                    description: 'Quantidade máxima disponível atingida',
                    placement: 'top',
                    bgColor: 'orange.500',
                  })
                  return
                }

                incrementProduct(item.productId)
              }}
              onDecrement={() => decrementProduct(item.productId)}
              onRemove={() => handleRemove(item.productId)}
            />
          )
        }}
        showsVerticalScrollIndicator={false}
      />
    </VStack>
  )
}
