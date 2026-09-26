// AppErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react'

import { Pressable, StyleSheet, Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', {
      message: error.message,

      stack: error.stack,

      componentStack: info.componentStack,
    })
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="error-outline" size={46} color="#6B7280" />
          </View>

          <Text style={styles.title}>Algo não saiu como esperado</Text>

          <Text style={styles.description}>
            O Clube IAki encontrou um problema. Tente novamente. Se o erro
            continuar, feche e abra o aplicativo.
          </Text>

          <Pressable
            onPress={this.handleRetry}
            style={({ pressed }) => [
              styles.button,

              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />

            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )
    }

    return this.props.children
  }
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
    maxWidth: 340,

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
