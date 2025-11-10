import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '@services/api'

const CART_STORAGE = '@ICOMPRAS_CART'

export type StorageCartProps = {
  productId: string
  name: string
  quantity: number
  price: number
  image: string
  cashback_percentage: number
  storeId: string
}

export type StorageOrderProps = {
  productId: string
  name: string
  quantity: number
  price: number
  image: string
  cashback_percentage: number
  storeId: string
}

// Função para obter todos os itens do carrinho no AsyncStorage
export async function storageProductGetAll(): Promise<StorageCartProps[]> {
  try {
    const storage = await AsyncStorage.getItem(CART_STORAGE)
    return storage ? JSON.parse(storage) : []
  } catch (error) {
    console.error('Erro ao obter os produtos do carrinho:', error)
    throw error
  }
}

// Função para salvar o carrinho no AsyncStorage
export async function storageProductSave(
  updatedCart: StorageCartProps[],
): Promise<void> {
  try {
    const cart = JSON.stringify(updatedCart)
    await AsyncStorage.setItem(CART_STORAGE, cart)
  } catch (error) {
    console.error('Erro ao salvar o carrinho:', error)
    throw error
  }
}

// Função para atualizar a quantidade de um produto no carrinho
export async function storageProductUpdateQuantity(
  productId: string,
  quantity: number,
): Promise<StorageCartProps[]> {
  try {
    let products = await storageProductGetAll()

    const updatedProducts = products.map((product) =>
      product.productId === productId ? { ...product, quantity } : product,
    )

    await AsyncStorage.setItem(CART_STORAGE, JSON.stringify(updatedProducts))

    // Sincroniza com o backend após atualização
    await syncCartWithBackend(updatedProducts)

    return updatedProducts
  } catch (error) {
    console.error('Erro ao atualizar a quantidade do produto:', error)
    throw error
  }
}

// Função para remover um produto do carrinho
export async function storageProductRemove(
  productId: string,
): Promise<StorageCartProps[]> {
  try {
    const products = await storageProductGetAll()
    const updated = products.filter(
      (product) => product.productId !== productId,
    )

    await storageProductSave(updated)

    // Sincroniza com o backend após remoção
    await syncCartWithBackend(updated)

    return updated
  } catch (error) {
    console.error('Erro ao remover o produto do carrinho:', error)
    throw error
  }
}

// Função para limpar o carrinho
export async function storageProductClear(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CART_STORAGE)

    // Sincroniza a remoção com o backend
    await syncCartWithBackend([])
  } catch (error) {
    console.error('Erro ao limpar o carrinho:', error)
    throw error
  }
}

// Função para sincronizar o carrinho com o backend
export async function syncCartWithBackend(cart: StorageCartProps[]) {
  try {
    const response = await api.post('/cart', cart)

    if (response.status !== 200) {
      throw new Error('Erro ao sincronizar com o backend')
    }

    console.log(
      'Carrinho sincronizado com sucesso com o backend',
      response.data,
    )
    return response.data
  } catch (error) {
    console.error('Erro ao sincronizar o carrinho com o backend:', error)
    throw error
  }
}

// Função para carregar o carrinho do backend (caso não tenha no AsyncStorage)
export async function loadCartFromBackend(): Promise<StorageCartProps[]> {
  try {
    const response = await api.get('/cart')

    if (response.status !== 200) {
      throw new Error('Erro ao carregar o carrinho do backend')
    }

    return response.data
  } catch (error) {
    console.error('Erro ao carregar carrinho do backend:', error)
    throw error
  }
}

// Função híbrida para obter o carrinho (local + backend)
export async function getCart(): Promise<StorageCartProps[]> {
  try {
    // Primeiro, tenta obter o carrinho local
    const localCart = await storageProductGetAll()

    if (localCart.length > 0) {
      // Se o carrinho local existe, retorna ele
      return localCart
    } else {
      // Caso contrário, busca no backend
      const backendCart = await loadCartFromBackend()
      // Salva o carrinho do backend localmente
      await storageProductSave(backendCart)
      return backendCart
    }
  } catch (error) {
    console.error('Erro ao obter o carrinho híbrido:', error)
    throw error
  }
}
