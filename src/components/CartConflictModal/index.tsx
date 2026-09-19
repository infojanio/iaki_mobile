import React, { useCallback, useEffect, useRef } from 'react'

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

type Props = {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  currentStoreName?: string
}

export function CartConflictModal({
  isOpen,
  onCancel,
  onConfirm,
  currentStoreName,
}: Props) {
  /*
   * Evita executar cancelamento/confirmação
   * duas vezes em aparelhos lentos.
   */
  const handlingRef = useRef(false)

  /*
   * Sempre que o modal abrir novamente,
   * liberamos as ações.
   */
  useEffect(() => {
    if (isOpen) {
      handlingRef.current = false
    }
  }, [isOpen])

  const handleCancel = useCallback(() => {
    if (handlingRef.current) {
      return
    }

    handlingRef.current = true

    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (handlingRef.current) {
      return
    }

    handlingRef.current = true

    onConfirm()
  }, [onConfirm])

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      /*
       * Obrigatório/importante no Android:
       * botão físico/gesto Voltar cancela
       * corretamente o modal.
       */
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* BACKDROP */}

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleCancel}
          accessibilityLabel="Cancelar troca de loja"
        />

        {/* CONTEÚDO */}

        <View style={styles.content}>
          {/* CABEÇALHO */}

          <View style={styles.header}>
            <Text style={styles.title}>Trocar de loja?</Text>

            <Pressable
              onPress={handleCancel}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              style={({ pressed }) => [
                styles.closeButton,

                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          {/* CORPO */}

          <View style={styles.body}>
            <Text style={styles.text}>
              Você já possui um carrinho ativo
              {currentStoreName ? ` na loja ${currentStoreName}` : ''}.
            </Text>

            <Text style={styles.text}>
              Ao continuar, o carrinho atual será esvaziado e um novo carrinho
              será criado para esta loja.
            </Text>

            <Text style={styles.question}>Deseja continuar mesmo assim?</Text>
          </View>

          {/* BOTÕES */}

          <View style={styles.footer}>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,

                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,

                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.confirmText}>Trocar de loja</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    paddingHorizontal: 20,

    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  content: {
    width: '100%',

    maxWidth: 420,

    backgroundColor: '#FFFFFF',

    borderRadius: 14,

    overflow: 'hidden',

    elevation: 8,
  },

  header: {
    minHeight: 56,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingLeft: 20,

    paddingRight: 10,

    borderBottomWidth: 1,

    borderBottomColor: '#E5E7EB',
  },

  title: {
    flex: 1,

    fontSize: 18,

    fontWeight: '700',

    color: '#111827',
  },

  closeButton: {
    width: 42,
    height: 42,

    alignItems: 'center',

    justifyContent: 'center',
  },

  closeText: {
    fontSize: 30,

    lineHeight: 32,

    color: '#6B7280',
  },

  body: {
    paddingHorizontal: 20,

    paddingVertical: 18,
  },

  text: {
    marginBottom: 12,

    fontSize: 15,

    lineHeight: 21,

    color: '#374151',
  },

  question: {
    marginTop: 2,

    fontSize: 15,

    lineHeight: 21,

    fontWeight: '700',

    color: '#111827',
  },

  footer: {
    flexDirection: 'row',

    justifyContent: 'flex-end',

    padding: 14,

    borderTopWidth: 1,

    borderTopColor: '#E5E7EB',

    gap: 10,
  },

  button: {
    minHeight: 44,

    paddingHorizontal: 18,

    borderRadius: 8,

    alignItems: 'center',

    justifyContent: 'center',
  },

  cancelButton: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#9CA3AF',
  },

  confirmButton: {
    backgroundColor: '#DC2626',
  },

  cancelText: {
    fontSize: 14,

    fontWeight: '600',

    color: '#374151',
  },

  confirmText: {
    fontSize: 14,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  pressed: {
    opacity: 0.7,
  },
})
