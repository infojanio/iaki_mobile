import { useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { LayoutAnimation, UIManager, Platform } from 'react-native'
import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  Spinner,
  Pressable,
  Badge,
  Divider,
  Button,
} from 'native-base'
import { HomeScreen } from '@components/HomeScreen'
import { UserPhoto } from '@components/HomeHeader/UserPhoto'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { BackHome } from '@components/BackHome'

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export function ProfileWallet() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { user } = useAuth()

  const [stores, setStores] = useState<any[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userView, setUserView] = useState<any>(null)

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/profile')
      setUserView(data?.user ?? null)
    } catch {}
  }, [])

  const fetchStoresWithPoints = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me/stores-with-points')
      setStores(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadWallet = async (storeId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

    if (selectedStoreId === storeId) {
      setSelectedStoreId(null)
      setWallet(null)
      return
    }

    try {
      setIsLoading(true)
      const { data } = await api.get(`/stores/${storeId}/points/me`)
      setWallet(data)
      setSelectedStoreId(storeId)
    } finally {
      setIsLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile()
      fetchStoresWithPoints()
    }, []),
  )

  if (isLoading && !wallet) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="primary.500" />
      </Box>
    )
  }

  const displayName = userView?.name ?? user?.name ?? 'Usuário'
  const displayEmail = userView?.email ?? user?.email ?? ''
  const displayAvatar = userView?.avatar ?? user?.avatar

  return (
    <Box flex={1} bg="gray.50">
      <BackHome title="Minha Carteira" />

      <ScrollView px={4} pb={10}>
        {/* Header */}
        <Pressable onPress={() => navigation.navigate('profileEdit')}>
          <HStack
            bg="white"
            p={4}
            rounded="2xl"
            mb={4}
            shadow={2}
            alignItems="center"
          >
            <UserPhoto
              source={displayAvatar ? { uri: displayAvatar } : undefined}
              alt="Foto"
              size={12}
              mr={3}
            />

            <VStack flex={1}>
              <Text fontSize="lg" fontWeight="bold">
                {displayName}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {displayEmail}
              </Text>
            </VStack>
          </HStack>
        </Pressable>

        <Text fontSize="lg" fontWeight="bold" mb={3}>
          Minhas Lojas
        </Text>

        {stores.length === 0 ? (
          <Text>Você ainda não possui pontos em nenhuma loja.</Text>
        ) : (
          stores.map((store) => {
            const isOpen = selectedStoreId === store.storeId

            return (
              <Box key={store.storeId} mb={4}>
                {/* CARD DA LOJA */}
                <Pressable onPress={() => loadWallet(store.storeId)}>
                  <HStack
                    bg="white"
                    p={4}
                    rounded="2xl"
                    shadow={2}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text fontWeight="bold">{store.storeName}</Text>

                    <Badge colorScheme="primary" rounded="full" px={3}>
                      {store.balance} pts
                    </Badge>
                  </HStack>
                </Pressable>

                {/* EXPANSÃO */}
                {isOpen && wallet && (
                  <VStack mt={4} space={4}>
                    {/* Carteira */}
                    <Box bg="primary.600" p={6} rounded="3xl">
                      <Text color="white" mb={2}>
                        🪙 Pontos na loja
                      </Text>

                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {wallet.balance}
                      </Text>

                      <HStack justifyContent="space-between" mt={4}>
                        <VStack>
                          <Text color="white" fontSize="xs">
                            Acumulado
                          </Text>
                          <Text color="green.200" fontWeight="bold">
                            {wallet.earned}
                          </Text>
                        </VStack>

                        <VStack>
                          <Text color="white" fontSize="xs">
                            Utilizado
                          </Text>
                          <Text color="red.200" fontWeight="bold">
                            {wallet.spent}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* 🎁 BOTÃO BRINDES ACIMA DO EXTRATO */}
                    <Button
                      colorScheme="primary"
                      rounded="xl"
                      onPress={() =>
                        navigation.navigate('storeRewardCatalog', {
                          storeId: store.storeId as string,
                        })
                      }
                    >
                      🎁 Ver Brindes da Loja
                    </Button>

                    {/* Extrato */}
                    <Box bg="white" p={5} rounded="2xl" shadow={2}>
                      <Text fontSize="md" fontWeight="bold" mb={3}>
                        Histórico de Pontos
                      </Text>

                      {!wallet.transactions?.length ? (
                        <Text color="gray.500">
                          Nenhuma movimentação encontrada.
                        </Text>
                      ) : (
                        wallet.transactions.map((item: any) => (
                          <VStack key={item.id} mb={3}>
                            <HStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text fontSize="xs" color="gray.500">
                                {item.type === 'EARN' ? 'Ganho' : 'Resgate'} •{' '}
                                {new Date(item.createdAt).toLocaleDateString(
                                  'pt-BR',
                                )}
                              </Text>

                              <Text
                                fontWeight="bold"
                                color={
                                  item.type === 'EARN' ? 'green.500' : 'red.500'
                                }
                              >
                                {item.type === 'EARN' ? '+' : '-'} {item.points}
                              </Text>
                            </HStack>
                            <Divider mt={2} />
                          </VStack>
                        ))
                      )}
                    </Box>
                  </VStack>
                )}
              </Box>
            )
          })
        )}
      </ScrollView>
    </Box>
  )
}
