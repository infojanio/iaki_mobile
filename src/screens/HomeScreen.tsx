import React, { useContext, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ProductCard, CashbackProgress, StoreCard } from '../components'
import { CartContext } from '../contexts/CartContext'
import { api } from '../services/api'

interface Product {
  id: string
  name: string
  price: number
  image?: string
  cashbackPercentage: number
}

interface Store {
  id: string
  name: string
  image?: string
}

export const HomeScreen = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [nearbyStores, setNearbyStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const { cart } = useContext(CartContext)
  const navigation = useNavigation()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulando chamadas à API
        const productsResponse = await api.get('/products/featured')
        const storesResponse = await api.get('/stores/nearby')

        setFeaturedProducts(productsResponse.data)
        setNearbyStores(storesResponse.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalCashback = cart.items.reduce(
    (sum, item) =>
      sum +
      (item.product.price * item.quantity * item.product.cashbackPercentage) /
        100,
    0,
  )

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Seção de Cashback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seu Cashback</Text>
          <CashbackProgress
            current={totalCashback}
            goal={100} // Meta de cashback
          />
        </View>

        {/* Lojas próximas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lojas próximas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Stores')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearbyStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onPress={() =>
                  navigation.navigate('StoreProducts', { storeId: store.id })
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Produtos em destaque */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Destaques</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() =>
                  navigation.navigate('ProductDetail', {
                    productId: product.id,
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#6c757d',
    fontSize: 14,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
})
