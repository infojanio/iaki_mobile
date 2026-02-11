import { api } from '@services/api'
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface Product {
  id: string
  name: string
  price: number
  cashbackPercentage: number
  storeId: string
  image?: string
}

interface CartItem {
  product: Product
  quantity: number
}

interface Store {
  id: string
  name: string
}

interface CartContextType {
  items: CartItem[]
  store: Store | null
  subtotal: number
  total: number
  cashback: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setStore: (store: Store) => void
}

const CartContext = createContext<CartContextType>({
  items: [],
  store: null,
  subtotal: 0,
  total: 0,
  cashback: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  setStore: () => {},
})

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [store, setStore] = useState<Store | null>(null)

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const cashback = items.reduce(
    (sum, item) =>
      sum +
      (item.product.price * item.quantity * item.product.cashbackPercentage) /
        100,
    0,
  )

  const total = subtotal

  const addItem = async (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id,
      )

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      } else {
        return [...prevItems, { product, quantity }]
      }
    })

    try {
      await api.post('/cart/items', {
        productId: product.id,
        quantity,
      })
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error)
    }
  }

  const removeItem = async (productId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId),
    )

    try {
      await api.delete(`/cart/items/${productId}`)
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    )

    try {
      await api.post('/cart/items', {
        productId,
        quantity,
      })
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error)
    }
  }

  const clearCart = async () => {
    setItems([])
    setStore(null)

    try {
      await api.delete('/cart/clear')
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error)
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        store,
        subtotal,
        total,
        cashback,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setStore,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
