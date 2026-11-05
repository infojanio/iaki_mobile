import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'

type Props = {
  isOpen: boolean
  storeId: string
  storeName: string
  onClose: () => void
  onSuccess: (rating: number) => void
}

export function StoreRatingModal({
  isOpen,
  storeId,
  storeName,
  onClose,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const submittingRef = useRef(false)

  function handleClose() {
    if (submittingRef.current) return

    setRating(0)
    setSubmitted(false)
    setErrorMessage(null)
    onClose()
  }

  async function handleSubmit() {
    if (rating === 0 || submitted || submittingRef.current) return

    const submittedRating = rating

    submittingRef.current = true
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await api.post(`/stores/${storeId}/evaluations`, {
        rating: submittedRating,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof AppError
          ? error.message
          : 'Não foi possível enviar sua avaliação. Tente novamente.',
      )
      return
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }

    setSubmitted(true)
    onSuccess(submittedRating)
  }

  const submitDisabled = rating === 0 || isSubmitting

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {submitted ? (
            <>
              <View style={styles.successIcon}>
                <MaterialIcons name="check" size={28} color="#15803D" />
              </View>

              <View accessibilityLiveRegion="polite">
                <Text style={styles.title} accessibilityRole="header">
                  Avaliação enviada!
                </Text>
                <Text style={styles.description}>
                  Obrigado por avaliar {storeName}.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.primaryButton,
                  styles.fullWidth,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                onPress={handleClose}
              >
                <Text style={styles.primaryText}>Concluir</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title} accessibilityRole="header">
                Avaliar loja
              </Text>

              <Text style={styles.description}>
                Como foi sua experiência com{' '}
                <Text style={styles.storeName}>{storeName}</Text>?
              </Text>

              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    style={styles.starButton}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityLabel={
                      value === 1 ? '1 estrela' : `${value} estrelas`
                    }
                    accessibilityState={{
                      selected: rating === value,
                      disabled: isSubmitting,
                    }}
                    onPress={() => {
                      setRating(value)
                      setErrorMessage(null)
                    }}
                  >
                    <MaterialIcons
                      name={value <= rating ? 'star' : 'star-border'}
                      size={28}
                      color="#B45309"
                    />
                  </Pressable>
                ))}
              </View>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text
                    style={styles.errorText}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.actionButton,
                    styles.secondaryButton,
                    pressed && styles.pressed,
                    isSubmitting && styles.disabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isSubmitting }}
                  disabled={isSubmitting}
                  onPress={handleClose}
                >
                  <Text style={styles.secondaryText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.actionButton,
                    styles.primaryButton,
                    pressed && styles.pressed,
                    submitDisabled && styles.disabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: submitDisabled,
                    busy: isSubmitting,
                  }}
                  disabled={submitDisabled}
                  onPress={() => void handleSubmit()}
                >
                  {isSubmitting && (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  )}
                  <Text style={styles.primaryText}>
                    {isSubmitting ? 'Enviando…' : 'Enviar'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    color: '#4B5563',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
  storeName: {
    fontWeight: '700',
    color: '#111827',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  starButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#15803D',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
  fullWidth: {
    marginTop: 20,
  },
  successIcon: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
})
