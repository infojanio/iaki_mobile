import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  Center,
  Divider,
  HStack,
  Image,
  ScrollView,
  Spinner,
  Text,
  VStack,
  useToast,
} from 'native-base'

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'

import { api } from '@services/api'

import { ButtonBack } from '@components/ButtonBack'

import { useStorePoints } from '@contexts/StorePointsContext'

type RedemptionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED'

type RedemptionDetails = {
  id: string
  rewardId: string
  userId: string
  storeId: string

  points: number
  status: RedemptionStatus

  createdAt: string
  usedAt: string | null

  reward: {
    id: string
    title: string
    description: string | null
    image: string | null
    pointsCost: number
  }

  store: {
    id: string
    name: string
    avatar: string | null
  }

  user: {
    id: string
    name: string
    cpf: string | null
    phone?: string | null
  }
}

type RouteParams = {
  redemptionId: string
  storeId: string
}

const DEFAULT_REWARD_IMAGE =
  'https://via.placeholder.com/500x350.png?text=Brinde'

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Não informado'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data inválida'
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function maskCpf(cpf?: string | null) {
  if (!cpf) {
    return 'Não informado'
  }

  const numbers = cpf.replace(/\D/g, '')

  if (numbers.length !== 11) {
    return cpf
  }

  return `***.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-**`
}

function normalizeStatus(status?: string): RedemptionStatus {
  const normalized = String(status ?? '')
    .trim()
    .toUpperCase()

  if (normalized === 'CONFIRMED') {
    return 'CONFIRMED'
  }

  if (normalized === 'CANCELED') {
    return 'CANCELED'
  }

  return 'PENDING'
}

