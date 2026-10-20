import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TouchableOpacityProps,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

import { StoreDTO } from '@dtos/StoreDTO'
import { RatingStars } from '@components/RatingStars'

type Props = TouchableOpacityProps & {
  store: StoreDTO
  onRate?: () => void
}

export function StoreCard({ store, onRate: _onRate, ...rest }: Props) {
  return (
    <TouchableOpacity {...rest}>
      <View style={styles.card}>
        <View style={styles.content}>
          <Image
            source={{ uri: store.avatar }}
            accessibilityLabel={store.name}
            style={styles.avatar}
            resizeMode="cover"
          />

          <View style={styles.details}>
            <View style={styles.nameRow}>
              <MaterialIcons name="location-on" size={20} color="#DC2626" />

              <Text style={styles.name} numberOfLines={2}>
                {store.name}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              <RatingStars rating={store.rating} count={store.ratingCount} />

              <Text style={styles.ratingLabel}>Avaliações</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    marginLeft: 4,
    fontSize: 16,
    color: '#27272A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingLeft: 16,
  },
  ratingLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#52525B',
  },
})
