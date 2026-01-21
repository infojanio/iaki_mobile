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

async function addToCart(data: AddToCartDTO) {
  return api.post('/cart/items', data)
}

async function incrementItem(data: CartItemActionDTO) {
  return api.patch('/cart/items/increment', data)
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
