import React, { useState } from 'react'

import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'

import { useNavigation } from '@react-navigation/native'

import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Controller, useForm } from 'react-hook-form'

import type { FieldErrors } from 'react-hook-form'

import * as yup from 'yup'

import { yupResolver } from '@hookform/resolvers/yup'

import * as ImagePicker from 'expo-image-picker'

import { VStack, Center, Text, Icon, IconButton, useToast } from 'native-base'

import { Feather, MaterialIcons } from '@expo/vector-icons'

import { Input } from '@components/Input'
import { Button } from '@components/Button'

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
}

function formatCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)
}

/* ======================================================
   FORMULÁRIO
====================================================== */

type FormDataProps = {
  name: string
  email: string
  phone: string
  cpf: string

  password: string
  password_confirm: string

  street: string

  /**
   * Mantido como "state" porque esse
   * é o campo atualmente utilizado
   * pelo backend/formulário.
   *
   * Na interface ele representa Cidade.
   */
  state: string

  postalCode: string
}

/* ======================================================
   VALIDAÇÃO
====================================================== */

const signUpSchema = yup
  .object({
    name: yup.string().required('Informe o nome'),

    email: yup.string().required('Informe o e-mail').email('E-mail inválido'),

    phone: yup.string().required('Informe o telefone'),

    cpf: yup
      .string()
      .required('CPF é obrigatório')
      .test('cpf-valido', 'CPF inválido', (value) => isValidCPF(value || '')),

    password: yup
      .string()
      .required('Informe a senha')
      .min(6, 'A senha deve conter no mínimo 6 dígitos'),

    password_confirm: yup
      .string()
      .oneOf([yup.ref('password')], 'A senha digitada não confere!')
      .required('Confirme a senha'),

    street: yup.string().required('Informe a rua'),

    state: yup.string().required('Informe a cidade'),

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
   CLOUDINARY HELPERS
====================================================== */

function inferFileMeta(asset: ImagePicker.ImagePickerAsset) {
  const filename =
    asset.fileName || asset.uri.split('/').pop() || `avatar-${Date.now()}.jpg`

  let mime = asset.mimeType

  if (!mime) {
    const ext = (filename.split('.').pop() || '').toLowerCase()

    if (ext === 'png') {
      mime = 'image/png'
    } else if (ext === 'webp') {
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
  const { filename, mime } = inferFileMeta(asset)

  const form = new FormData()

  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  if (CLOUDINARY_FOLDER) {
    form.append('folder', CLOUDINARY_FOLDER)
  }

  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri)

    const blob = await response.blob()

    const MAX_SIZE = 5 * 1024 * 1024

    if (blob.size > MAX_SIZE) {
      throw new Error('Imagem acima de 5MB.')
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
    const text = await response.text()

    throw new Error(`Falha no upload do avatar. ${response.status} - ${text}`)
  }

  const data = (await response.json()) as {
    secure_url?: string
  }

  if (!data.secure_url) {
    throw new Error('O Cloudinary não retornou a URL da imagem.')
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
  const [isLoading, setIsLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [avatarUploading, setAvatarUploading] = useState(false)

  const toast = useToast()

  const { signIn } = useAuth()

  const navigation = useNavigation<SignUpNavigationProps>()

  /* ====================================================
     REACT HOOK FORM
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
  })

  /* ====================================================
     ERROS DO FORMULÁRIO
  ==================================================== */

  function handleInvalidForm(formErrors: FieldErrors<FormDataProps>) {
    const firstErrorField = fieldOrder.find((field) => formErrors[field])

    if (!firstErrorField) {
      return
    }

    /**
     * Foca automaticamente
     * no primeiro campo com erro.
     */
    setFocus(firstErrorField)

    const message = formErrors[firstErrorField]?.message

    toast.show({
      title:
        typeof message === 'string' ? message : 'Verifique os dados informados',

      placement: 'top',
      bgColor: 'red.500',
    })
  }

  /* ====================================================
     CADASTRAR
  ==================================================== */

  async function handleSignUp(data: FormDataProps) {
    if (isLoading) {
      return
    }

    try {
      setIsLoading(true)

      /**
       * Cria usuário.
       */
      await api.post('/users', {
        ...data,

        avatar: avatarUrl ?? 'avatar.jpg',

        role: 'USER',
      })

      /**
       * Faz login após
       * cadastro.
       *
       * Não navegamos manualmente.
       * O fluxo principal de rotas
       * reagirá ao usuário autenticado.
       */
      await signIn(data.email, data.password)
    } catch (error) {
      setIsLoading(false)

      const isAppError = error instanceof AppError

      const title = isAppError
        ? error.message
        : 'Não foi possível criar a conta. Tente novamente mais tarde!'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  /* ====================================================
     AVATAR
  ==================================================== */

  async function handlePickAvatar() {
    if (avatarUploading) {
      return
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      toast.show({
        title: 'Permissão necessária para acessar suas fotos.',

        placement: 'top',

        bgColor: 'red.500',
      })

      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],

      allowsEditing: true,

      aspect: [1, 1],

      quality: 0.9,
    })

    if (result.canceled) {
      return
    }

    const asset = result.assets?.[0]

    if (!asset?.uri) {
      return
    }

    try {
      setAvatarUploading(true)

      const url = await uploadAvatarToCloudinary(asset)

      setAvatarUrl(url)

      toast.show({
        title: 'Foto enviada!',

        placement: 'top',

        bgColor: 'emerald.600',
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar sua foto.'

      toast.show({
        title: message,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  /* ====================================================
     RENDER
  ==================================================== */

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{
        flex: 1,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <VStack flex={1} p={4} pb={12} space={2} bg="gray.50">
          {/* VOLTAR */}

          <IconButton
            borderRadius="full"
            variant="ghost"
            size="sm"
            icon={<Icon as={Feather} name="chevron-left" size="8" />}
            onPress={() => navigation.goBack()}
            alignSelf="flex-start"
          />

          {/* TÍTULO */}

          <Center>
            <Text fontSize="2xl" fontWeight="bold">
              Criar conta
            </Text>

            <Text fontSize="sm" color="gray.500" mt={1}>
              Preencha seus dados para continuar
            </Text>
          </Center>

          {/* AVATAR */}

          <Center mt={4} mb={2}>
            <TouchableOpacity
              onPress={handlePickAvatar}
              activeOpacity={0.8}
              disabled={avatarUploading}
            >
              <View
                style={{
                  width: 96,
                  height: 96,

                  borderRadius: 999,

                  backgroundColor: '#E5E7EB',

                  alignItems: 'center',

                  justifyContent: 'center',

                  overflow: 'hidden',
                }}
              >
                {avatarUploading ? (
                  <ActivityIndicator />
                ) : avatarUrl ? (
                  <Image
                    source={{
                      uri: avatarUrl,
                    }}
                    style={{
                      width: '100%',

                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <Icon
                    as={MaterialIcons}
                    name="person"
                    size={12}
                    color="gray.400"
                  />
                )}
              </View>
            </TouchableOpacity>

            <Text mt={2} color="gray.600" fontSize="xs">
              Toque para escolher uma foto
            </Text>
          </Center>

          {/* FORMULÁRIO */}

          <VStack space={4} mt={4}>
            {/* NOME */}

            <Controller
              control={control}
              name="name"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="Nome completo"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('email')}
                />
              )}
            />

            {/* EMAIL */}

            <Controller
              control={control}
              name="email"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('phone')}
                />
              )}
            />

            {/* TELEFONE */}

            <Controller
              control={control}
              name="phone"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="Telefone"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatPhone(text))}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('cpf')}
                />
              )}
            />

            {/* CPF */}

            <Controller
              control={control}
              name="cpf"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="CPF"
                  keyboardType="numeric"
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatCPF(text))}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('password')}
                />
              )}
            />

            {/* SENHA */}

            <Controller
              control={control}
              name="password"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="Senha"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('password_confirm')}
                  rightIcon={
                    <IconButton
                      icon={
                        <Icon
                          as={MaterialIcons}
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={5}
                        />
                      }
                      onPress={() => setShowPassword((current) => !current)}
                      variant="ghost"
                    />
                  }
                />
              )}
            />

            {/* CONFIRMAR SENHA */}

            <Controller
              control={control}
              name="password_confirm"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="Confirme a senha"
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('street')}
                  rightIcon={
                    <IconButton
                      icon={
                        <Icon
                          as={MaterialIcons}
                          name={
                            showConfirmPassword
                              ? 'visibility-off'
                              : 'visibility'
                          }
                          size={5}
                        />
                      }
                      onPress={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      variant="ghost"
                    />
                  }
                />
              )}
            />

            {/* RUA */}

            <Controller
              control={control}
              name="street"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="Rua"
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('state')}
                />
              )}
            />

            {/* CIDADE */}

            <Controller
              control={control}
              name="state"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="Cidade"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  onSubmitEditing={() => setFocus('postalCode')}
                />
              )}
            />

            {/* CEP */}

            <Controller
              control={control}
              name="postalCode"
              render={({
                field: { onChange, onBlur, value, ref },
                fieldState: { error },
              }) => (
                <Input
                  ref={ref}
                  placeholder="CEP"
                  keyboardType="numeric"
                  returnKeyType="done"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatCEP(text))}
                  value={value}
                  errorMessage={error?.message}
                />
              )}
            />
          </VStack>

          {/* CADASTRAR */}

          <Button
            title={avatarUploading ? 'Enviando foto...' : 'Cadastrar'}
            mt={8}
            isLoading={isLoading}
            onPress={handleSubmit(handleSignUp, handleInvalidForm)}
            isDisabled={avatarUploading || isLoading}
          />

          {/* TERMOS */}

          <Center mt={6}>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Ao criar a conta, você concorda com nossos
              {'\n'}
              <Text
                fontWeight="bold"
                color="blue.600"
                onPress={() => navigation.navigate('terms')}
              >
                Termos de Uso
              </Text>{' '}
              e nossa{' '}
              <Text
                fontWeight="bold"
                color="blue.600"
                onPress={() => navigation.navigate('privacy')}
              >
                Política de Privacidade
              </Text>
              .
            </Text>
          </Center>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
