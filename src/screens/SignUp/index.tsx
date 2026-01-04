import React, { useContext, useRef, useState } from 'react'
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import * as ImagePicker from 'expo-image-picker'

import { VStack, Center, Text, Icon, IconButton, useToast } from 'native-base'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { Linking } from 'react-native'

import { Input } from '@components/Input'
import { Button } from '@components/Button'

import { AppError } from '@utils/AppError'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'

import isValidCPF from '@utils/isValidCPF'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { CityContext } from '@contexts/CityContext'

// ---------- CONFIG CLOUDINARY ----------
const CLOUDINARY_CLOUD_NAME = 'dwqr47iii'
const CLOUDINARY_UPLOAD_PRESET = 'avatars'
const CLOUDINARY_FOLDER = 'avatars'
// --------------------------------------

// -------- Helpers de formatação --------
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
// ---------------------------------------

type FormDataProps = {
  name: string
  email: string
  phone: string
  cpf: string
  avatar: string
  role: string
  password: string
  password_confirm: string
  street: string
  // city: string
  state: string //usar esse campo pra cidade
  postalCode: string
}

const signUpSchema = yup.object({
  name: yup.string().required('Informe o nome'),
  email: yup.string().required('Informe o e-mail').email('E-mail inválido'),
  phone: yup.string().required('Informe o telefone'),
  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .test('cpf-valido', 'CPF inválido', (value) => isValidCPF(value || '')),
  avatar: yup.string().default('avatar.jpg'),
  role: yup.string().default('USER'),
  password: yup
    .string()
    .required('Informe a senha')
    .min(6, 'A senha deve conter no mínimo 6 dígitos'),
  password_confirm: yup
    .string()
    .oneOf([yup.ref('password')], 'A senha digitada não confere!')
    .required('Confirme a senha'),
  street: yup.string().required('Informe a rua'),
  //city: yup.string().required('Informe a cidade'),
  state: yup.string().required('Informe o estado'),
  postalCode: yup.string().required('Informe o CEP'),
})

// -------- Helpers de upload --------
function inferFileMeta(asset: ImagePicker.ImagePickerAsset) {
  const filename =
    asset.fileName || asset.uri.split('/').pop() || `avatar-${Date.now()}.jpg`

  let mime = asset.mimeType
  if (!mime) {
    const ext = (filename.split('.').pop() || '').toLowerCase()
    mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  }
  return { filename, mime }
}

