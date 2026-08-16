import React, { useState } from 'react'

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Image,
} from 'react-native'

import { Feather } from '@expo/vector-icons'

import IakiPng from '@assets/logoiaki.png'
import clubePng from '@assets/cashbacks.png'

import { useNavigation } from '@react-navigation/native'
import { AuthNavigatorRoutesProps } from '@routes/auth.routes'

import { useToast } from 'native-base'

import { forgotPassword } from '@services/password'

export function ForgotPassword() {
  const navigation = useNavigation<AuthNavigatorRoutesProps>()

  const toast = useToast()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function handleGoBack() {
    navigation.goBack()
  }

  async function handleContinue() {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      toast.show({
        title: 'Informe seu e-mail.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    if (!isValidEmail(normalizedEmail)) {
      toast.show({
        title: 'Informe um e-mail válido.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    try {
      setLoading(true)

      const response = await forgotPassword({
        email: normalizedEmail,
      })

      navigation.navigate('resetPassword', {
        email: normalizedEmail,
        challenge: response.challenge,
      })
    } catch (error: any) {
      console.log('[ForgotPassword]', error?.response?.data ?? error)

      const message =
        error?.response?.data?.message ??
        'Não foi possível solicitar a recuperação. Tente novamente.'

      toast.show({
        title: message,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={30}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Card */}
        <View style={styles.formContainer}>
          {/* Voltar */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color="#555" />

            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          {/* Ícone */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="mail" size={34} color="#e1093f" />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>Esqueceu sua senha?</Text>

          <Text style={styles.description}>
            Informe o e-mail cadastrado no Clube IAki. Enviaremos um código para
            você criar uma nova senha.
          </Text>

          {/* E-mail */}
          <Text style={styles.label}>E-mail</Text>

          <View style={styles.inputWrapper}>
            <Feather
              name="mail"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seuemail@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="send"
              editable={!loading}
              onSubmitEditing={handleContinue}
              style={styles.input}
            />
          </View>

          {/* Botão */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <Text style={styles.buttonText}>Enviando código...</Text>
            ) : (
              <View style={styles.buttonContent}>
                <Feather name="send" size={18} color="#FFF" />

                <Text style={styles.buttonText}>Enviar código</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Informação */}
          <View style={styles.infoContainer}>
            <Feather name="shield" size={18} color="#666" />

            <Text style={styles.infoText}>
              Por segurança, a resposta será a mesma independentemente de o
              e-mail estar cadastrado.
            </Text>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image style={styles.logo} source={IakiPng} resizeMode="contain" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginHorizontal: 0,
    marginBottom: -5,
  },

  bannerImage: {
    height: 180,
    width: 280,
  },

  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,

    elevation: 5,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 12,
    marginBottom: 8,
  },

  backText: {
    marginLeft: 6,
    color: '#555',
    fontSize: 15,
    fontWeight: '500',
  },

  iconContainer: {
    alignItems: 'center',
    marginTop: 4,
  },

  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,

    backgroundColor: '#FDE8ED',

    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
  },

  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 5,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 7,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F0F0F0',

    borderRadius: 8,

    paddingHorizontal: 12,

    minHeight: 52,

    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,

    height: 52,

    fontSize: 16,

    color: '#333',

    paddingVertical: 0,
  },

  button: {
    backgroundColor: '#4CAF50',

    minHeight: 52,

    borderRadius: 7,

    marginTop: 20,

    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonText: {
    color: '#FFF',

    fontWeight: 'bold',

    fontSize: 16,
  },

  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    backgroundColor: '#F8F8F8',

    borderRadius: 8,

    padding: 12,

    marginTop: 18,
  },

  infoText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 12,

    color: '#666',

    lineHeight: 18,
  },

  logoContainer: {
    alignItems: 'center',

    marginTop: 10,
  },

  logo: {
    height: 70,
    width: 115,
  },
})
