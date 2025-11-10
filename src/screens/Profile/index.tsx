import { useEffect, useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { userService } from '@services/userService'
import { orderService } from '@services/orderService'
import { HomeScreen } from '@components/HomeScreen'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { UserPhoto } from '@components/HomeHeader/UserPhoto'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api' // << vamos usar para buscar o perfil

export function Profile() {
  const [balance, setBalance] = useState(0)
  const [pendingCashback, setPendingCashback] = useState(0)
  const [totalReceived, setTotalReceived] = useState(0)
  const [totalUsed, setTotalUsed] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Novo: estado local com os dados mais recentes do usuário
  const [userView, setUserView] = useState<any>(null)

  const [statement, setStatement] = useState<
    Array<{
      id: string
      type: 'RECEIVE' | 'USE'
      amount: number
      created_at: string
    }>
  >([])

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { user } = useAuth()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [balanceData, pending, cashbackStatement] = await Promise.all([
        userService.getUserCashbackBalance(),
        orderService.getPendingCashback(),
        userService.getUserCashbackStatement(),
      ])
      setBalance(balanceData.balance)
      setTotalReceived(balanceData.totalReceived)
      setTotalUsed(balanceData.totalUsed)
      setPendingCashback(pending)
      setStatement(cashbackStatement)
    } catch (error) {
      console.log('Erro ao carregar dados do perfil:', error)
      Alert.alert('Erro', 'Não foi possível carregar seus dados.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Novo: fetch do perfil no foco, para refletir alterações da ProfileEdit
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/profile')
      setUserView(data?.user ?? null)
    } catch (e) {
      // se a rota mudar, ajuste aqui
      console.log('Erro ao carregar /users/profile:', e)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile()
      fetchData()
    }, [fetchUserProfile, fetchData]),
  )

  const handleViewStatement = () => navigation.navigate('orderHistory')
  const handleUseCashback = () => navigation.navigate('searchProducts' as never)
  const handleEditProfile = () => navigation.navigate('profileEdit')

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  // Preferimos userView (recente do backend); se não tiver, cai para o user do contexto
  const displayName = userView?.name ?? user?.name ?? 'Usuário'
  const displayEmail = userView?.email ?? user?.email ?? ''
  const displayAvatar = userView?.avatar ?? user?.avatar

  return (
    <View>
      <HomeScreen title="Cashback Acumulado" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Cabeçalho de perfil com avatar + botão Alterar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleEditProfile} activeOpacity={0.8}>
            <UserPhoto
              source={
                displayAvatar
                  ? { uri: displayAvatar }
                  : undefined /* defaultUserPhotoImg */
              }
              alt="Foto do usuário"
              size={24}
              mr={3}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {displayEmail}
            </Text>

            <View style={styles.avatarActions}>
              <TouchableOpacity
                onPress={handleEditProfile}
                style={[styles.smallBtn, { backgroundColor: '#0EA5E9' }]}
              >
                <Text style={styles.smallBtnText}>Alterar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Meus cashbacks </Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.label}>Disponível</Text>
              <Text style={styles.value}>R$ {balance.toFixed(2)}</Text>
            </View>
            <View>
              <Text style={styles.label}>Recebido</Text>
              <Text style={styles.valueReceived}>
                {totalReceived.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Utilizado</Text>
              <Text style={styles.valueUsed}>{totalUsed.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleViewStatement}
            >
              <Text style={styles.buttonText}>Ver Pedidos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleUseCashback}>
              <Text style={styles.buttonText}>Usar Cashback</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Extrato </Text>

          {statement.length === 0 ? (
            <Text style={styles.summaryLabel}>
              Nenhuma transação encontrada.
            </Text>
          ) : (
            <>
              {statement.map((item) => (
                <View key={item.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {item.type === 'RECEIVE' ? 'Recebido' : 'Utilizado'} -{' '}
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        color: item.type === 'RECEIVE' ? '#16A34A' : '#EF4444',
                      },
                    ]}
                  >
                    {item.type === 'RECEIVE' ? '+' : '-'} R${' '}
                    {Number(item.amount ?? 0).toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#F9FAFB', flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  userName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  avatarActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#16A34A' },
  valueReceived: { fontSize: 16, fontWeight: 'bold', color: '#16A34A' },
  valueUsed: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },

  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
