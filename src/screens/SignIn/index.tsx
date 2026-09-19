import React, { useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { Feather } from '@expo/vector-icons'

import { Controller, useForm } from 'react-hook-form'

import { yupResolver } from '@hookform/resolvers/yup'

import * as yup from 'yup'

import { useNavigation } from '@react-navigation/native'

import { AuthNavigatorRoutesProps } from '@routes/auth.routes'

import { Input } from '@components/Input'

import { useAuth } from '@hooks/useAuth'

import { AppError } from '@utils/AppError'

import IakiPng from '@assets/logoiaki.png'
import clubePng from '@assets/cashbacks.png'

type FormDataProps = {
  email: string
  password: string
}

const signInSchema = yup.object({
  email: yup
    .string()
    .required('Informe o email')
    .email('Informe um e-mail válido'),

  password: yup
    .string()
    .required('Informe a senha')
    .min(6, 'Estão faltando caracteres!'),
})

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()

  const navigation = useNavigation<AuthNavigatorRoutesProps>()

  const {
    control,
    handleSubmit,

    formState: { errors },
  } = useForm<FormDataProps>({
    resolver: yupResolver(signInSchema),

    defaultValues: {
      email: '',
      password: '',
    },
  })

  /* ==============================
     CADASTRO
  ============================== */

  function handleNewAccount() {
    if (isLoading) {
      return
    }

    navigation.navigate('signup')
  }

  /* ==============================
     RECUPERAR SENHA
  ============================== */

  function handleForgotPassword() {
    if (isLoading) {
      return
    }

    navigation.navigate('forgotPassword')
  }

  /* ==============================
     LOGIN
  ============================== */

  async function handleSignIn({ email, password }: FormDataProps) {
    if (isLoading) {
      return
    }

    try {
      setIsLoading(true)

      const normalizedEmail = email.trim().toLowerCase()

      console.log('[SignIn] Iniciando login', {
        email: normalizedEmail,
      })

      /*
       * A SignIn deve apenas autenticar.
       *
       * Depois que o AuthContext atualizar
       * o usuário, o Root Navigator decide
       * automaticamente entre:
       *
       * redirect
       * selectCity
       * appRoutes
       */
      await signIn(normalizedEmail, password)

      console.log('[SignIn] Login concluído')

      /*
       * NÃO navegar manualmente aqui.
       *
       * NÃO fazer:
       *
       * navigation.navigate('home')
       *
       * nem consultar:
       *
       * /users/:id/location
       */
    } catch (error: any) {
      console.error('[SignIn] Erro no login:', {
        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,

        url: error?.config?.url,
      })

      let message =
        'Não foi possível entrar. Verifique seus dados e tente novamente.'

      if (error?.response?.data?.message) {
        message = error.response.data.message
      } else if (error instanceof AppError) {
        message = error.message
      } else if (
        error?.code === 'ERR_NETWORK' ||
        error?.message === 'Network Error'
      ) {
        message = 'Falha na conexão. Verifique sua internet e tente novamente.'
      }

      /*
       * Alerta nativo.
       *
       * Evita usar Toast/overlay do
       * NativeBase durante o fluxo
       * crítico de autenticação.
       */
      Alert.alert('Não foi possível entrar', message)
    } finally {
      setIsLoading(false)
    }
  }

  /* ==============================
     TELA
  ============================== */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGEM SUPERIOR */}

        <View style={styles.topImageContainer}>
          <Image
            style={styles.topImage}
            source={clubePng}
            resizeMode="contain"
            fadeDuration={0}
          />
        </View>

        {/* FORMULÁRIO */}

        <View style={styles.formContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Clube de vantagens</Text>
          </View>

          {/* E-MAIL */}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={onChange}
                value={value}
                editable={!isLoading}
                errorMessage={errors.email?.message}
              />
            )}
          />

          {/* SENHA */}

          <View style={styles.passwordWrapper}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Senha"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  placeholderTextColor="#999999"
                  onChangeText={onChange}
                  value={value}
                  editable={!isLoading}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(handleSignIn)}
                />
              )}
            />

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowPassword((previous) => !previous)}
              disabled={isLoading}
              activeOpacity={0.7}
              accessibilityLabel={
                showPassword ? 'Ocultar senha' : 'Mostrar senha'
              }
            >
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#999999"
              />
            </TouchableOpacity>
          </View>

          {errors.password?.message && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}

          {/* ESQUECI SENHA */}

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* ENTRAR */}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(handleSignIn)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={[styles.buttonText, styles.loadingText]}>
                  Entrando...
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          {/* CADASTRO */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>

            <TouchableOpacity
              onPress={handleNewAccount}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.link}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>

          {/* LOGO */}

          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              source={IakiPng}
              resizeMode="contain"
              fadeDuration={0}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollViewContent: {
    flexGrow: 1,

    justifyContent: 'center',

    paddingHorizontal: 20,

    paddingVertical: 20,
  },

  topImageContainer: {
    alignItems: 'center',

    justifyContent: 'center',

    marginHorizontal: -4,

    marginBottom: -2,

    backgroundColor: '#E5E7EB',

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    overflow: 'hidden',
  },

  topImage: {
    height: 220,
    width: 300,
  },

  formContainer: {
    backgroundColor: '#FFFFFF',

    borderRadius: 10,

    padding: 10,

    elevation: 4,
  },

  headerContainer: {
    alignItems: 'center',
  },

  header: {
    fontSize: 18,

    fontWeight: '700',

    marginVertical: 10,

    color: '#333333',

    textAlign: 'center',
  },

  passwordWrapper: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F0F0F0',

    borderRadius: 8,

    paddingHorizontal: 10,

    marginTop: 10,
  },

  passwordInput: {
    flex: 1,

    height: 50,

    fontSize: 16,

    color: '#333333',
  },

  iconButton: {
    paddingHorizontal: 10,

    paddingVertical: 8,
  },

  errorText: {
    color: '#DC2626',

    fontSize: 12,

    marginTop: 5,

    marginLeft: 4,
  },

  forgotPasswordContainer: {
    alignSelf: 'flex-end',

    paddingVertical: 10,

    paddingHorizontal: 4,
  },

  forgotPasswordText: {
    fontSize: 14,

    color: '#E1093F',

    fontWeight: '600',
  },

  button: {
    minHeight: 50,

    backgroundColor: '#4CAF50',

    borderRadius: 5,

    marginTop: 8,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 16,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',

    fontWeight: '700',

    fontSize: 16,
  },

  loadingRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  loadingText: {
    marginLeft: 8,
  },

  footer: {
    marginTop: 20,

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',
  },

  footerText: {
    fontSize: 16,

    color: '#555555',
  },

  link: {
    fontSize: 16,

    color: '#E1093F',

    fontWeight: '700',

    marginLeft: 5,
  },

  logoContainer: {
    alignItems: 'center',

    marginTop: 8,
  },

  logo: {
    height: 80,
    width: 124,
  },
})
