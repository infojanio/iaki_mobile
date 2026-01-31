import { api } from '@services/api'

type CartItemActionDTO = {
  storeId: string
  productId: string
}

export type AddToCartDTO = {
  storeId: string
  productId: string
  quantity: number
}

async function getCartFromBackend(storeId: string) {
  const response = await api.get(`/cart/store/${storeId}`)
  return response.data
}

function handleCartError(error: any) {
  if (error?.response?.status === 409) {
    throw {
      type: 'INSUFFICIENT_STOCK',
      message:
        error.response.data?.message ??
        'Estoque insuficiente para este produto',
    }
  }

  throw error
}

async function addToCart(data: AddToCartDTO) {
  try {
    return await api.post('/cart/items', data)
  } catch (error: any) {
    handleCartError(error)
  }
}

async function incrementItem(data: CartItemActionDTO) {
  try {
    return await api.patch('/cart/items/increment', data)
  } catch (error: any) {
    handleCartError(error)
  }
}
export async function getOpenCart() {
  const response = await api.get('/cart/open')
  return response.data
}

async function decrementItem(data: CartItemActionDTO) {
  return api.patch('/cart/items/decrement', data)
}

async function removeFromCart(storeId: string, productId: string) {
  return api.delete(`/cart/items/${productId}`, {
    data: { storeId },
  })
}

async function checkoutCart(storeId: string) {
  return api.post('/cart/checkout', { storeId })
}

export const cartService = {
  getCartFromBackend,
  addToCart,
  getOpenCart,
  incrementItem,
  decrementItem,
  removeFromCart,
  checkoutCart,
}
