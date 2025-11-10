import { createContext, ReactNode, useEffect, useState } from 'react'
import { cartService } from '@services/cartService'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'

type CartItem = {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  cashback_percentage: number
  storeId: string
}

type StockInfo = {
  totalStock: number
  reservedInCart: number
  availableToAdd: number // Novo campo
}

type CartContextData = {
  cartItems: CartItem[]
  stockInfo: Record<string, StockInfo>
  addProductCart: (
    item: Omit<CartItem, 'quantity'> & { quantity?: number },
    availableStock?: number,
  ) => Promise<void>
  removeProductCart: (productId: string) => Promise<void>
  updateProductQuantity: (
    productId: string,
    quantity: number,
    availableStock?: number,
  ) => Promise<void>
  clearCart: () => Promise<void>
  fetchCart: () => Promise<void>
  fetchProductStock: (productId: string) => Promise<number>
  getAvailableStock: (productId: string) => number
  getStockCalculation: (
    productId: string,
  ) => { total: number; inCart: number; available: number } // Nova função
}

export const CartContext = createContext({} as CartContextData)

type CartProviderProps = {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [stockInfo, setStockInfo] = useState<Record<string, StockInfo>>({})

  const { userId } = useAuth()

  // Carrega o carrinho e estoque inicial
  async function fetchCart() {
    try {
      const backendCart = await cartService.getCartFromBackend()

      const formattedCart = backendCart.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        cashback_percentage: item.cashback_percentage ?? 0,
        storeId: item.storeId ?? '',
      }))

      setCartItems(formattedCart)

      // Carrega o estoque para todos os itens do carrinho
      await loadStockInfo(formattedCart)
    } catch (error) {
      //     console.error('Erro ao carregar o carrinho:', error)
      console.log('Erro ao carregar o carrinho:', error)
      setCartItems([])
    }
  }

  // Carrega informações de estoque para os produtos
  async function loadStockInfo(items: CartItem[]) {
    const newStockInfo: Record<string, StockInfo> = {}

    await Promise.all(
      items.map(async (item) => {
        try {
          const stock = await fetchProductStock(item.productId)
          newStockInfo[item.productId] = {
            totalStock: stock,
            reservedInCart: item.quantity,
            availableToAdd: Math.max(stock - item.quantity, 0), // Cálculo aqui
          }
        } catch (error) {
          console.error(
            `Erro ao carregar estoque do produto ${item.productId}:`,
            error,
          )
          newStockInfo[item.productId] = {
            totalStock: 0,
            reservedInCart: item.quantity,
            availableToAdd: 0,
          }
        }
      }),
    )

    setStockInfo(newStockInfo)
  }
  // Busca o estoque de um produto específico
  async function fetchProductStock(productId: string): Promise<number> {
    try {
      const response = await api.get(`/products/${productId}/stock`)
      return response.data?.data?.stock ?? response.data?.stock ?? 0
    } catch (error) {
      console.error(`Erro ao buscar estoque do produto ${productId}:`, error)
      return 0
    }
  }

  function getStockCalculation(productId: string) {
    const info = stockInfo[productId]
    if (!info) return { total: 0, inCart: 0, available: 0 }

    return {
      total: info.totalStock,
      inCart: info.reservedInCart,
      available: info.availableToAdd,
    }
  }

  // Calcula o estoque disponível
  function getAvailableStock(productId: string): number {
    const info = stockInfo[productId]
    if (!info) return 0
    return info.availableToAdd // Agora retornamos o valor pré-calculado
  }
  // Adiciona produto ao carrinho com verificação de estoque
  async function addProductCart(
    item: Omit<CartItem, 'quantity'> & { quantity?: number },
    availableStock?: number,
  ) {
    try {
      const quantity = item.quantity ?? 1

      // Verifica estoque se disponível
      if (availableStock !== undefined && quantity > availableStock) {
        throw new Error('Estoque insuficiente')
      }

      await cartService.addToCart(item.productId, quantity)

      // Atualiza o carrinho e estoque
      await fetchCart()
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error)
      throw error // Rejeita a promise para tratamento no componente
    }
  }

  // Remove produto do carrinho
  async function removeProductCart(productId: string) {
    try {
      await cartService.removeFromCart(productId)

      // Atualiza o carrinho e remove do controle de estoque
      setStockInfo((prev) => {
        const { [productId]: _, ...rest } = prev
        return rest
      })
      await fetchCart()
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error)
      throw error
    }
  }

  // Atualiza quantidade com verificação de estoque
  async function updateProductQuantity(
    productId: string,
    quantity: number,
    availableStock?: number,
  ) {
    try {
      if (availableStock !== undefined) {
        const currentItem = cartItems.find(
          (item) => item.productId === productId,
        )
        const quantityDifference = quantity - (currentItem?.quantity ?? 0)

        if (quantityDifference > availableStock) {
          throw new Error('Estoque insuficiente')
        }
      }

      await cartService.updateCartItem(productId, quantity)

      // Atualiza o estoque reservado E o disponível
      setStockInfo((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          reservedInCart: quantity,
          availableToAdd: Math.max(
            (prev[productId]?.totalStock || 0) - quantity,
            0,
          ),
        },
      }))

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      )
    } catch (error) {
      console.error('Erro ao atualizar quantidade do item:', error)
      throw error
    }
  }
  // Limpa o carrinho completamente
  async function clearCart() {
    try {
      await cartService.clearCart()
      setCartItems([])
      setStockInfo({})
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error)
      throw error
    }
  }

  // Efeito para carregar o carrinho inicial
  useEffect(() => {
    if (userId) {
      fetchCart()
    }
  }, [userId])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        stockInfo,
        addProductCart,
        removeProductCart,
        updateProductQuantity,
        clearCart,
        fetchCart,
        fetchProductStock,
        getAvailableStock,
        getStockCalculation, // Adicionado aqui
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
