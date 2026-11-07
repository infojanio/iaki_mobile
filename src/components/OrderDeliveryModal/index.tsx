import { useEffect, useRef, useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'

import { api } from '@services/api'
import { useAuth } from '@hooks/useAuth'
import { formatCurrency } from '@utils/format'
import { DeliveryPilotStore } from 'src/config/deliveryPilot'

type DeliveryPoint = {
  latitude: number
  longitude: number
}

export type DeliveryOrder = {
  id: string

  store: {
    id: string
    name: string
  }

  totalAmount: number
  discountApplied: number

  items: {
    quantity: number
    subtotal: number | null
    product: {
      name: string
    }
  }[]
}

type Props = {
  order: DeliveryOrder
  pilot: DeliveryPilotStore
  onClose: () => void
}

type ApiOrderItem = {
  quantity?: unknown
  subtotal?: unknown
  product?: {
    name?: string
  } | null
}

// Referência aproximada; não é selecionada como destino.
const CAMPOS_BELOS_REFERENCE: DeliveryPoint = {
  latitude: -13.0367,
  longitude: -46.7717,
}

const CLOSE_ZOOM = {
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
}

const CITY_ZOOM = {
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
}

function parseCoordinate(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && !value.trim())
  ) {
    return null
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

function parsePoint(value: unknown): DeliveryPoint | null {
  if (!value || typeof value !== 'object') return null

  const data = value as Record<string, unknown>

  const latitude = parseCoordinate(data.latitude)
  const longitude = parseCoordinate(data.longitude)

  if (
    latitude === null ||
    longitude === null ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null
  }

  return { latitude, longitude }
}

function parsePaymentMethods(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return [
    ...new Set<string>(
      value
        .filter(
          (method): method is string =>
            typeof method === 'string' && method.trim() !== '',
        )
        .map((method) => method.trim()),
    ),
  ]
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export function OrderDeliveryModal({ order, pilot, onClose }: Props) {
  const { userId } = useAuth()

  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [payment, setPayment] = useState('')

  const [availableMethods, setAvailableMethods] = useState<string[]>(
    pilot.paymentMethods,
  )

  const [point, setPoint] = useState<DeliveryPoint | null>(null)

  const [storePoint, setStorePoint] = useState<DeliveryPoint | null>(null)

  const [confirmed, setConfirmed] = useState(false)

  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard')

  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  const lockRef = useRef(false)
  const locationLockRef = useRef(false)
  const mountedRef = useRef(true)
  const mapRef = useRef<MapView>(null)

  const busy = sending || locating

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadSavedData() {
      setLoading(true)
      setNotice('')
      setConfirmed(false)
      setPayment('')
      setAddress('')
      setReference('')
      setPoint(null)
      setStorePoint(null)

      if (!userId) {
        if (active) {
          setNotice('Entre novamente para consultar seus dados.')
          setLoading(false)
        }

        return
      }

      const [addressResult, locationResult, storeResult] =
        await Promise.allSettled([
          api.get(`/users/${userId}/address`),
          api.get(`/users/${userId}/location`),
          api.get(`/stores/${pilot.storeId}`),
        ])

      if (!active) return

      if (addressResult.status === 'fulfilled') {
        const savedAddress = addressResult.value.data?.address

        if (savedAddress) {
          const formattedAddress = [
            savedAddress.street,
            savedAddress.city,
            savedAddress.state,
            savedAddress.postalCode,
          ]
            .filter(
              (value): value is string =>
                typeof value === 'string' && value.trim() !== '',
            )
            .join(', ')

          setAddress(formattedAddress)
        }
      } else {
        setNotice(
          'Não foi possível preencher o endereço salvo. Digite o destino da entrega.',
        )
      }

      if (locationResult.status === 'fulfilled') {
        setPoint(parsePoint(locationResult.value.data))
      }

      if (storeResult.status === 'fulfilled') {
        const store = storeResult.value.data?.store ?? storeResult.value.data

        if (store?.id === pilot.storeId) {
          setStorePoint(parsePoint(store))

          setAvailableMethods(parsePaymentMethods(store.deliveryPaymentMethods))
        }
      }

      setLoading(false)
    }

    void loadSavedData()

    return () => {
      active = false
    }
  }, [userId, pilot.storeId])

  function handleClose() {
    if (lockRef.current || locationLockRef.current) {
      return
    }

    onClose()
  }

  function handleChangeAddress(value: string) {
    setAddress(value)
    setConfirmed(false)
  }

  function handleSelectPoint(coordinate: DeliveryPoint) {
    if (lockRef.current || locationLockRef.current) {
      return
    }

    setPoint(coordinate)
    setConfirmed(false)
  }

  function handleShowStoreArea() {
    const center = storePoint ?? CAMPOS_BELOS_REFERENCE

    mapRef.current?.animateToRegion(
      {
        ...center,
        ...CITY_ZOOM,
      },
      400,
    )

    // Somente move o mapa; não altera o destino.
  }

  async function handleCurrentLocation() {
    if (locationLockRef.current || lockRef.current) {
      return
    }

    locationLockRef.current = true
    setLocating(true)

    try {
      const permission = await Location.requestForegroundPermissionsAsync()

      if (!mountedRef.current) return

      if (permission.status !== 'granted') {
        Alert.alert(
          'Localização não autorizada',
          'Você pode marcar o destino no mapa e preencher o endereço.',
        )

        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      if (!mountedRef.current) return

      const currentPoint = parsePoint(currentLocation.coords)

      if (!currentPoint) {
        throw new Error('Coordenadas inválidas.')
      }

      setPoint(currentPoint)
      setConfirmed(false)

      mapRef.current?.animateToRegion(
        {
          ...currentPoint,
          ...CLOSE_ZOOM,
        },
        400,
      )
    } catch {
      if (mountedRef.current) {
        Alert.alert(
          'Não foi possível obter sua localização',
          'Confira se o GPS está ligado. Você também pode marcar o destino no mapa.',
        )
      }
    } finally {
      locationLockRef.current = false

      if (mountedRef.current) {
        setLocating(false)
      }
    }
  }

  async function handleOpenWhatsApp() {
    if (lockRef.current || locationLockRef.current) {
      return
    }

    if (!userId) {
      Alert.alert(
        'Sessão indisponível',
        'Entre novamente para solicitar a entrega.',
      )
      return
    }

    if (address.trim().length < 10) {
      Alert.alert(
        'Confira o endereço',
        'Informe rua, número, bairro e cidade. Se não houver número, informe “sem número”.',
      )
      return
    }

    if (!payment || !availableMethods.includes(payment)) {
      Alert.alert(
        'Escolha o pagamento',
        'Selecione como deseja pagar diretamente à loja.',
      )
      return
    }

    if (!point || !confirmed) {
      Alert.alert(
        'Confirme o destino',
        'Marque o ponto no mapa e confirme que ele corresponde ao endereço da entrega.',
      )
      return
    }

    lockRef.current = true
    setSending(true)

    try {
      const [orderResponse, storeResponse] = await Promise.all([
        api.get(`/orders/${order.id}`),
        api.get(`/stores/${order.store.id}`),
      ])

      if (!mountedRef.current) return

      const currentOrder = orderResponse.data?.order ?? orderResponse.data

      const currentStore = storeResponse.data?.store ?? storeResponse.data

      const currentStoreId = currentOrder?.store?.id ?? currentOrder?.storeId

      if (
        currentOrder?.id !== order.id ||
        currentOrder.status !== 'PENDING' ||
        currentStoreId !== pilot.storeId ||
        currentStore?.id !== pilot.storeId ||
        currentStore.isActive !== true ||
        currentStore.deliveryEnabled !== true
      ) {
        Alert.alert(
          'Solicitação indisponível',
          'Confira se o pedido continua pendente e se a loja ainda aceita solicitações de entrega.',
        )
        return
      }

      const currentWhatsapp =
        typeof currentStore.deliveryWhatsapp === 'string'
          ? currentStore.deliveryWhatsapp.replace(/\D/g, '')
          : ''

      if (!/^55\d{10,11}$/.test(currentWhatsapp)) {
        Alert.alert(
          'Contato indisponível',
          'A loja está sem um WhatsApp válido para entrega.',
        )
        return
      }

      const currentMethods = parsePaymentMethods(
        currentStore.deliveryPaymentMethods,
      )

      setAvailableMethods(currentMethods)

      if (!currentMethods.includes(payment)) {
        setPayment('')

        Alert.alert(
          'Formas de pagamento atualizadas',
          currentMethods.length > 0
            ? 'A loja alterou as opções. Escolha novamente como deseja pagar.'
            : 'A loja está sem formas de pagamento configuradas para entrega.',
        )
        return
      }

      const totalAmount = Number(currentOrder.totalAmount)

      const discountApplied = Number(currentOrder.discountApplied ?? 0)

      if (
        !Number.isFinite(totalAmount) ||
        !Number.isFinite(discountApplied) ||
        totalAmount < 0 ||
        discountApplied < 0 ||
        !Array.isArray(currentOrder.items) ||
        currentOrder.items.length === 0
      ) {
        throw new Error('Dados do pedido indisponíveis.')
      }

      const netAmount = Math.max(totalAmount - discountApplied, 0)

      const itemLines = currentOrder.items.map((item: ApiOrderItem) => {
        const quantity = Number(item.quantity)

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error('Quantidade inválida.')
        }

        const itemName = singleLine(
          item.product?.name || 'Produto indisponível',
        )

        const subtotal =
          item.subtotal === null || item.subtotal === undefined
            ? null
            : Number(item.subtotal)

        const itemValue =
          subtotal !== null && Number.isFinite(subtotal)
            ? ` — ${formatCurrency(subtotal)}`
            : ''

        return `• ${quantity} × ${itemName}${itemValue}`
      })

      const locationUrl =
        'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(`${point.latitude},${point.longitude}`)

      const storeName = singleLine(String(currentStore.name || pilot.storeName))

      const message = [
        '*SOLICITAÇÃO DE ENTREGA · IAkí*',
        '',
        `Olá, equipe *${storeName}*!`,
        'Gostaria de solicitar a entrega do pedido abaixo.',
        '',
        '*PEDIDO*',
        `Código: ${order.id}`,
        '',
        '*PRODUTOS*',
        ...itemLines,
        '',
        '*VALOR DOS PRODUTOS*',
        formatCurrency(netAmount),
        'Taxa de entrega a confirmar.',
        '',
        '*ENDEREÇO DE ENTREGA*',
        address.trim(),
        ...(reference.trim()
          ? [`Complemento / referência: ${reference.trim()}`]
          : []),
        '',
        '*LOCALIZAÇÃO CONFIRMADA*',
        locationUrl,
        '',
        '*FORMA DE PAGAMENTO DESEJADA*',
        payment,
        '',
        'Por favor, confirme a disponibilidade dos produtos, a taxa de entrega, o valor final e o prazo.',
        '',
        'Aguardo a confirmação. Obrigado!',
      ].join('\n')

      await Linking.openURL(
        `https://wa.me/${currentWhatsapp}?text=` + encodeURIComponent(message),
      )

      // Não confirma envio, entrega ou pagamento.
      // Não cria outro pedido.
    } catch {
      if (mountedRef.current) {
        Alert.alert(
          'Não foi possível abrir a solicitação',
          'Confira sua conexão e tente novamente. Seu pedido continua no histórico; não registre outro para reenviar.',
        )
      }
    } finally {
      lockRef.current = false

      if (mountedRef.current) {
        setSending(false)
      }
    }
  }

  const initialCenter = point ?? storePoint ?? CAMPOS_BELOS_REFERENCE

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Text style={styles.title}>Solicitar entrega</Text>

            <Text style={styles.subtitle}>
              {order.store.name}
              {'\n'}
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </Text>

            <Text style={styles.notice}>
              A loja confirmará disponibilidade, taxa, prazo e pagamento pelo
              WhatsApp. Os dados desta solicitação não ficam salvos no pedido do
              aplicativo.
            </Text>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color="#2563EB" />

                <Text style={styles.help}>
                  Buscando endereço e localização...
                </Text>
              </View>
            ) : (
              <>
                {!!notice && <Text style={styles.help}>{notice}</Text>}

                <Text style={styles.label}>Endereço completo *</Text>

                <TextInput
                  value={address}
                  onChangeText={handleChangeAddress}
                  editable={!busy}
                  multiline
                  maxLength={400}
                  style={styles.input}
                  accessibilityLabel="Endereço completo"
                  placeholder="Rua, número, bairro e cidade"
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.label}>Complemento / referência</Text>

                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  editable={!busy}
                  multiline
                  maxLength={250}
                  style={styles.input}
                  accessibilityLabel="Complemento e referência"
                  placeholder="Apartamento, portão, próximo a..."
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.label}>Local da entrega *</Text>

                <Pressable
                  style={[styles.option, busy && styles.disabled]}
                  disabled={busy}
                  accessibilityRole="button"
                  onPress={() => void handleCurrentLocation()}
                >
                  <Text style={styles.optionText}>
                    {locating
                      ? 'Obtendo localização...'
                      : 'Usar minha localização atual'}
                  </Text>
                </Pressable>

                <View style={styles.mapActions}>
                  <Pressable
                    style={[styles.mapAction, busy && styles.disabled]}
                    disabled={busy}
                    accessibilityRole="button"
                    onPress={() =>
                      setMapType((current) =>
                        current === 'hybrid' ? 'standard' : 'hybrid',
                      )
                    }
                  >
                    <Text style={styles.mapActionText}>
                      {mapType === 'hybrid' ? 'Mapa de ruas' : 'Satélite'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.mapAction, busy && styles.disabled]}
                    disabled={busy}
                    accessibilityRole="button"
                    onPress={handleShowStoreArea}
                  >
                    <Text style={styles.mapActionText}>
                      {storePoint ? 'Região da loja' : 'Campos Belos–GO'}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.help}>
                  Aproxime com dois dedos e toque no destino. Você também pode
                  arrastar o marcador para a entrada do imóvel.
                </Text>

                <MapView
                  ref={mapRef}
                  style={styles.map}
                  mapType={mapType}
                  initialRegion={{
                    ...initialCenter,
                    ...(point ? CLOSE_ZOOM : CITY_ZOOM),
                  }}
                  zoomEnabled
                  scrollEnabled
                  onPress={(event) =>
                    handleSelectPoint(event.nativeEvent.coordinate)
                  }
                >
                  {point && (
                    <Marker
                      coordinate={point}
                      title="Destino da entrega"
                      draggable={!busy}
                      onDragEnd={(event) =>
                        handleSelectPoint(event.nativeEvent.coordinate)
                      }
                    />
                  )}
                </MapView>

                <Text style={styles.help}>
                  {point
                    ? `Ponto selecionado: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
                    : 'Nenhum destino selecionado. Toque no mapa para marcar.'}
                  {'\n'}A localização salva pode ser antiga. Confira se
                  corresponde ao endereço informado.
                </Text>

                <Pressable
                  style={[
                    styles.option,
                    confirmed && styles.selected,
                    (!point || busy) && styles.disabled,
                  ]}
                  disabled={!point || busy}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: confirmed,
                  }}
                  onPress={() => setConfirmed(!confirmed)}
                >
                  <Text style={styles.optionText}>
                    {confirmed ? '☑' : '☐'} Confirmo que o ponto e o endereço
                    são o destino da entrega.
                  </Text>
                </Pressable>

                <Text style={styles.label}>Como deseja pagar à loja? *</Text>

                {availableMethods.length === 0 && (
                  <Text style={styles.help}>
                    A loja está sem formas de pagamento disponíveis para
                    entrega.
                  </Text>
                )}

                {availableMethods.map((method) => (
                  <Pressable
                    key={method}
                    style={[
                      styles.option,
                      payment === method && styles.selected,
                    ]}
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: payment === method,
                    }}
                    onPress={() => setPayment(method)}
                  >
                    <Text style={styles.optionText}>
                      {payment === method ? '●' : '○'} {method}
                    </Text>
                  </Pressable>
                ))}

                <Text style={styles.help}>
                  O endereço e o ponto confirmado serão incluídos na mensagem.
                  Confira e toque em Enviar no WhatsApp.
                  {'\n\n'}
                  Abrir a conversa não confirma entrega ou pagamento. Os pontos
                  dependem da validação da compra pela loja.
                </Text>

                <Pressable
                  style={[
                    styles.primary,
                    (busy || availableMethods.length === 0) && styles.disabled,
                  ]}
                  disabled={busy || availableMethods.length === 0}
                  accessibilityRole="button"
                  onPress={() => void handleOpenWhatsApp()}
                >
                  {sending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryText}>
                      Abrir pedido no WhatsApp
                    </Text>
                  )}
                </Pressable>
              </>
            )}

            <Pressable
              style={[styles.cancel, busy && styles.disabled]}
              disabled={busy}
              accessibilityRole="button"
              onPress={handleClose}
            >
              <Text style={styles.optionText}>Voltar ao pedido</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    color: '#475569',
    marginTop: 6,
    lineHeight: 21,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  label: {
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 8,
  },
  help: {
    color: '#475569',
    lineHeight: 20,
    marginVertical: 12,
    fontSize: 13,
  },
  notice: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    padding: 14,
    borderRadius: 12,
    lineHeight: 21,
    marginVertical: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginTop: 10,
  },
  optionText: {
    color: '#1E293B',
    lineHeight: 21,
  },
  selected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  mapActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  mapAction: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  mapActionText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 13,
  },
  map: {
    height: 300,
    borderRadius: 12,
  },
  primary: {
    padding: 16,
    minHeight: 52,
    backgroundColor: '#15803D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  cancel: {
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  disabled: {
    opacity: 0.5,
  },
})
