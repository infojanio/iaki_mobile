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
  View,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

import { Feather, MaterialIcons } from '@expo/vector-icons'

import { useNavigation } from '@react-navigation/native'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Controller, FieldErrors, useForm } from 'react-hook-form'

import * as yup from 'yup'

import { yupResolver } from '@hookform/resolvers/yup'

import * as ImagePicker from 'expo-image-picker'

import { Input } from '@components/Input'

import { AppError } from '@utils/AppError'

import { useAuth } from '@hooks/useAuth'

import { api } from '@services/api'

import isValidCPF from '@utils/isValidCPF'

import type { AuthRoutesParams } from '@routes/auth.routes'

/* ======================================================
   CLOUDINARY
====================================================== */

const CLOUDINARY_CLOUD_NAME = 'dwqr47iii'

const CLOUDINARY_UPLOAD_PRESET = 'avatars'

const CLOUDINARY_FOLDER = 'avatars'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/* ======================================================
   FORMATAÇÃO
====================================================== */

function formatPhone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1')
}

function formatCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

function formatCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}

/* ======================================================
   FORM
====================================================== */

type FormDataProps = {
  name: string

  email: string

  phone: string

  cpf: string

  password: string

  password_confirm: string

  street: string

  /*
   * Mantido como state para preservar
   * o campo utilizado atualmente
   * pelo backend.
   *
   * Na tela representa Cidade.
   */
  state: string

  postalCode: string
}

/* ======================================================
   VALIDAÇÃO
====================================================== */

const signUpSchema = yup
  .object({
    name: yup.string().trim().required('Informe o nome'),

    email: yup
      .string()
      .trim()
      .required('Informe o e-mail')
      .email('Informe um e-mail válido'),

    phone: yup.string().required('Informe o telefone'),

    cpf: yup
      .string()
      .required('Informe o CPF')
      .test('cpf-valido', 'CPF inválido', (value) => isValidCPF(value || '')),

    password: yup
      .string()
      .required('Informe a senha')
      .min(6, 'A senha deve conter no mínimo 6 caracteres'),

    password_confirm: yup
      .string()
      .required('Confirme a senha')
      .oneOf([yup.ref('password')], 'As senhas não conferem'),

    street: yup.string().trim().required('Informe a rua'),

    state: yup.string().trim().required('Informe a cidade'),

    postalCode: yup.string().required('Informe o CEP'),
  })
  .required()

/* ======================================================
   ORDEM DOS CAMPOS
====================================================== */

const fieldOrder: Array<keyof FormDataProps> = [
  'name',
  'email',
  'phone',
  'cpf',
  'password',
  'password_confirm',
  'street',
  'state',
  'postalCode',
]

/* ======================================================
   CLOUDINARY
====================================================== */

function inferFileMeta(asset: ImagePicker.ImagePickerAsset) {
  const filename =
    asset.fileName || asset.uri.split('/').pop() || `avatar-${Date.now()}.jpg`

  let mime = asset.mimeType

  if (!mime) {
    const extension = (filename.split('.').pop() || '').toLowerCase()

    if (extension === 'png') {
      mime = 'image/png'
    } else if (extension === 'webp') {
      mime = 'image/webp'
    } else {
      mime = 'image/jpeg'
    }
  }

  return {
    filename,
    mime,
  }
}

async function uploadAvatarToCloudinary(asset: ImagePicker.ImagePickerAsset) {
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
    throw new Error('Escolha uma imagem de até 5 MB.')
  }

  const { filename, mime } = inferFileMeta(asset)

  const form = new FormData()

  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  if (CLOUDINARY_FOLDER) {
    form.append('folder', CLOUDINARY_FOLDER)
  }

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri)

    const blob = await response.blob()

    if (blob.size > MAX_IMAGE_SIZE) {
      throw new Error('Escolha uma imagem de até 5 MB.')
    }

    const file = new File([blob], filename, {
      type: mime,
    })

    form.append('file', file)
  } else {
    form.append('file', {
      uri: asset.uri,

      name: filename,

      type: mime,
    } as any)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',

      body: form,
    },
  )

  if (!response.ok) {
    throw new Error('Não foi possível enviar a foto.')
  }

  const data = (await response.json()) as {
    secure_url?: string
  }

  if (!data.secure_url) {
    throw new Error('Não foi possível obter a imagem enviada.')
  }

  return data.secure_url
}

