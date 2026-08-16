import React, { useMemo, useState } from 'react'

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

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'

import { AuthNavigatorRoutesProps, AuthRoutesParams } from '@routes/auth.routes'

import { useToast } from 'native-base'

import { resetPassword } from '@services/password'

type ResetPasswordRouteProp = RouteProp<AuthRoutesParams, 'resetPassword'>

export function ResetPassword() {
  const navigation = useNavigation<AuthNavigatorRoutesProps>()

  const route = useRoute<ResetPasswordRouteProp>()

  const toast = useToast()

  const { email, challenge } = route.params

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  const maskedEmail = useMemo(() => {
    const [username, domain] = email.split('@')

    if (!username || !domain) {
      return email
    }

    const visible = username.slice(0, 2)

    const hidden = '*'.repeat(Math.max(username.length - 2, 3))

    return `${visible}${hidden}@${domain}`
  }, [email])

  function handleGoBack() {
    navigation.goBack()
  }

  function handleCodeChange(value: string) {
    const numeric = value.replace(/\D/g, '')

    setCode(numeric.slice(0, 6))
  }

  async function handleResetPassword() {
    if (code.length !== 6) {
      toast.show({
        title: 'Informe o código de 6 dígitos.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    if (password.length < 6) {
      toast.show({
        title: 'A senha deve possuir pelo menos 6 caracteres.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    if (password !== confirmPassword) {
      toast.show({
        title: 'As senhas não coincidem.',
        placement: 'top',
        bgColor: 'red.500',
      })

      return
    }

    try {
      setLoading(true)

      await resetPassword({
        challenge,
        code,
        newPassword: password,
      })

      navigation.replace('passwordResetSuccess')
    } catch (error: any) {
      console.log('[ResetPassword]', error?.response?.data ?? error)

      toast.show({
        title:
          error?.response?.data?.message ??
          'Não foi possível alterar sua senha.',
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
        {/* Banner */}
        <View style={styles.bannerContainer}></View>

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
              <Feather name="key" size={34} color="#e1093f" />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>Criar nova senha</Text>

          <Text style={styles.description}>
            Digite o código que enviamos para:
          </Text>

          <Text style={styles.emailText}>{maskedEmail}</Text>

          {/* Código */}
          <Text style={styles.label}>Código de verificação</Text>

          <View style={styles.inputWrapper}>
            <Feather
              name="hash"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />

            <TextInput
              value={code}
              onChangeText={handleCodeChange}
              placeholder="000000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
              editable={!loading}
              style={[styles.input, styles.codeInput]}
            />
          </View>

          <Text style={styles.helperText}>Código válido por 10 minutos.</Text>

          {/* Nova senha */}
          <Text style={[styles.label, styles.fieldSpacing]}>Nova senha</Text>

          <View style={styles.inputWrapper}>
            <Feather
              name="lock"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Nova senha"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((previous) => !previous)}
            >
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>Mínimo de 6 caracteres.</Text>

          {/* Confirmar senha */}
          <Text style={[styles.label, styles.fieldSpacing]}>
            Confirmar nova senha
          </Text>

          <View style={styles.inputWrapper}>
            <Feather
              name="lock"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((previous) => !previous)}
            >
              <Feather
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Botão */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Alterando senha...' : 'Alterar senha'}
            </Text>
          </TouchableOpacity>

          {/* Segurança */}
          <View style={styles.securityContainer}>
            <Feather name="shield" size={18} color="#666" />

            <Text style={styles.securityText}>
              Nunca compartilhe seu código de recuperação com outras pessoas.
            </Text>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={IakiPng} style={styles.logo} resizeMode="contain" />
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

    marginBottom: -5,
  },

  bannerImage: {
    height: 150,
    width: 260,
  },

  formContainer: {
    backgroundColor: '#FFF',

    borderRadius: 12,

    paddingHorizontal: 18,
    paddingTop: 16,
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

    marginBottom: 5,
  },

  backText: {
    marginLeft: 6,

    color: '#555',

    fontSize: 15,
    fontWeight: '500',
  },

  iconContainer: {
    alignItems: 'center',
    marginTop: 2,
  },

  iconCircle: {
    width: 70,
    height: 70,

    borderRadius: 35,

    backgroundColor: '#FDE8ED',

    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',

    color: '#333',

    textAlign: 'center',

    marginTop: 14,
  },

  description: {
    fontSize: 14,

    color: '#666',

    textAlign: 'center',

    marginTop: 8,
  },

  emailText: {
    fontSize: 15,

    color: '#e1093f',

    fontWeight: 'bold',

    textAlign: 'center',

    marginTop: 4,
    marginBottom: 22,
  },

  label: {
    fontSize: 14,

    fontWeight: '600',

    color: '#444',

    marginBottom: 7,
  },

  fieldSpacing: {
    marginTop: 18,
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

  codeInput: {
    letterSpacing: 5,

    fontWeight: 'bold',

    fontSize: 19,
  },

  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 10,
  },

  helperText: {
    fontSize: 12,

    color: '#777',

    marginTop: 5,
    marginLeft: 3,
  },

  button: {
    backgroundColor: '#4CAF50',

    minHeight: 52,

    borderRadius: 7,

    marginTop: 24,

    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#FFF',

    fontWeight: 'bold',

    fontSize: 16,
  },

  securityContainer: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: '#F8F8F8',

    borderRadius: 8,

    padding: 12,

    marginTop: 18,
  },

  securityText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 12,

    color: '#666',

    lineHeight: 18,
  },

  logoContainer: {
    alignItems: 'center',

    marginTop: 8,
  },

  logo: {
    height: 65,
    width: 110,
  },
})