export function RewardQRCodeScreen() {
  const route = useRoute<any>()

  const navigation = useNavigation<any>()

  const toast = useToast()

  const { redemptionId, storeId } = route.params as RouteParams

  const { fetchWallet } = useStorePoints()

  const [redemption, setRedemption] = useState<RedemptionDetails | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadRedemption = useCallback(
    async (refreshing = false) => {
      try {
        if (refreshing) {
          setIsRefreshing(true)
        }

        const response = await api.get(
          `/stores/rewards/redemptions/${redemptionId}`,
        )

        const data =
          response.data?.redemption ?? response.data?.data ?? response.data

        if (!data?.id) {
          throw new Error('Resgate não encontrado.')
        }

        const normalized: RedemptionDetails = {
          ...data,

          points: Number(data.points ?? 0),

          status: normalizeStatus(data.status),

          usedAt: data.usedAt ?? null,

          reward: {
            id: data.reward?.id ?? data.rewardId,

            title: data.reward?.title ?? 'Brinde',

            description: data.reward?.description ?? null,

            image: data.reward?.image ?? null,

            pointsCost: Number(data.reward?.pointsCost ?? data.points ?? 0),
          },

          store: {
            id: data.store?.id ?? data.storeId,

            name: data.store?.name ?? 'Loja',

            avatar: data.store?.avatar ?? null,
          },

          user: {
            id: data.user?.id ?? data.userId,

            name: data.user?.name ?? 'Cliente',

            cpf: data.user?.cpf ?? null,

            phone: data.user?.phone ?? null,
          },
        }

        setRedemption(normalized)

        if (normalized.status === 'CONFIRMED') {
          await fetchWallet(storeId)
        }
      } catch (error: any) {
        console.error('[RewardRedemption] Erro:', {
          status: error?.response?.status,

          data: error?.response?.data,

          message: error?.message,
        })

        toast.show({
          title:
            error?.response?.data?.message ??
            'Não foi possível carregar o resgate.',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [redemptionId, storeId, fetchWallet, toast],
  )

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true)

      loadRedemption()
    }, [loadRedemption]),
  )

  /*
   * Enquanto estiver pendente, consulta
   * novamente a cada 8 segundos.
   */
  useEffect(() => {
    if (redemption?.status !== 'PENDING') {
      return
    }

    const interval = setInterval(() => {
      loadRedemption()
    }, 8000)

    return () => clearInterval(interval)
  }, [redemption?.status, loadRedemption])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      fetchWallet(storeId)
    })

    return unsubscribe
  }, [navigation, storeId, fetchWallet])

  /*
   * Código visual derivado do UUID.
   * O backend continua usando o ID completo.
   */
  const shortCode = useMemo(() => {
    if (!redemption?.id) {
      return ''
    }

    return redemption.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  }, [redemption?.id])

  const statusInfo = useMemo(() => {
    switch (redemption?.status) {
      case 'CONFIRMED':
        return {
          title: 'Resgate confirmado',
          description:
            'O administrador aprovou o resgate. O brinde já pode ser entregue.',
          bg: 'green.100',
          border: 'green.400',
          color: 'green.700',
        }

      case 'CANCELED':
        return {
          title: 'Resgate cancelado',
          description:
            'Esta solicitação foi cancelada. Procure a loja para mais informações.',
          bg: 'red.100',
          border: 'red.400',
          color: 'red.700',
        }

      default:
        return {
          title: 'Aguardando confirmação!',
          description: 'Apresente essa tela na loja física.',
          bg: 'amber.100',
          border: 'amber.400',
          color: 'amber.700',
        }
    }
  }, [redemption?.status])

  if (isLoading) {
    return (
      <Center flex={1} bg="coolGray.50">
        <Spinner size="lg" color="purple.600" />

        <Text mt={3} color="coolGray.500">
          Carregando resgate...
        </Text>
      </Center>
    )
  }

  if (!redemption) {
    return (
      <VStack flex={1} bg="coolGray.50">
        <HStack px={4} pt={12}>
          <ButtonBack />
        </HStack>

        <Center flex={1} px={6}>
          <Text fontSize="lg" fontWeight="bold" color="coolGray.700">
            Resgate não encontrado
          </Text>

          <Text mt={2} textAlign="center" color="coolGray.500">
            Não foi possível localizar esta solicitação.
          </Text>

          <Button mt={6} bg="purple.600" onPress={() => loadRedemption(true)}>
            Tentar novamente
          </Button>
        </Center>
      </VStack>
    )
  }

  return (
    <VStack flex={1} bg="coolGray.50">
      <HStack
        px={4}
        pt={12}
        pb={3}
        alignItems="center"
        bg="white"
        borderBottomWidth={1}
        borderBottomColor="coolGray.200"
      >
        <ButtonBack />

        <Text ml={4} fontSize="lg" fontWeight="bold" color="coolGray.800">
          Comprovante do resgate
        </Text>
      </HStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
      >
        <VStack space={4}>
          <Box
            p={4}
            bg={statusInfo.bg}
            borderWidth={1}
            borderColor={statusInfo.border}
            borderRadius="2xl"
          >
            <Text fontSize="md" fontWeight="bold" color={statusInfo.color}>
              {statusInfo.title}
            </Text>

            <Text mt={1} fontSize="sm" color={statusInfo.color}>
              {statusInfo.description}
            </Text>
          </Box>

          <Box
            bg="white"
            borderRadius="2xl"
            overflow="hidden"
            shadow={1}
            borderWidth={1}
            borderColor="coolGray.200"
          >
            <Image
              source={{
                uri: redemption.reward.image ?? DEFAULT_REWARD_IMAGE,
              }}
              alt={redemption.reward.title}
              width="100%"
              height={180}
              resizeMode="contain"
            />

            <VStack p={4} space={2}>
              <Text fontSize="xl" fontWeight="bold" color="coolGray.800">
                {redemption.reward.title}
              </Text>

              {redemption.reward.description && (
                <Text fontSize="sm" color="coolGray.500">
                  {redemption.reward.description}
                </Text>
              )}
            </VStack>
          </Box>

          <Box p={5} bg="purple.600" borderRadius="2xl" alignItems="center">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="purple.100"
              textTransform="uppercase"
            >
              Código para conferência
            </Text>

            <Text
              mt={2}
              fontSize="3xl"
              fontWeight="bold"
              letterSpacing={3}
              color="white"
              selectable
            >
              {shortCode}
            </Text>

            <Text mt={2} fontSize="xs" color="purple.100" textAlign="center">
              O atendente deve localizar este resgate no painel.
            </Text>
          </Box>

          <Box
            p={4}
            bg="white"
            borderRadius="2xl"
            borderWidth={1}
            borderColor="coolGray.200"
            shadow={1}
          >
            <Text mb={3} fontSize="md" fontWeight="bold" color="coolGray.800">
              Dados para conferência
            </Text>

            <DetailRow label="Loja" value={redemption.store.name} />

            <Divider my={3} />

            <DetailRow label="Cliente" value={redemption.user.name} />

            <Divider my={3} />

            <DetailRow label="CPF" value={maskCpf(redemption.user.cpf)} />

            <Divider my={3} />

            <DetailRow label="Brinde" value={redemption.reward.title} />

            <Divider my={3} />

            <DetailRow
              label="Pontos utilizados"
              value={`${redemption.points} pontos`}
            />

            <Divider my={3} />

            <DetailRow
              label="Solicitado em"
              value={formatDateTime(redemption.createdAt)}
            />

            {redemption.usedAt && (
              <>
                <Divider my={3} />

                <DetailRow
                  label="Confirmado em"
                  value={formatDateTime(redemption.usedAt)}
                />
              </>
            )}
          </Box>

          <Box
            p={4}
            bg="white"
            borderRadius="2xl"
            borderWidth={1}
            borderColor="coolGray.200"
          >
            <Text fontSize="xs" color="coolGray.500">
              Identificador completo
            </Text>

            <Text mt={1} fontSize="xs" color="coolGray.700" selectable>
              {redemption.id}
            </Text>
          </Box>

          {redemption.status === 'PENDING' && (
            <Button
              bg="purple.600"
              isLoading={isRefreshing}
              isLoadingText="Atualizando"
              onPress={() => loadRedemption(true)}
            >
              Atualizar status
            </Button>
          )}

          <Text px={4} fontSize="xs" color="coolGray.500" textAlign="center">
            Aguarde a confirmação antes de deixar o estabelecimento.
          </Text>
        </VStack>
      </ScrollView>
    </VStack>
  )
}

type DetailRowProps = {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <HStack justifyContent="space-between" alignItems="flex-start" space={4}>
      <Text flex={1} fontSize="sm" color="coolGray.500">
        {label}
      </Text>

      <Text
        flex={1}
        fontSize="sm"
        fontWeight="medium"
        color="coolGray.800"
        textAlign="right"
      >
        {value}
      </Text>
    </HStack>
  )
}
