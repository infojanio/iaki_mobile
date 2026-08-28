import { useRoute, useNavigation } from '@react-navigation/native'
import { TextInput } from 'react-native'
import { FlatList } from 'react-native'
import {
  Box,
  VStack,
  Text,
  HStack,
  IconButton,
  Button,
  useTheme,
} from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { HomeScreen } from '@components/HomeScreen'

type RouteParams = {
  storeId: string
  storeName: string
}

type Rating = {
  id: string
  user: string
  rating: number
  comment?: string
  createdAt: string
}

export function StoreRatings() {
  const route = useRoute()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { storeName } = route.params as RouteParams
  const { colors } = useTheme()

  const [text, setText] = useState<string>()

  /* 🔥 MOCK (depois vem do backend) */
  const [ratings] = useState<Rating[]>([
    {
      id: '1',
      user: 'Maria S.',
      rating: 5,
      comment: 'Entrega rápida e ótimo atendimento!',
      createdAt: '2024-03-10',
    },
    {
      id: '2',
      user: 'João P.',
      rating: 4,
      comment: 'Preço bom, recomendo.',
      createdAt: '2024-03-08',
    },
  ])

  const [myRating, setMyRating] = useState(0)
  const [comment, setComment] = useState('')

  function renderStars(value: number, onSelect?: (v: number) => void) {
    return (
      <HStack space={1}>
        {[1, 2, 3, 4, 5].map((i) => (
          <IconButton
            key={i}
            icon={
              <MaterialIcons
                name={i <= value ? 'star' : 'star-border'}
                size={22}
                color="#FBBF24"
              />
            }
            onPress={() => onSelect?.(i)}
            variant="ghost"
          />
        ))}
      </HStack>
    )
  }

  return (
    <VStack flex={1} bg="gray.100">
      <HomeScreen title={`   ${storeName}`} />

      <FlatList
        data={ratings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <Box mb={4} bg="white" p={4} borderRadius="xl">
            <Text fontWeight="bold" fontSize="md" mb={2}>
              Quantas estrelas mereço?
            </Text>

            {renderStars(myRating, setMyRating)}

            <Box>
              <Text mb={1} fontSize="sm" color="gray.600">
                Comentário
              </Text>

              <TextInput
                placeholder="Escreva sua avaliação..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top" // 🔥 ESSENCIAL no Android
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 120,
                  fontSize: 16,
                  color: '#111827',
                  backgroundColor: '#FFFFFF',
                }}
                value={comment}
                onChangeText={setComment}
              />
            </Box>

            <Button
              mt={3}
              colorScheme="green"
              isDisabled={myRating === 0}
              onPress={() => {
                // 🔜 backend depois
                console.log('Enviar avaliação', {
                  rating: myRating,
                  comment,
                })
              }}
            >
              Enviar avaliação
            </Button>
          </Box>
        }
        renderItem={({ item }) => (
          <Box bg="white" p={4} mb={3} borderRadius="xl">
            <HStack justifyContent="space-between" mb={1}>
              <Text fontWeight="bold">{item.user}</Text>
              <Text fontSize="xs" color="gray.500">
                {item.createdAt}
              </Text>
            </HStack>

            {renderStars(item.rating)}

            {!!item.comment && (
              <Text mt={2} color="gray.700">
                {item.comment}
              </Text>
            )}
          </Box>
        )}
      />
    </VStack>
  )
}
