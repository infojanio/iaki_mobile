import React, { useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

import { Feather } from '@expo/vector-icons'

import { Controller, useForm } from 'react-hook-form'

import { yupResolver } from '@hookform/resolvers/yup'

import * as yup from 'yup'

import { useNavigation } from '@react-navigation/native'

import { AuthNavigatorRoutesProps } from '@routes/auth.routes'

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

  /* =====================================
     CADASTRO
  ===================================== */

  function handleNewAccount() {
    if (isLoading) {
      return
    }

    navigation.navigate('signup')
  }

  /* =====================================
     RECUPERAR SENHA
  ===================================== */

  function handleForgotPassword() {
    if (isLoading) {
      return
    }

    navigation.navigate('forgotPassword')
  }

  /* =====================================
     LOGIN
  ===================================== */

  async function handleSignIn({ email, password }: FormDataProps) {
    if (isLoading) {
      return
    }

    try {
      setIsLoading(true)

      const normalizedEmail = email.trim().toLowerCase()

      await signIn(normalizedEmail, password)

      /*
       * Não navegar manualmente.
       *
       * O AuthContext atualiza o usuário
       * e o Root Navigator decide entre
       * seleção de cidade e app.
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

      Alert.alert('Não foi possível entrar', message)
    } finally {
      setIsLoading(false)
    }
  }

  /* =====================================
     TELA
  ===================================== */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* =================================
                IMAGEM PRINCIPAL
            ================================= */}

            <View style={styles.heroContainer}>
              <Image
                source={clubePng}
                style={styles.heroImage}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>

            {/* =================================
                FORMULÁRIO
            ================================= */}

            <View style={styles.formCard}>
              <View style={styles.header}>
                <Text style={styles.title}>Bem-vindo ao Clube IAki</Text>

                <Text style={styles.subtitle}>
                  Entre para acessar vantagens, pontos e ofertas das suas lojas
                  favoritas.
                </Text>
              </View>

              {/* =================================
                  E-MAIL
              ================================= */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-mail</Text>

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <View
                      style={[
                        styles.inputContainer,

                        errors.email?.message && styles.inputError,
                      ]}
                    >
                      <Feather name="mail" size={19} color="#777777" />

                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        editable={!isLoading}
                        placeholder="seuemail@exemplo.com"
                        placeholderTextColor="#999999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        returnKeyType="next"
                        style={styles.input}
                      />
                    </View>
                  )}
                />

                {errors.email?.message ? (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                ) : null}
              </View>

              {/* =================================
                  SENHA
              ================================= */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Senha</Text>

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <View
                      style={[
                        styles.inputContainer,

                        errors.password?.message && styles.inputError,
                      ]}
                    >
                      <Feather name="lock" size={19} color="#777777" />

                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        editable={!isLoading}
                        placeholder="Digite sua senha"
                        placeholderTextColor="#999999"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(handleSignIn)}
                        style={styles.input}
                      />

                      <Pressable
                        disabled={isLoading}
                        onPress={() => setShowPassword((previous) => !previous)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                        style={({ pressed }) => [
                          styles.eyeButton,

                          pressed && styles.pressed,
                        ]}
                      >
                        <Feather
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={21}
                          color="#777777"
                        />
                      </Pressable>
                    </View>
                  )}
                />

                {errors.password?.message ? (
                  <Text style={styles.errorText}>
                    {errors.password.message}
                  </Text>
                ) : null}
              </View>

              {/* =================================
                  ESQUECI SENHA
              ================================= */}

              <Pressable
                onPress={handleForgotPassword}
                disabled={isLoading}
                hitSlop={5}
                style={({ pressed }) => [
                  styles.forgotButton,

                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </Pressable>

              {/* =================================
                  ENTRAR
              ================================= */}

              <Pressable
                onPress={handleSubmit(handleSignIn)}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.loginButton,

                  isLoading && styles.loginButtonDisabled,

                  pressed && !isLoading && styles.loginButtonPressed,
                ]}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />

                    <Text style={styles.loginButtonText}>Entrando...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Entrar</Text>

                    <Feather name="arrow-right" size={20} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              {/* =================================
                  CADASTRO
              ================================= */}

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Ainda não tem uma conta?</Text>

                <Pressable
                  onPress={handleNewAccount}
                  disabled={isLoading}
                  hitSlop={5}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.signupLink}>Cadastre-se</Text>
                </Pressable>
              </View>
            </View>

            {/* =================================
                LOGO
            ================================= */}

            <View style={styles.logoContainer}>
              <Image
                source={IakiPng}
                style={styles.logo}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  /* ==================================
       BASE
    ================================== */

  safeArea: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,

    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 20,

    paddingTop: 10,

    paddingBottom: 20,

    justifyContent: 'center',
  },

  content: {
    width: '100%',

    maxWidth: 480,

    alignSelf: 'center',
  },

  /* ==================================
       HERO
    ================================== */

  heroContainer: {
    height: 190,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 0,

    borderRadius: 24,

    overflow: 'hidden',

    backgroundColor: '#FFFFFF',
  },

  heroImage: {
    width: '100%',

    height: '100%',
  },

  /* ==================================
       FORM CARD
    ================================== */

  formCard: {
    paddingHorizontal: 18,

    paddingTop: 22,

    paddingBottom: 20,

    borderRadius: 22,

    borderWidth: 1,

    borderColor: '#EEEEEE',

    backgroundColor: '#FFFFFF',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,

    shadowRadius: 10,

    elevation: 3,
  },

  /* ==================================
       HEADER
    ================================== */

  header: {
    alignItems: 'center',

    marginBottom: 22,
  },

  title: {
    fontSize: 21,

    lineHeight: 26,

    fontWeight: '700',

    color: '#333333',

    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 310,

    marginTop: 7,

    fontSize: 13,

    lineHeight: 19,

    color: '#777777',

    textAlign: 'center',
  },

  /* ==================================
       CAMPOS
    ================================== */

  fieldGroup: {
    marginBottom: 14,
  },

  label: {
    marginLeft: 2,

    marginBottom: 7,

    fontSize: 13,

    fontWeight: '600',

    color: '#555555',
  },

  inputContainer: {
    minHeight: 52,

    paddingHorizontal: 14,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#E1E1E1',

    borderRadius: 13,

    backgroundColor: '#F0F0F0',
  },

  inputError: {
    borderColor: '#DC2626',
  },

  input: {
    flex: 1,

    minWidth: 0,

    height: 50,

    marginLeft: 10,

    paddingVertical: 0,

    fontSize: 15,

    color: '#333333',
  },

  eyeButton: {
    width: 38,

    height: 44,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: -7,
  },

  errorText: {
    marginTop: 5,

    marginLeft: 3,

    fontSize: 12,

    color: '#DC2626',
  },

  /* ==================================
       ESQUECI SENHA
    ================================== */

  forgotButton: {
    alignSelf: 'flex-end',

    minHeight: 34,

    marginTop: -3,

    marginBottom: 10,

    justifyContent: 'center',
  },

  forgotText: {
    fontSize: 13,

    fontWeight: '600',

    color: '#E1093F',
  },

  /* ==================================
       BOTÃO
    ================================== */

  loginButton: {
    minHeight: 54,

    marginTop: 4,

    paddingHorizontal: 18,

    borderRadius: 14,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 9,

    backgroundColor: '#4CAF50',

    shadowColor: '#4CAF50',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.22,

    shadowRadius: 6,

    elevation: 3,
  },

  loginButtonPressed: {
    opacity: 0.88,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    fontSize: 16,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  loadingRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 9,
  },

  /* ==================================
       CADASTRO
    ================================== */

  signupContainer: {
    marginTop: 20,

    flexDirection: 'row',

    flexWrap: 'wrap',

    alignItems: 'center',

    justifyContent: 'center',
  },

  signupText: {
    fontSize: 14,

    color: '#555555',
  },

  signupLink: {
    marginLeft: 5,

    fontSize: 14,

    fontWeight: '700',

    color: '#E1093F',
  },

  /* ==================================
       LOGO
    ================================== */

  logoContainer: {
    height: 70,

    marginTop: 8,

    alignItems: 'center',

    justifyContent: 'center',
  },

  logo: {
    width: 116,

    height: 62,
  },

  pressed: {
    opacity: 0.6,
  },
})
