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
  Alert,
} from 'react-native'
import { Input } from '@components/Input' // Seu componente Input estilizado
import MarketPng from '@assets/rahdar.png'
import IakiPng from '@assets/logoiaki.png'
import clubePng from '@assets/cashbacks.png'
import { useNavigation } from '@react-navigation/native'
import { AuthNavigatorRoutesProps } from '@routes/auth.routes'
import Feather from 'react-native-vector-icons/Feather'
import { useAuth } from '@hooks/useAuth'
import { AppError } from '@utils/AppError'
import { Center, useToast, VStack } from 'native-base'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { api } from '@services/api'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

type FormDataProps = {
  email: string
  password: string
}

const signInSchema = yup.object({
  email: yup.string().required('Informe o email'),
  password: yup
    .string()
    .required('Informe a senha')
    .min(6, 'Estão faltando caracteres!'),
})

export function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>('')

  const { signIn } = useAuth()
  const navigation = useNavigation<AuthNavigatorRoutesProps>()
  const navigationApp = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  //criando controle para o formulário
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataProps>({
    resolver: yupResolver(signInSchema),
  })

  function handleNewAccount() {
    navigation.navigate('signup')
  }

  async function handleSignIn({ email, password }: FormDataProps) {
    try {
      setIsLoading(true)

      // 1. Faz login e obtém o usuário autenticado
      const user = await signIn(email, password)

      // 2. Verifica se a localização existe
      const response = await api.get(`/users/${user.id}/location`)

      if (response?.data?.latitude && response?.data?.longitude) {
        navigationApp.navigate('home', { userId: user.id }) // Já tem localização, vai para Home
      } else {
        navigationApp.navigate('localization', { userId: user.id }) // Redireciona para Location
      }
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível entrar. Tente novamente mais tarde!'

      toast.show({
        title,
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
          <Center
            ml={-4}
            mr={-4}
            bg={'gray.200'}
            borderTopRadius={'3xl'}
            mb={-2}
          >
            <Image
              style={{ height: 220, width: 300, marginBottom: 2 }}
              alt="clube"
              source={clubePng}
              borderRadius={1}
            />
          </Center>

          <View style={styles.formContainer}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.header}>Clube de vantagens</Text>
              <Image
                style={{ height: 30, width: 160, marginBottom: 16 }}
                alt="Logo Rahdar"
                source={MarketPng}
                borderRadius={1}
              />
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.email?.message}
                />
              )}
            />

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
                  />
                )}
              />

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit(handleSignIn)}
            >
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>
              <TouchableOpacity onPress={handleNewAccount}>
                <Text style={styles.link}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Image
                style={{ height: 60, width: 104 }}
                alt="Logo IAki"
                source={IakiPng}
                borderRadius={1}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
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
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
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
    marginBottom: 8,
  },
})