async function uploadAvatarToCloudinary(asset: ImagePicker.ImagePickerAsset) {
  const { filename, mime } = inferFileMeta(asset)
  const form = new FormData()
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  if (CLOUDINARY_FOLDER) form.append('folder', CLOUDINARY_FOLDER)

  if (Platform.OS === 'web') {
    const resp = await fetch(asset.uri)
    const blob = await resp.blob()
    const MAX = 5 * 1024 * 1024
    if (blob.size > MAX) throw new Error('Imagem acima de 5MB.')
    const file = new File([blob], filename, { type: mime })
    form.append('file', file)
  } else {
    // @ts-ignore
    form.append('file', { uri: asset.uri, name: filename, type: mime })
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Falha no upload do avatar. ${res.status} - ${txt}`)
  }

  const data = await res.json()
  return data.secure_url as string
}
// -----------------------------------

export function SignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const scrollViewRef = useRef<ScrollView>(null)
  const toast = useToast()
  const { signIn, userId } = useAuth()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<FormDataProps>({
    resolver: yupResolver(signUpSchema),
  })

  // Refs dos campos para focar no erro
  const refs: Record<string, React.RefObject<TextInput>> = {
    name: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    phone: useRef<TextInput>(null),
    cpf: useRef<TextInput>(null),
    password: useRef<TextInput>(null),
    password_confirm: useRef<TextInput>(null),
    street: useRef<TextInput>(null),
    //city: useRef<TextInput>(null),
    state: useRef<TextInput>(null), //usar esse campo pra cidade
    postalCode: useRef<TextInput>(null),
  }

  async function handleSignUp(data: FormDataProps) {
    const isValid = await trigger()
    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField && refs[firstErrorField]?.current) {
        refs[firstErrorField].current?.focus()
        toast.show({
          title: errors[firstErrorField]?.message || 'Verifique os dados',
          placement: 'top',
          bgColor: 'red.500',
        })
      }
      return
    }

    try {
      setIsLoading(true)

      await api.post('/users', {
        ...data,
        avatar: avatarUrl ?? 'avatar.jpg',
        role: 'USER',
      })

      const user = await signIn(data.email, data.password)

      try {
        const locationResponse = await api.get(`/users/${user.id}/location`)
        const { latitude, longitude } = locationResponse.data
        if (latitude && longitude) {
          navigation.navigate('home')
        } else {
          navigation.navigate('', { userId: user.id })
        }
      } catch {
        //navigation.navigate('localization', { userId: user.id })
      }
    } catch (error) {
      setIsLoading(false)
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível criar a conta. Tente novamente mais tarde!'
      toast.show({ title, placement: 'top', bgColor: 'red.500' })
    }
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
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
    if (result.canceled) return

    const asset = result.assets?.[0]
    if (!asset?.uri) return

    try {
      setAvatarUploading(true)
      const url = await uploadAvatarToCloudinary(asset)
      setAvatarUrl(url)
      toast.show({
        title: 'Foto enviada!',
        placement: 'top',
        bgColor: 'emerald.600',
      })
    } catch (e) {
      toast.show({
        title: e?.message || 'Não foi possível enviar sua foto.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
      >
        <VStack flex={1} p={4} pb={12} space={2} bg="gray.50">
          <IconButton
            borderRadius="full"
            variant="ghost"
            size="sm"
            icon={<Icon as={Feather} name="chevron-left" size="8" />}
            onPress={() => navigation.goBack()}
            alignSelf="flex-start"
          />

          <Center>
            <Text fontSize="2xl" fontWeight="bold">
              Criar conta
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Preencha seus dados para continuar
            </Text>
          </Center>

          {/* Avatar */}
          <Center mt={4} mb={2}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
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
                    source={{ uri: avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
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

          {/* Campos do formulário */}
          <VStack space={4} mt={4}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.name}
                  placeholder="Nome completo"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.email}
                  placeholder="E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.phone}
                  placeholder="Telefone"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  onChangeText={(t) => onChange(formatPhone(t))}
                  value={formatPhone(value || '')}
                  errorMessage={errors.phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="cpf"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.cpf}
                  placeholder="CPF"
                  keyboardType="numeric"
                  returnKeyType="next"
                  onChangeText={(t) => onChange(formatCPF(t))}
                  value={formatCPF(value || '')}
                  errorMessage={errors.cpf?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.password}
                  placeholder="Senha"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.password?.message}
                  rightIcon={
                    <IconButton
                      icon={
                        <Icon
                          as={MaterialIcons}
                          name={showPassword ? 'visibility-off' : 'visibility'}
                          size={5}
                        />
                      }
                      onPress={() => setShowPassword(!showPassword)}
                      variant="ghost"
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password_confirm"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.password_confirm}
                  placeholder="Confirme a senha"
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="next"
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.password_confirm?.message}
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
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      variant="ghost"
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="street"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.street}
                  placeholder="Rua"
                  returnKeyType="next"
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.street?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.state}
                  placeholder="Cidade"
                  returnKeyType="next"
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.state?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="postalCode"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={refs.postalCode}
                  placeholder="CEP"
                  keyboardType="numeric"
                  returnKeyType="done"
                  onChangeText={(t) => onChange(formatCEP(t))}
                  value={formatCEP(value || '')}
                  errorMessage={errors.postalCode?.message}
                />
              )}
            />
          </VStack>

          <Button
            title={avatarUploading ? 'Enviando foto...' : 'Cadastrar'}
            mt={8}
            isLoading={isLoading}
            onPress={handleSubmit(handleSignUp)}
            isDisabled={avatarUploading || isLoading}
          />
          {/* Aviso de Política de Privacidade */}
          <Center mt={6}>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Ao criar a conta, você concorda com nossos{'\n'}
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