/* ======================================================
   NAVEGAÇÃO
====================================================== */

type SignUpNavigationProps = NativeStackNavigationProp<
  AuthRoutesParams,
  'signup'
>

/* ======================================================
   COMPONENTE
====================================================== */

export function SignUp() {
  const navigation = useNavigation<SignUpNavigationProps>()

  const { signIn } = useAuth()

  const [isLoading, setIsLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [avatarUploading, setAvatarUploading] = useState(false)

  /* ====================================================
     FORM
  ==================================================== */

  const { control, handleSubmit, setFocus } = useForm<FormDataProps>({
    resolver: yupResolver(signUpSchema),

    defaultValues: {
      name: '',

      email: '',

      phone: '',

      cpf: '',

      password: '',

      password_confirm: '',

      street: '',

      state: '',

      postalCode: '',
    },

    mode: 'onSubmit',

    reValidateMode: 'onChange',
  })

  /* ====================================================
     FORM INVÁLIDO
  ==================================================== */

  function handleInvalidForm(formErrors: FieldErrors<FormDataProps>) {
    const firstErrorField = fieldOrder.find((field) =>
      Boolean(formErrors[field]),
    )

    if (!firstErrorField) {
      return
    }

    /*
     * Não mostramos Alert ou Toast aqui.
     *
     * Cada campo mostra sua própria
     * mensagem de validação.
     */
    requestAnimationFrame(() => {
      setFocus(firstErrorField)
    })
  }

  /* ====================================================
     CADASTRAR
  ==================================================== */

  async function handleSignUp(data: FormDataProps) {
    if (isLoading || avatarUploading) {
      return
    }

    try {
      setIsLoading(true)

      const normalizedEmail = data.email.trim().toLowerCase()

      const payload = {
        ...data,

        name: data.name.trim(),

        email: normalizedEmail,

        street: data.street.trim(),

        state: data.state.trim(),

        avatar: avatarUrl ?? 'avatar.jpg',

        role: 'USER',
      }

      /*
       * Cria o usuário.
       */
      await api.post('/users', payload)

      /*
       * Faz login após o cadastro.
       *
       * Não navegamos manualmente.
       * O fluxo de autenticação decide
       * qual será a próxima rota.
       */
      await signIn(normalizedEmail, data.password)
    } catch (error: any) {
      console.error('[SignUp] Erro ao criar conta:', {
        message: error?.message,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      let message = 'Não foi possível criar a conta. Tente novamente.'

      if (typeof error?.response?.data?.message === 'string') {
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
       * Alert apenas para erros reais
       * da API/conexão.
       *
       * Erros de campo continuam
       * aparecendo abaixo dos Inputs.
       */
      Alert.alert('Não foi possível criar a conta', message)
    } finally {
      setIsLoading(false)
    }
  }

  /* ====================================================
     AVATAR
  ==================================================== */

  async function handlePickAvatar() {
    if (avatarUploading || isLoading) {
      return
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso às suas fotos para escolher uma imagem de perfil.',
        )

        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.85,
      })

      if (result.canceled) {
        return
      }

      const asset = result.assets?.[0]

      if (!asset?.uri) {
        return
      }

      setAvatarUploading(true)

      const url = await uploadAvatarToCloudinary(asset)

      setAvatarUrl(url)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar sua foto.'

      Alert.alert('Foto de perfil', message)
    } finally {
      setAvatarUploading(false)
    }
  }

  /* ====================================================
     TELA
  ==================================================== */

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
          {/* =================================
              CABEÇALHO
          ================================= */}

          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={10}
              style={({ pressed }) => [
                styles.backButton,

                pressed && styles.pressed,
              ]}
            >
              <Feather name="chevron-left" size={26} color="#374151" />
            </Pressable>

            <View style={styles.headerContent}>
              <Text style={styles.title}>Criar conta</Text>

              <Text style={styles.subtitle}>
                Cadastre seus dados para começar a aproveitar o Clube IAki.
              </Text>
            </View>
          </View>

          {/* =================================
              AVATAR
          ================================= */}

          <View style={styles.avatarSection}>
            <Pressable
              onPress={handlePickAvatar}
              disabled={avatarUploading || isLoading}
              style={({ pressed }) => [
                styles.avatarButton,

                pressed && styles.pressed,
              ]}
            >
              <View style={styles.avatar}>
                {avatarUploading ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : avatarUrl ? (
                  <Image
                    source={{
                      uri: avatarUrl,
                    }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons name="person" size={42} color="#9CA3AF" />
                )}
              </View>

              <View style={styles.cameraButton}>
                <Feather name="camera" size={15} color="#FFFFFF" />
              </View>
            </Pressable>

            <Text style={styles.avatarText}>
              {avatarUploading
                ? 'Enviando foto...'
                : avatarUrl
                  ? 'Foto adicionada'
                  : 'Adicionar foto de perfil'}
            </Text>

            <Text style={styles.avatarOptional}>Opcional</Text>
          </View>

          {/* =================================
              DADOS PESSOAIS
          ================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados pessoais</Text>

            <Controller
              control={control}
              name="name"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="Nome completo"
                  placeholder="Digite seu nome"
                  leftIcon={<Feather name="user" size={19} color="#6B7280" />}
                  autoComplete="name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('email')}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="E-mail"
                  placeholder="seuemail@exemplo.com"
                  leftIcon={<Feather name="mail" size={19} color="#6B7280" />}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('phone')}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="Telefone"
                  placeholder="(00) 00000-0000"
                  leftIcon={<Feather name="phone" size={19} color="#6B7280" />}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatPhone(text))}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('cpf')}
                />
              )}
            />

            <Controller
              control={control}
              name="cpf"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="CPF"
                  placeholder="000.000.000-00"
                  leftIcon={
                    <MaterialIcons name="badge" size={20} color="#6B7280" />
                  }
                  keyboardType="numeric"
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatCPF(text))}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('password')}
                />
              )}
            />
          </View>

          {/* =================================
              SEGURANÇA
          ================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Segurança</Text>

            <Controller
              control={control}
              name="password"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="Senha"
                  placeholder="Mínimo de 6 caracteres"
                  leftIcon={<Feather name="lock" size={19} color="#6B7280" />}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('password_confirm')}
                  rightIcon={
                    <Pressable
                      onPress={() => setShowPassword((current) => !current)}
                      hitSlop={8}
                      style={styles.eyeButton}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#6B7280"
                      />
                    </Pressable>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password_confirm"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="Confirmar senha"
                  placeholder="Digite a senha novamente"
                  leftIcon={<Feather name="lock" size={19} color="#6B7280" />}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('street')}
                  rightIcon={
                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      hitSlop={8}
                      style={styles.eyeButton}
                    >
                      <Feather
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#6B7280"
                      />
                    </Pressable>
                  }
                />
              )}
            />
          </View>

          {/* =================================
              ENDEREÇO
          ================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>

            <Controller
              control={control}
              name="street"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="Rua"
                  placeholder="Rua ou avenida"
                  leftIcon={
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#6B7280"
                    />
                  }
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('state')}
                />
              )}
            />

            <Controller
              control={control}
              name="state"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="Cidade"
                  placeholder="Digite sua cidade"
                  leftIcon={
                    <MaterialIcons
                      name="location-city"
                      size={20}
                      color="#6B7280"
                    />
                  }
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('postalCode')}
                />
              )}
            />

            <Controller
              control={control}
              name="postalCode"
              render={({
                field: { onChange, onBlur, value, ref },

                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  label="CEP"
                  placeholder="00000-000"
                  leftIcon={
                    <MaterialIcons
                      name="local-post-office"
                      size={20}
                      color="#6B7280"
                    />
                  }
                  keyboardType="numeric"
                  autoComplete="postal-code"
                  returnKeyType="done"
                  editable={!isLoading}
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatCEP(text))}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={handleSubmit(
                    handleSignUp,
                    handleInvalidForm,
                  )}
                />
              )}
            />
          </View>

          {/* =================================
              CADASTRAR
          ================================= */}

          <Pressable
            onPress={handleSubmit(handleSignUp, handleInvalidForm)}
            disabled={isLoading || avatarUploading}
            style={({ pressed }) => [
              styles.submitButton,

              (isLoading || avatarUploading) && styles.submitButtonDisabled,

              pressed &&
                !isLoading &&
                !avatarUploading &&
                styles.submitButtonPressed,
            ]}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={styles.submitButtonText}>Criando conta...</Text>
              </View>
            ) : avatarUploading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={styles.submitButtonText}>Enviando foto...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Criar conta</Text>

                <Feather name="arrow-right" size={20} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          {/* =================================
              TERMOS
          ================================= */}

          <Text style={styles.legalText}>
            Ao criar a conta, você concorda com nossos{' '}
            <Text
              style={styles.legalLink}
              onPress={() => navigation.navigate('terms')}
            >
              Termos de Uso
            </Text>
            {' e nossa '}
            <Text
              style={styles.legalLink}
              onPress={() => navigation.navigate('privacy')}
            >
              Política de Privacidade
            </Text>
            .
          </Text>

          {/* =================================
              JÁ POSSUI CONTA
          ================================= */}

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já possui uma conta?</Text>

            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Entrar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/* ======================================================
   ESTILOS
====================================================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#F8FAFC',
  },

  container: {
    flex: 1,

    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    flexGrow: 1,

    width: '100%',

    maxWidth: 520,

    alignSelf: 'center',

    paddingHorizontal: 20,

    paddingTop: 8,

    paddingBottom: 36,
  },

  /* ==================================
       HEADER
    ================================== */

  header: {
    marginBottom: 12,
  },

  backButton: {
    width: 44,

    height: 44,

    marginLeft: -8,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 22,
  },

  headerContent: {
    marginTop: 5,
  },

  title: {
    fontSize: 28,

    lineHeight: 34,

    fontWeight: '800',

    letterSpacing: -0.4,

    color: '#111827',
  },

  subtitle: {
    maxWidth: 420,

    marginTop: 6,

    fontSize: 14,

    lineHeight: 21,

    color: '#6B7280',
  },

  /* ==================================
       AVATAR
    ================================== */

  avatarSection: {
    alignItems: 'center',

    marginTop: 12,

    marginBottom: 26,
  },

  avatarButton: {
    position: 'relative',
  },

  avatar: {
    width: 104,

    height: 104,

    borderRadius: 52,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    backgroundColor: '#E5E7EB',

    borderWidth: 3,

    borderColor: '#FFFFFF',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.1,

    shadowRadius: 8,

    elevation: 3,
  },

  avatarImage: {
    width: '100%',

    height: '100%',
  },

  cameraButton: {
    position: 'absolute',

    right: 0,

    bottom: 1,

    width: 32,

    height: 32,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#2563EB',

    borderWidth: 2,

    borderColor: '#FFFFFF',
  },

  avatarText: {
    marginTop: 10,

    fontSize: 13,

    fontWeight: '600',

    color: '#374151',
  },

  avatarOptional: {
    marginTop: 2,

    fontSize: 11,

    color: '#9CA3AF',
  },

  /* ==================================
       SEÇÕES
    ================================== */

  section: {
    gap: 15,

    marginBottom: 26,

    padding: 16,

    borderRadius: 18,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5E7EB',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.035,

    shadowRadius: 6,

    elevation: 1,
  },

  sectionTitle: {
    marginBottom: 1,

    fontSize: 15,

    lineHeight: 20,

    fontWeight: '700',

    color: '#1F2937',
  },

  /* ==================================
       SENHA
    ================================== */

  eyeButton: {
    width: 36,

    height: 44,

    alignItems: 'center',

    justifyContent: 'center',
  },

  /* ==================================
       BOTÃO
    ================================== */

  submitButton: {
    minHeight: 54,

    paddingHorizontal: 18,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 9,

    borderRadius: 14,

    backgroundColor: '#4CAF50',

    shadowColor: '#4CAF50',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.2,

    shadowRadius: 6,

    elevation: 3,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonPressed: {
    opacity: 0.88,
  },

  submitButtonText: {
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
       LEGAL
    ================================== */

  legalText: {
    marginTop: 20,

    paddingHorizontal: 8,

    fontSize: 12,

    lineHeight: 18,

    textAlign: 'center',

    color: '#6B7280',
  },

  legalLink: {
    fontWeight: '700',

    color: '#2563EB',
  },

  /* ==================================
       LOGIN
    ================================== */

  loginRow: {
    marginTop: 20,

    flexDirection: 'row',

    flexWrap: 'wrap',

    alignItems: 'center',

    justifyContent: 'center',
  },

  loginText: {
    fontSize: 14,

    color: '#6B7280',
  },

  loginLink: {
    marginLeft: 5,

    fontSize: 14,

    fontWeight: '700',

    color: '#E1093F',
  },

  pressed: {
    opacity: 0.65,
  },
})
