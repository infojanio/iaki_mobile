import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'

import { api } from '@services/api' // ajuste para o caminho correto do seu axios config
import AsyncStorage from '@react-native-async-storage/async-storage'

interface CartItem {
  id: string
  quantity: number
  subtotal: string
  product: {
    id: string
    name: string
    price: string
    image: string
    cashbackPercentage: number
  }
}

interface CartData {
  id: string
  store: { id: string; name: string }
  totalAmount: string
  orderItems: CartItem[]
}

export function CartScreen() {
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCart() {
      setLoading(true)
      try {
        const token = await AsyncStorage.getItem('token')
        const response = await api.get<CartData>('/cart', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setCart(response.data)
      } catch (error) {
        console.error('Erro ao buscar carrinho:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  if (!cart) {
    return (
      <View style={styles.center}>
        <Text>Nenhum item no carrinho.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrinho da loja {cart.store.name}</Text>

      <FlatList
        data={cart.orderItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {item.product.image && (
              <Image
                source={{ uri: item.product.image }}
                style={styles.image}
              />
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text>Qtd: {item.quantity}</Text>
              <Text>Subtotal: R$ {item.subtotal}</Text>
              <Text>Cashback: {item.product.cashbackPercentage}%</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.total}>Total: R$ {cart.totalAmount}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  item: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  image: { width: 80, height: 80, marginRight: 10, borderRadius: 8 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 12,
    marginTop: 12,
  },
  total: { fontSize: 18, fontWeight: 'bold' },
})
