import React from 'react'

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

type Props = {
  isRetrying?: boolean
  onRetry: () => void
}

export function OfflineScreen({ isRetrying = false, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="wifi-off" size={46} color="#6B7280" />
      </View>

      <Text style={styles.title}>Você está sem conexão</Text>

      <Text style={styles.description}>
        Não foi possível conectar ao Clube IAki. Verifique sua internet e tente
        novamente.
      </Text>

      <Pressable
        disabled={isRetrying}
        onPress={onRetry}
        style={({ pressed }) => [
          styles.button,
          pressed && !isRetrying && styles.buttonPressed,
        ]}
      >
        {isRetrying ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />

            <Text style={styles.buttonText}>Tentar novamente</Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 32,

    backgroundColor: '#F9FAFB',
  },

  iconContainer: {
    width: 88,

    height: 88,

    borderRadius: 44,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F3F4F6',
  },

  title: {
    marginTop: 22,

    fontSize: 21,

    fontWeight: '700',

    color: '#1F2937',

    textAlign: 'center',
  },

  description: {
    maxWidth: 330,

    marginTop: 10,

    fontSize: 14,

    lineHeight: 21,

    color: '#6B7280',

    textAlign: 'center',
  },

  button: {
    minWidth: 190,

    minHeight: 48,

    marginTop: 28,

    paddingHorizontal: 22,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,

    borderRadius: 12,

    backgroundColor: '#00875F',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    fontSize: 14,

    fontWeight: '700',

    color: '#FFFFFF',
  },
})
