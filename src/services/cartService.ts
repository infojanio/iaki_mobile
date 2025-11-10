// src/services/cartService.ts
import { api } from '@services/api'

export type CartItemRequest = {
  productId: string
  quantity: number
}

export type CartItemResponse = {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  cashback_percentage: number
  storeId: string
}

export type CartResponse = {
  items: CartItemResponse[]
  total: number
  cashbackTotal: number
}

// Busca o carrinho completo do usuário
// src/services/cartService.ts
async function getCartFromBackend(): Promise<CartResponse> {
  try {
    const response = await api.get('/cart')
    console.log('Resposta do backend:', response.data) // Log da resposta crua

    const rawItems = response.data.cartItems

    const items: CartItemResponse[] = rawItems.map((item: any) => {
      console.log('Item processado:', item) // Verificando cada item
      const product = item.product
      return {
        productId: item.productId,
        name: product?.name || 'Produto desconhecido',
        image: product?.image || '',
        price: product?.price || 0,
        quantity: item.quantity,
        cashback_percentage: product?.cashback_percentage || 0,
        storeId: product.storeId || '15c26392-6a84-425c-b0ad-951463e27e67', // Aqui, o storeId é atribuído
      }
    })

    const total = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    )
    const cashbackTotal = items.reduce(
      (acc, item) =>
        acc + (item.price * item.quantity * item.cashback_percentage) / 100,
      0,
    )

    console.log('Carrinho processado:', { items, total, cashbackTotal })

    return { items, total, cashbackTotal }
  } catch (error) {
    // console.error('Erro ao buscar carrinho do backend:', error)
    console.log('Carrinho não carregado:', error)
    throw error
  }
}

// Adiciona um item ao carrinho
async function addToCart(
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  try {
    const response = await api.post('/cart/items', { productId, quantity })
    return response.data
  } catch (error) {
    console.error('Erro ao adicionar item ao carrinho:', error)
    throw error
  }
}

// Atualiza a quantidade de um item no carrinho
async function updateCartItem(
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  try {
    const response = await api.patch('/cart/items/quantity', {
      productId,
      quantity,
    })
    return response.data
  } catch (error) {
    console.error('Erro ao atualizar item no carrinho:', error)
    throw error
  }
}

// Remove um item do carrinho
async function removeFromCart(productId: string): Promise<CartResponse> {
  try {
    const response = await api.delete(`/cart/items/${productId}`)
    return response.data
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error)
    throw error
  }
}

// Limpa todos os itens do carrinho
async function clearCart(): Promise<{ message: string }> {
  try {
    const response = await api.delete('/cart/clear')
    return response.data
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error)
    throw error
  }
}

// Finaliza o pedido (checkout)
async function checkoutCart(): Promise<{ success: boolean; orderId: string }> {
  try {
    const response = await api.post('/orders')
    return response.data
  } catch (error) {
    console.error('Erro ao finalizar o pedido:', error)
    throw error
  }
}

export const cartService = {
  getCartFromBackend,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkoutCart,
}
