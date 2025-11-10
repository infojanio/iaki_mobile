import React, { useRef } from 'react'
import { View, Text, Image, Dimensions, StyleSheet } from 'react-native'
import Carousel from 'react-native-snap-carousel'

interface Promotion {
  id: string
  description: string
  price: number
  images: string[]
}

interface PromotionsCarouselProps {
  promotions: Promotion[]
}

const { width: screenWidth } = Dimensions.get('window')

const PromotionsCarousel: React.FC<PromotionsCarouselProps> = ({
  promotions,
}) => {
  const carouselRef = useRef(null)

  const renderItem = ({ item }: { item: Promotion }) => (
    <View style={styles.card}>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.price}>R$ {item.price.toFixed(2)}</Text>
      <View style={styles.imagesContainer}>
        {item.images.slice(0, 3).map((image, index) => (
          <Image key={index} source={{ uri: image }} style={styles.image} />
        ))}
      </View>
    </View>
  )

  return (
    <Carousel
      ref={carouselRef}
      data={promotions}
      renderItem={renderItem}
      sliderWidth={screenWidth}
      itemWidth={screenWidth * 0.8}
      loop={true}
      autoplay={true}
      autoplayInterval={3000}
    />
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
  },
  description: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    color: '#E91E63',
    marginBottom: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  image: {
    width: 80,
    height: 80,
    marginHorizontal: 5,
    borderRadius: 5,
  },
})

export default PromotionsCarousel
