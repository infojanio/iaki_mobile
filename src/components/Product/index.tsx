import { useContext, useState } from 'react'
import { useNavigation } from '@react-navigation/native'

import { FlatList, VStack, HStack, Text, useToast } from 'native-base'

import { ProductCard } from '@components/Product/ProductCard'

import { CartContext } from '@contexts/CartContext'

import { ProductDTO } from '@dtos/ProductDTO'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

type Props = {
  subcategory: string
  product: ProductDTO[]
  storeId: string
}

export function Product({ product, subcategory, storeId }: Props) {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  function getCartQuantity(productId: string) {
    if (activeStoreId !== storeId) {
      return 0
    }

    return cartItems.find((item) => item.productId === productId)?.quantity ?? 0
  }

  function isProductUpdating(productId: string) {
    return updatingProductIds.includes(productId)
  }

  function setProductUpdating(productId: string, updating: boolean) {
    setUpdatingProductIds((current) => {
      if (updating) {
        if (current.includes(productId)) {
          return current
        }

        return [...current, productId]
      }

      return current.filter((id) => id !== productId)
    })
  }

  async function handleIncrementProduct(currentProduct: ProductDTO) {
    if (isProductUpdating(currentProduct.id)) {
      return
    }

    const stockQuantity = Number(currentProduct.quantity ?? 0)

    const cartQuantity = getCartQuantity(currentProduct.id)

    if (stockQuantity <= 0) {
      toast.show({
        title: 'Produto esgotado',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    if (cartQuantity >= stockQuantity) {
      toast.show({
        title: 'Estoque insuficiente',
        description: 'Quantidade máxima disponível atingida.',
        placement: 'top',
        bgColor: 'orange.500',
      })

      return
    }

    try {
      setProductUpdating(currentProduct.id, true)

      console.log('[Product] Adicionando produto:', {
        productId: currentProduct.id,
        storeId,
        cartQuantity,
        stockQuantity,
      })

      if (cartQuantity === 0) {
        await addProductCart({
          productId: currentProduct.id,
          storeId,
          quantity: 1,
        })
      } else {
        await incrementProduct(currentProduct.id)
      }
    } catch (error: any) {
      console.error(
        '[Product] Erro ao adicionar:',
        error?.response?.status,
        error?.response?.data,
        error?.message,
      )

      toast.show({
        title: 'Erro ao adicionar produto',
        description:
          error?.response?.data?.message ??
          error?.message ??
          'Não foi possível adicionar o produto.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setProductUpdating(currentProduct.id, false)
    }
  }

  async function handleDecrementProduct(currentProduct: ProductDTO) {
    if (isProductUpdating(currentProduct.id)) {
      return
    }

    const cartQuantity = getCartQuantity(currentProduct.id)

    if (cartQuantity <= 0) {
      return
    }

    try {
      setProductUpdating(currentProduct.id, true)

      await decrementProduct(currentProduct.id)
    } catch (error: any) {
      console.error(
        '[Product] Erro ao diminuir:',
        error?.response?.status,
        error?.response?.data,
        error?.message,
      )

      toast.show({
        title: 'Erro ao atualizar produto',
        description:
          error?.response?.data?.message ??
          error?.message ??
          'Não foi possível diminuir a quantidade.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setProductUpdating(currentProduct.id, false)
    }
  }

  return (
    <VStack bg="gray.100">
      <HStack px={3} py={2} alignItems="center" justifyContent="space-between">
        <Text
          fontSize="md"
          fontFamily="heading"
          color="gray.700"
          numberOfLines={1}
          flex={1}
        >
          {subcategory}
        </Text>

        <Text ml={2} fontSize="sm" color="gray.500">
          {product.length} {product.length === 1 ? 'produto' : 'produtos'}
        </Text>
      </HStack>

      <FlatList
        data={product}
        keyExtractor={(item) => item.id}
        extraData={{
          cartItems,
          activeStoreId,
          updatingProductIds,
        }}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            cartQuantity={getCartQuantity(item.id)}
            isUpdating={isProductUpdating(item.id)}
            onIncrement={() => handleIncrementProduct(item)}
            onDecrement={() => handleDecrementProduct(item)}
            onPress={() =>
              navigation.navigate('productDetails', {
                productId: item.id,
              })
            }
          />
        )}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: 8,
        }}
        contentContainerStyle={{
          paddingTop: 4,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      />
    </VStack>
  )
}
