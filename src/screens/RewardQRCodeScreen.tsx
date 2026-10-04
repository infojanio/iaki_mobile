import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

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
          //console.log('Resgate não encontrado.')
          throw new Error('Resgate não encontrado, expirado!')
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
        console.log('[RewardRedemption] Erro:', {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
          /*   status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
          */
        })

        Alert.alert(
          'Atenção',
          error?.response?.data?.message ??
            'Não foi possível carregar o resgate.',
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [redemptionId, storeId, fetchWallet],
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
          backgroundColor: '#DCFCE7',
          borderColor: '#4ADE80',
          textColor: '#15803D',
        }

      case 'CANCELED':
        return {
          title: 'Resgate cancelado',
          description:
            'Esta solicitação foi cancelada. Procure a loja para mais informações.',
          backgroundColor: '#FEE2E2',
          borderColor: '#F87171',
          textColor: '#B91C1C',
        }

      default:
        return {
          title: 'Aguardando confirmação!',
          description: 'Apresente essa tela na loja física.',
          backgroundColor: '#FEF3C7',
          borderColor: '#FBBF24',
          textColor: '#B45309',
        }
    }
  }, [redemption?.status])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />

        <Text style={styles.loadingText}>Carregando resgate...</Text>
      </View>
    )
  }

  if (!redemption) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <ButtonBack />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            Resgate não encontrado, expirou!
          </Text>

          <Text style={styles.emptyDescription}>
            Não foi possível localizar esta solicitação.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => loadRedemption(true)}
          >
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ButtonBack />

        <Text style={styles.headerTitle}>Comprovante do resgate</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRedemption(true)}
          />
        }
      >
        <View style={styles.content}>
          {/* STATUS */}
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: statusInfo.backgroundColor,
                borderColor: statusInfo.borderColor,
              },
            ]}
          >
            <Text style={[styles.statusTitle, { color: statusInfo.textColor }]}>
              {statusInfo.title}
            </Text>

            <Text
              style={[
                styles.statusDescription,
                { color: statusInfo.textColor },
              ]}
            >
              {statusInfo.description}
            </Text>
          </View>

          {/* BRINDE */}
          <View style={styles.rewardCard}>
            <Image
              source={{
                uri: redemption.reward.image ?? DEFAULT_REWARD_IMAGE,
              }}
              style={styles.rewardImage}
              resizeMode="contain"
            />

            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{redemption.reward.title}</Text>

              {redemption.reward.description && (
                <Text style={styles.rewardDescription}>
                  {redemption.reward.description}
                </Text>
              )}
            </View>
          </View>

          {/* CÓDIGO */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>CÓDIGO PARA CONFERÊNCIA</Text>

            <Text style={styles.code}>{shortCode}</Text>

            <Text style={styles.codeDescription}>
              O atendente deve localizar este resgate no painel.
            </Text>
          </View>

          {/* DADOS */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Dados para conferência</Text>

            <DetailRow label="Loja" value={redemption.store.name} />

            <Divider />

            <DetailRow label="Cliente" value={redemption.user.name} />

            <Divider />

            <DetailRow label="CPF" value={maskCpf(redemption.user.cpf)} />

            <Divider />

            <DetailRow label="Brinde" value={redemption.reward.title} />

            <Divider />

            <DetailRow
              label="Pontos utilizados"
              value={`${redemption.points} pontos`}
            />

            <Divider />

            <DetailRow
              label="Solicitado em"
              value={formatDateTime(redemption.createdAt)}
            />

            {redemption.usedAt && (
              <>
                <Divider />

                <DetailRow
                  label="Confirmado em"
                  value={formatDateTime(redemption.usedAt)}
                />
              </>
            )}
          </View>

          {/* ID COMPLETO */}
          <View style={styles.idCard}>
            <Text style={styles.idLabel}>Identificador completo</Text>

            <Text style={styles.idValue} selectable>
              {redemption.id}
            </Text>
          </View>

          {/* ATUALIZAR */}
          {redemption.status === 'PENDING' && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isRefreshing && styles.disabledButton,
              ]}
              activeOpacity={0.8}
              disabled={isRefreshing}
              onPress={() => loadRedemption(true)}
            >
              {isRefreshing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Atualizar status</Text>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.footerText}>
            Aguarde a confirmação antes de deixar o estabelecimento.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

type DetailRowProps = {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function Divider() {
  return <View style={styles.divider} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 48,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  content: {
    gap: 16,
  },

  statusCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  statusDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },

  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  rewardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFFFFF',
  },

  rewardInfo: {
    padding: 16,
  },

  rewardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  rewardDescription: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  codeCard: {
    padding: 20,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    alignItems: 'center',
  },

  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EDE9FE',
    textTransform: 'uppercase',
  },

  code: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#FFFFFF',
  },

  codeDescription: {
    marginTop: 8,
    fontSize: 12,
    color: '#EDE9FE',
    textAlign: 'center',
  },

  detailsCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },

  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },

  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
  },

  divider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: '#E5E7EB',
  },

  idCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  idLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  idValue: {
    marginTop: 4,
    fontSize: 11,
    color: '#374151',
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  disabledButton: {
    opacity: 0.7,
  },

  footerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },

  emptyContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },

  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
})
