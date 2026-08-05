import { Box, HStack, Icon, Image, Pressable, Text, VStack } from 'native-base'

import { Coins, Gift, Store } from 'lucide-react-native'

import { RewardDTO } from '@dtos/RewardDTO'

type Props = {
  reward: RewardDTO
  width?: number | string
  onPress?: () => void
}

function isRewardExpired(expiresAt?: string | null) {
  if (!expiresAt) {
    return false
  }

  const expirationDate = new Date(expiresAt)

  if (Number.isNaN(expirationDate.getTime())) {
    return false
  }

  return expirationDate.getTime() <= Date.now()
}

export function RewardCard({ reward, width = 170, onPress }: Props) {
  const pointsCost = Number(reward.pointsCost ?? 0)

  const stock = Number(reward.stock ?? 0)

  const expired = isRewardExpired(reward.expiresAt)

  const isAvailable = reward.isActive && stock > 0 && !expired

  return (
    <Pressable
      onPress={onPress}
      disabled={!isAvailable}
      _pressed={{
        opacity: 0.75,
      }}
    >
      <Box
        width={width as any}
        minH={258}
        bg="white"
        borderRadius="2xl"
        overflow="hidden"
        shadow={2}
        borderWidth={1}
        borderColor="coolGray.100"
        opacity={isAvailable ? 1 : 0.6}
      >
        <Box
          width="100%"
          height={142}
          bg="coolGray.100"
          alignItems="center"
          justifyContent="center"
        >
          {reward.image ? (
            <Image
              source={{
                uri: reward.image,
              }}
              alt={reward.title}
              width="100%"
              height="100%"
              resizeMode="stretch"
            />
          ) : (
            <Icon as={Gift} size="12" color="purple.400" />
          )}

          <Box
            position="absolute"
            top={2}
            right={2}
            px={2}
            py={1}
            bg="purple.600"
            borderRadius="full"
          >
            <HStack space={1} alignItems="center">
              <Icon as={Coins} size="3" color="yellow.300" />

              <Text color="white" fontSize="xs" fontWeight="bold">
                {pointsCost} pts
              </Text>
            </HStack>
          </Box>

          {!isAvailable && (
            <Box
              position="absolute"
              left={0}
              right={0}
              bottom={0}
              py={2}
              bg="rgba(0, 0, 0, 0.65)"
              alignItems="center"
            >
              <Text color="white" fontSize="xs" fontWeight="bold">
                {expired ? 'EXPIRADO' : 'INDISPONÍVEL'}
              </Text>
            </Box>
          )}
        </Box>

        <VStack flex={1} p={3} space={2}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="coolGray.800"
            numberOfLines={2}
          >
            {reward.title}
          </Text>

          {reward.store?.name && (
            <HStack space={1} alignItems="center">
              <Icon as={Store} size="3" color="coolGray.500" />

              <Text
                flex={1}
                fontSize="xs"
                color="coolGray.500"
                numberOfLines={1}
              >
                {reward.store.name}
              </Text>
            </HStack>
          )}

          <HStack mt="auto" justifyContent="space-between" alignItems="center">
            <Text
              fontSize="xs"
              color={stock > 3 ? 'green.600' : 'orange.600'}
              fontWeight="medium"
            >
              {stock > 0 ? `${stock} disponíveis` : 'Sem estoque'}
            </Text>

            {isAvailable && (
              <Text fontSize="xs" color="purple.600" fontWeight="bold">
                Trocar
              </Text>
            )}
          </HStack>
        </VStack>
      </Box>
    </Pressable>
  )
}
