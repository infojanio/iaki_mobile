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

import type { DeliveryPilotStore } from 'src/config/deliveryPilot'

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

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
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
    ...new Set(
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

async function getCurrentPoint(): Promise<DeliveryPoint> {
  const permission = await Location.requestForegroundPermissionsAsync()

  if (permission.status !== 'granted') {
    throw new Error(
      'Permita o acesso à localização ou escolha o destino manualmente no mapa.',
    )
  }

  const enabled = await Location.hasServicesEnabledAsync()

  if (!enabled) {
    throw new Error(
      'A localização do celular está desligada. Ative o GPS ou escolha o destino no mapa.',
    )
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              'O GPS demorou para responder. Tente novamente ou escolha o destino no mapa.',
            ),
          )
        }, 15000)
      }),
    ])

    const point = parsePoint(position.coords)

    if (!point) {
      throw new Error(
        'Não foi possível identificar uma localização válida. Escolha o destino no mapa.',
      )
    }

    return point
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

export function OrderDeliveryModal({ order, pilot, onClose }: Props) {
  const { userId } = useAuth()

  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [payment, setPayment] = useState('')

  const [availableMethods, setAvailableMethods] = useState<string[]>(() =>
    parsePaymentMethods(pilot.paymentMethods),
  )

  const [point, setPoint] = useState<DeliveryPoint | null>(null)
  const [savedPoint, setSavedPoint] = useState<DeliveryPoint | null>(null)
  const [storePoint, setStorePoint] = useState<DeliveryPoint | null>(null)

  const [useCurrentLocation, setUseCurrentLocation] = useState(true)
  const [confirmed, setConfirmed] = useState(false)

  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard')

  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(true)
  const [sending, setSending] = useState(false)

  const [notice, setNotice] = useState('')
  const [locationMessage, setLocationMessage] = useState('')

  const mapRef = useRef<MapView>(null)
  const mountedRef = useRef(false)
  const mapReadyRef = useRef(false)

  const submitLockRef = useRef(false)
  const locationLockRef = useRef(false)
  const sessionRef = useRef(0)

  const busy = sending || locating

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      sessionRef.current += 1
    }
  }, [])

  useEffect(() => {
    const session = ++sessionRef.current

    const isCurrentSession = () =>
      mountedRef.current && sessionRef.current === session

    mapReadyRef.current = false

    setLoading(true)
    setLocating(true)
    setUseCurrentLocation(true)

    setAddress('')
    setReference('')
    setPayment('')
    setPoint(null)
    setSavedPoint(null)
    setStorePoint(null)

    setConfirmed(false)
    setNotice('')
    setLocationMessage('')

    setAvailableMethods(parsePaymentMethods(pilot.paymentMethods))

    locationLockRef.current = true

    async function loadData() {
      if (!userId) {
        if (isCurrentSession()) {
          setNotice('Entre novamente para solicitar a entrega.')
          setUseCurrentLocation(false)
          setLoading(false)
          setLocating(false)
          locationLockRef.current = false
        }

        return
      }

      // O GPS e as consultas são iniciados em paralelo.
      const [addressResult, locationResult, storeResult, gpsResult] =
        await Promise.allSettled([
          api.get(`/users/${userId}/address`, {
            timeout: 15000,
          }),
          api.get(`/users/${userId}/location`, {
            timeout: 15000,
          }),
          api.get(`/stores/${pilot.storeId}`, {
            timeout: 15000,
          }),
          getCurrentPoint(),
        ])

      if (!isCurrentSession()) return

      if (addressResult.status === 'fulfilled') {
        const savedAddress = addressResult.value.data?.address

        if (savedAddress) {
          // Mantém a correção solicitada: não acrescenta
          // savedAddress.city, que acompanha a navegação.
          const formattedAddress = [
            savedAddress.street,
            savedAddress.state,
            savedAddress.postalCode,
          ]
            .filter(
              (value): value is string =>
                typeof value === 'string' && value.trim() !== '',
            )
            .map((value) => value.trim())
            .join(', ')

          setAddress(formattedAddress)

          if (!formattedAddress) {
            setNotice('Preencha o endereço completo da entrega.')
          }
        } else {
          setNotice('Preencha o endereço completo da entrega.')
        }
      } else {
        setNotice(
          'Não foi possível carregar seu endereço. Preencha o destino da entrega.',
        )
      }

      if (locationResult.status === 'fulfilled') {
        setSavedPoint(parsePoint(locationResult.value.data))
      }

      if (storeResult.status === 'fulfilled') {
        const store = storeResult.value.data?.store ?? storeResult.value.data

        if (store?.id === pilot.storeId) {
          setStorePoint(parsePoint(store))
          setAvailableMethods(parsePaymentMethods(store.deliveryPaymentMethods))
        }
      }

      if (gpsResult.status === 'fulfilled') {
        setPoint(gpsResult.value)
        setUseCurrentLocation(true)
        setLocationMessage(
          'Localização obtida. Confira se o marcador está no destino da entrega.',
        )
      } else {
        setPoint(null)
        setUseCurrentLocation(false)

        setLocationMessage(
          gpsResult.reason instanceof Error
            ? gpsResult.reason.message
            : 'Não foi possível obter sua localização. Escolha o destino no mapa.',
        )
      }

      locationLockRef.current = false
      setLocating(false)
      setLoading(false)
    }

    void loadData()

    return () => {
      if (sessionRef.current === session) {
        sessionRef.current += 1
      }
    }
  }, [userId, pilot.storeId, order.id])

  function centerMap(coordinate: DeliveryPoint, closeZoom = true) {
    if (!mapReadyRef.current) return

    mapRef.current?.animateToRegion(
      {
        ...coordinate,
        ...(closeZoom ? CLOSE_ZOOM : CITY_ZOOM),
      },
      400,
    )
  }

  function handleClose() {
    if (submitLockRef.current) return

    // Ignora resultados de consultas que terminem após o fechamento.
    sessionRef.current += 1
    onClose()
  }

  function handleChangeAddress(value: string) {
    setAddress(value)
    setConfirmed(false)
  }

  function handleSelectPoint(coordinate: DeliveryPoint) {
    if (submitLockRef.current || locationLockRef.current) return

    const selected = parsePoint(coordinate)

    if (!selected) return

    setPoint(selected)
    setUseCurrentLocation(false)
    setConfirmed(false)
    setLocationMessage(
      'Destino escolhido no mapa. Confira o endereço antes de continuar.',
    )
  }

  async function handleToggleCurrentLocation() {
    if (submitLockRef.current || locationLockRef.current) return

    if (useCurrentLocation) {
      setUseCurrentLocation(false)
      setPoint(null)
      setConfirmed(false)
      setLocationMessage(
        'Toque no mapa para escolher o outro destino da entrega.',
      )
      return
    }

    const session = sessionRef.current

    locationLockRef.current = true
    setUseCurrentLocation(true)
    setLocating(true)
    setConfirmed(false)
    setLocationMessage('')

    try {
      const currentPoint = await getCurrentPoint()

      if (!mountedRef.current || sessionRef.current !== session) {
        return
      }

      setPoint(currentPoint)

      setLocationMessage(
        'Localização obtida. Confira se o marcador está no destino da entrega.',
      )

      centerMap(currentPoint)
    } catch (error) {
      if (mountedRef.current && sessionRef.current === session) {
        setUseCurrentLocation(false)
        setPoint(null)

        setLocationMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível obter sua localização. Escolha o destino no mapa.',
        )
      }
    } finally {
      if (mountedRef.current && sessionRef.current === session) {
        locationLockRef.current = false
        setLocating(false)
      }
    }
  }

  function handleShowStoreArea() {
    centerMap(storePoint ?? CAMPOS_BELOS_REFERENCE, false)
  }

  async function handleOpenWhatsApp() {
    if (submitLockRef.current || locationLockRef.current || loading) {
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
        'Confira o marcador e confirme que o ponto corresponde ao endereço da entrega.',
      )
      return
    }

    const deliveryPoint = point
    const session = sessionRef.current

    submitLockRef.current = true
    setSending(true)

    try {
      const [orderResponse, storeResponse] = await Promise.all([
        api.get(`/orders/${order.id}`, {
          timeout: 15000,
        }),
        api.get(`/stores/${order.store.id}`, {
          timeout: 15000,
        }),
      ])

      if (!mountedRef.current || sessionRef.current !== session) {
        return
      }

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

      // Mantém o prazo atual de 30 dias do pedido.
      const createdAt = new Date(
        currentOrder.createdAt ?? currentOrder.created_at,
      )

      if (!Number.isFinite(createdAt.getTime())) {
        throw new Error('Data do pedido indisponível.')
      }

      const expiresAt = new Date(createdAt)
      expiresAt.setDate(expiresAt.getDate() + 30)

      if (Date.now() >= expiresAt.getTime()) {
        Alert.alert(
          'Pedido expirado',
          'O prazo desse pedido terminou. Consulte seus pedidos antes de continuar.',
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
        encodeURIComponent(
          `${deliveryPoint.latitude},${deliveryPoint.longitude}`,
        )

      const storeName = singleLine(String(currentStore.name || pilot.storeName))

      const message = [
        '*SOLICITAÇÃO DE ENTREGA · Clube IAkí*',
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
        ...(reference.trim() ? [`Complemento: ${reference.trim()}`] : []),
        '',
        '*LOCALIZAÇÃO CONFIRMADA*',
        locationUrl,
        '',
        '*FORMA DE PAGAMENTO*',
        payment,
        '',
        'Por favor, confirme a disponibilidade dos produtos, a taxa de entrega, o valor final e o prazo.',
        '',
        'Aguardo a confirmação. Obrigado!',
      ].join('\n')

      await Linking.openURL(
        `https://wa.me/${currentWhatsapp}?text=` + encodeURIComponent(message),
      )
    } catch (error) {
      if (mountedRef.current && sessionRef.current === session) {
        console.warn('[OrderDeliveryModal] Falha ao abrir solicitação:', error)

        Alert.alert(
          'Não foi possível abrir a solicitação',
          'Confira sua conexão e tente novamente. Seu pedido continua no histórico; não registre outro para reenviar.',
        )
      }
    } finally {
      submitLockRef.current = false

      if (mountedRef.current && sessionRef.current === session) {
        setSending(false)
      }
    }
  }

  const initialCenter =
    point ?? savedPoint ?? storePoint ?? CAMPOS_BELOS_REFERENCE

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
              Combine disponibilidade, taxa, prazo e pagamento com a loja pelo
              WhatsApp.
            </Text>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#2563EB" />

                <Text style={styles.help}>
                  Buscando seu endereço e sua localização atual…
                </Text>
              </View>
            ) : (
              <>
                {!!notice && <Text style={styles.warning}>{notice}</Text>}

                <Text style={styles.label}>Endereço da entrega *</Text>

                <TextInput
                  value={address}
                  onChangeText={handleChangeAddress}
                  editable={!sending}
                  multiline
                  maxLength={400}
                  style={styles.input}
                  accessibilityLabel="Endereço completo da entrega"
                  placeholder="Rua, número, bairro e cidade"
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.help}>
                  Confira se o endereço corresponde ao ponto no mapa. O GPS não
                  altera esse campo.
                </Text>

                <Text style={styles.label}>Complemento</Text>

                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  editable={!sending}
                  multiline
                  maxLength={250}
                  style={styles.input}
                  accessibilityLabel="Complemento e referência"
                  placeholder="Apartamento, portão, próximo a..."
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.label}>Local da entrega *</Text>

                <Pressable
                  style={[
                    styles.option,
                    useCurrentLocation && styles.selected,
                    busy && styles.disabled,
                  ]}
                  disabled={busy}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: useCurrentLocation,
                    disabled: busy,
                    busy: locating,
                  }}
                  onPress={() => void handleToggleCurrentLocation()}
                >
                  <View style={styles.optionRow}>
                    <Text
                      style={[
                        styles.checkbox,
                        useCurrentLocation && styles.checkboxSelected,
                      ]}
                    >
                      {useCurrentLocation ? '✓' : ''}
                    </Text>

                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>
                        Usar minha localização atual
                      </Text>

                      <Text style={styles.optionDescription}>
                        {locating
                          ? 'Obtendo sua posição pelo GPS…'
                          : useCurrentLocation
                            ? 'Desmarque para escolher outro destino.'
                            : 'Marque para buscar sua posição pelo GPS.'}
                      </Text>
                    </View>

                    {locating && <ActivityIndicator color="#2563EB" />}
                  </View>
                </Pressable>

                {!!locationMessage && (
                  <Text style={styles.help}>{locationMessage}</Text>
                )}

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
                  Toque no mapa ou arraste o marcador para escolher outro
                  destino. Isso desmarca o uso da localização atual.
                </Text>

                <MapView
                  ref={mapRef}
                  style={styles.map}
                  mapType={mapType}
                  initialRegion={{
                    ...initialCenter,
                    ...(point ? CLOSE_ZOOM : CITY_ZOOM),
                  }}
                  zoomEnabled={!busy}
                  scrollEnabled={!busy}
                  rotateEnabled={!busy}
                  pitchEnabled={!busy}
                  onMapReady={() => {
                    mapReadyRef.current = true
                  }}
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
                    ? `Destino: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
                    : 'Nenhum destino selecionado. Toque no mapa para marcar.'}
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
                    disabled: !point || busy,
                  }}
                  onPress={() => setConfirmed((current) => !current)}
                >
                  <View style={styles.optionRow}>
                    <Text
                      style={[
                        styles.checkbox,
                        confirmed && styles.checkboxSelected,
                      ]}
                    >
                      {confirmed ? '✓' : ''}
                    </Text>

                    <Text style={styles.confirmationText}>
                      Confirmo que o endereço e o ponto no mapa são o destino da
                      entrega.
                    </Text>
                  </View>
                </Pressable>

                <Text style={styles.label}>Como deseja pagar à loja? *</Text>

                {availableMethods.length === 0 && (
                  <Text style={styles.warning}>
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
                      sending && styles.disabled,
                    ]}
                    disabled={sending}
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
                  Confira a mensagem e toque em Enviar no WhatsApp. Abrir a
                  conversa não confirma entrega ou pagamento.
                  {'\n\n'}
                  Os pontos serão creditados após a validação da compra pela
                  loja.
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
              style={[styles.cancel, sending && styles.disabled]}
              disabled={sending}
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
    paddingVertical: 30,
  },
  label: {
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 8,
    fontSize: 15,
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
  warning: {
    backgroundColor: '#FFFBEB',
    color: '#92400E',
    padding: 12,
    borderRadius: 10,
    lineHeight: 20,
    marginVertical: 8,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
    color: '#0F172A',
    textAlignVertical: 'top',
    fontSize: 15,
  },
  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14,
  },
  optionDescription: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  optionText: {
    color: '#1E293B',
    lineHeight: 21,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 5,
    textAlign: 'center',
    lineHeight: 21,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    overflow: 'hidden',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  confirmationText: {
    flex: 1,
    color: '#1E293B',
    lineHeight: 21,
    fontSize: 13,
  },
  selected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  mapActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
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
    fontSize: 15,
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
