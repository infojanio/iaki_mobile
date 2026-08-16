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

import { Input } from '@components/Input'

import IakiPng from '@assets/logoiaki.png'
import clubePng from '@assets/cashbacks.png'

import { useNavigation } from '@react-navigation/native'

import { AuthNavigatorRoutesProps } from '@routes/auth.routes'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { Feather } from '@expo/vector-icons'

import { useAuth } from '@hooks/useAuth'

import { AppError } from '@utils/AppError'

import { Center, useToast, VStack } from 'native-base'

import { useForm, Controller } from 'react-hook-form'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { api } from '@services/api'

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

  const navigationApp = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

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

  function handleNewAccount() {
    navigation.navigate('signup')
  }

  function handleForgotPassword() {
    navigation.navigate('forgotPassword')
  }

  async function handleSignIn({ email, password }: FormDataProps) {
    try {
      setIsLoading(true)

      const normalizedEmail = email.trim().toLowerCase()

      // 🔐 Login
      const user = await signIn(normalizedEmail, password)

      // 📍 Verifica localização
      const response = await api.get(`/users/${user.id}/location`)

      if (response?.data?.latitude && response?.data?.longitude) {
        navigationApp.navigate('home')
      } else {
        // navigationApp.navigate('localization', {
        //   userId: user.id,
        // })
      }
    } catch (error: any) {
      let message = 'Não foi possível entrar. Tente novamente mais tarde!'

      if (error?.response?.data?.message) {
        message = error.response.data.message
      } else if (error instanceof AppError) {
        message = error.message
      }

      toast.show({
        title: message,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={30}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <VStack>
          <Center ml={-4} mr={-4} bg="gray.200" borderTopRadius="3xl" mb={-2}>
            <Image
              style={{
                height: 220,
                width: 300,
              }}
              source={clubePng}
              resizeMode="contain"
            />
          </Center>

          <View style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.header}>Clube de vantagens</Text>
            </View>

            {/* E-mail */}
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
                  errorMessage={errors.email?.message}
                />
              )}
            />

            {/* Senha */}
            <View style={styles.passwordWrapper}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Senha"
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                    placeholderTextColor="#999"
                    onChangeText={onChange}
                    value={value}
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
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {errors.password?.message && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}

            {/* Esqueci minha senha */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            {/* Entrar */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(handleSignIn)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {/* Cadastro */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>

              <TouchableOpacity onPress={handleNewAccount}>
                <Text style={styles.link}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Image
                style={{
                  height: 80,
                  width: 124,
                }}
                source={IakiPng}
                resizeMode="contain"
              />
            </View>
          </View>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
  },

  headerContainer: {
    alignItems: 'center',
  },

  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
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
    color: '#333',
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
    color: '#e1093f',
    fontWeight: '600',
  },

  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 8,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },

  footerText: {
    fontSize: 16,
    color: '#555',
  },

  link: {
    fontSize: 16,
    color: '#e1093f',
    fontWeight: 'bold',
    marginLeft: 5,
  },
})
