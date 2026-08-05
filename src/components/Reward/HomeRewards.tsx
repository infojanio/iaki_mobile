import {
  Box,
  FlatList,
  HStack,
  Pressable,
  Spinner,
  Text,
  VStack,
} from 'native-base'

import { RewardDTO } from '@dtos/RewardDTO'

import { RewardCard } from './RewardCard'

type Props = {
  rewards: RewardDTO[]
  isLoading?: boolean
  onSeeAll: () => void
  onPressReward: (reward: RewardDTO) => void
}

function isRewardAvailable(reward: RewardDTO) {
  const hasStock = Number(reward.stock ?? 0) > 0

  let isExpired = false

  if (reward.expiresAt) {
    const expirationDate = new Date(reward.expiresAt)

    if (!Number.isNaN(expirationDate.getTime())) {
      isExpired = expirationDate.getTime() <= Date.now()
    }
  }

  return reward.isActive && hasStock && !isExpired
}

export function HomeRewards({
  rewards,
  isLoading = false,
  onSeeAll,
  onPressReward,
}: Props) {
  const availableRewards = rewards.filter(isRewardAvailable).slice(0, 6)

  if (!isLoading && availableRewards.length === 0) {
    return null
  }

  return (
    <VStack mt={5} mb={3}>
      <HStack px={3} mb={3} justifyContent="space-between" alignItems="center">
        <Box flex={1}>
          <Text fontSize="lg" fontWeight="bold" color="coolGray.800">
            🎁 Brindes para você
          </Text>

          <Text mt={1} fontSize="xs" color="coolGray.500">
            Junte pontos e troque por recompensas.
          </Text>
        </Box>

        <Pressable
          onPress={onSeeAll}
          _pressed={{
            opacity: 0.6,
          }}
        >
          <Text color="purple.600" fontSize="sm" fontWeight="bold">
            Ver todos
          </Text>
        </Pressable>
      </HStack>

      {isLoading ? (
        <Box height={260} alignItems="center" justifyContent="center">
          <Spinner size="lg" color="purple.500" />
        </Box>
      ) : (
        <FlatList
          data={availableRewards}
          horizontal
          keyExtractor={(reward) => reward.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 8,
          }}
          ItemSeparatorComponent={() => <Box width={4} />}
          renderItem={({ item }) => (
            <RewardCard reward={item} onPress={() => onPressReward(item)} />
          )}
        />
      )}
    </VStack>
  )
}
