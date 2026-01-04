import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import * as ImagePicker from 'expo-image-picker'
import {
  VStack,
  Center,
  Text,
  Icon,
  IconButton,
  useToast,
  Box,
} from 'native-base'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import { TextInputMask } from 'react-native-masked-text'

import { Input } from '@components/Input'
import { Button } from '@components/Button'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'
import { useNavigation } from '@react-navigation/native'
import isValidCPF from '@utils/isValidCPF'

// Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dwqr47iii'
const CLOUDINARY_UPLOAD_PRESET = 'products'
const CLOUDINARY_FOLDER = 'avatars'

type FormDataProps = {
  name: string
  phone: string
  avatar?: string
  cpf: string
  street?: string
  state?: string
  postalCode?: string
}

const schema = yup.object({
  name: yup.string().required('Informe o nome'),
  phone: yup.string().required('Informe o telefone'),
  avatar: yup.string().optional(),
  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .test('cpf-valido', 'CPF inválido', (value) => isValidCPF(value || '')),
  street: yup.string().optional(),
  state: yup.string().optional(), //usar esse campo pra cidade
  postalCode: yup.string().optional(),
})

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

async function uploadAvatar(asset: ImagePicker.ImagePickerAsset) {
  const { filename, mime } = inferFileMeta(asset)
  const form = new FormData()
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  if (CLOUDINARY_FOLDER) form.append('folder', CLOUDINARY_FOLDER)

  if (Platform.OS === 'web') {
    const r = await fetch(asset.uri)
    const b = await r.blob()
    const MAX = 5 * 1024 * 1024
    if (b.size > MAX) throw new Error('Imagem acima de 5MB.')
    const file = new File([b], filename, { type: mime })
    form.append('file', file)
  } else {
    // @ts-ignore RN file shape
    form.append('file', { uri: asset.uri, name: filename, type: mime })
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: form,
    },
  )
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Falha no upload do avatar. ${res.status} - ${t}`)
  }
  const data = await res.json()
  return data.secure_url as string
}

export function ProfileEdit() {
  const { user } = useAuth()
  const nav = useNavigation()
  const toast = useToast()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatar ?? null,
  )
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormDataProps>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      phone: (user as any)?.phone ?? '',
      avatar: user?.avatar ?? '',
      cpf: user?.cpf ?? '',
      state: user?.state ?? '', //usar esse campo pra cidade
      street: user?.street ?? '',
      postalCode: user?.postalCode ?? '',
    },
  })

  // Carrega o perfil do backend
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingUser(true)
        const { data } = await api.get('/users/profile')
        const u = data?.user ?? {}

        if (!mounted) return
        setAvatarUrl(u?.avatar ?? null)
        reset({
          name: u?.name ?? '',
          phone: u?.phone ?? '',
          cpf: u?.cpf ?? '',
          avatar: u?.avatar ?? '',
          street: u?.street ?? '',
          state: u?.state ?? '',
          postalCode: u?.postalCode ?? '',
        })
      } catch (e) {
        toast.show({
          title: 'Não foi possível carregar seu perfil.',
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        if (mounted) setLoadingUser(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [reset])

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      toast.show({
        title: 'Permissão necessária para acessar fotos.',
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
      const url = await uploadAvatar(asset)
      setAvatarUrl(url)
      toast.show({
        title: 'Foto atualizada!',
        placement: 'top',
        bgColor: 'emerald.600',
      })
    } catch (e) {
      toast.show({
        title: e?.message || 'Falha no upload do avatar.',
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  async function onSubmit(data: FormDataProps) {
    try {
      const payload = {
        ...data,
        avatar: avatarUrl ?? undefined,
      }

      const userId = (user as any)?.id
      if (!userId) throw new Error('ID do usuário não encontrado no contexto.')

      await api.patch(`/users/${userId}`, payload)

      toast.show({
        title: 'Dados atualizados!',
        placement: 'top',
        bgColor: 'emerald.600',
      })
      nav.goBack()
    } catch (err) {
      toast.show({
        title: 'Não foi possível salvar suas alterações.',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  if (loadingUser) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack flex={1} p={4} pb={12} space={2} bg="gray.50" borderRadius={8}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              borderRadius="full"
              variant="ghost"
              size="sm"
              icon={<Icon as={Feather} name="chevron-left" size="8" />}
              onPress={() => (nav as any).goBack()}
            />
            <Text ml={2} fontSize="2xl" fontWeight="bold">
              Editar perfil
            </Text>
          </View>

          {/* Avatar */}
          <Center mt={4} mb={2}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 999,
                  backgroundColor: '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: '#fff',
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
              Toque para alterar a foto
            </Text>
          </Center>

          {/* Form */}
          <VStack space={5}>
            <Text fontSize="md" color="gray.600" fontWeight="semibold">
              Dados pessoais
            </Text>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Nome completo"
                  leftIcon={<MaterialIcons name="person" size={24} />}
                  onChangeText={onChange}
                  value={value ?? ''}
                  errorMessage={errors.name?.message}
                />
              )}
            />

            {/* CPF com máscara */}
            <Controller
              control={control}
              name="cpf"
              render={({ field: { onChange, value } }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: errors.cpf ? 'red' : '#ccc',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    marginBottom: 8,
                    height: 48,
                  }}
                >
                  <MaterialIcons
                    name="badge"
                    size={20}
                    color="#666"
                    style={{ marginRight: 8 }}
                  />
                  <TextInputMask
                    type={'cpf'}
                    value={value ?? ''}
                    onChangeText={onChange}
                    style={{ flex: 1, fontSize: 14 }}
                    keyboardType="numeric"
                    placeholder="Digite seu CPF" // 👈 aqui
                    placeholderTextColor="#999"
                  />
                </View>
              )}
            />
            {errors.cpf && (
              <Text style={{ color: 'red', fontSize: 12 }}>
                {errors.cpf.message}
              </Text>
            )}

            {/* Telefone com máscara */}
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                  }}
                >
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#666"
                    style={{ marginRight: 8 }}
                  />
                  <TextInputMask
                    type={'cel-phone'}
                    options={{
                      maskType: 'BRL',
                      withDDD: true,
                      dddMask: '(99) ',
                    }}
                    value={value ?? ''}
                    onChangeText={onChange}
                    style={{ flex: 1, fontSize: 14, height: 48 }}
                    keyboardType="phone-pad"
                    placeholder="Digite seu telefone" // 👈 aqui
                    placeholderTextColor="#999"
                  />
                </View>
              )}
            />

            <Text fontSize="md" color="gray.600" fontWeight="semibold" mt={4}>
              Endereço
            </Text>

            <Controller
              control={control}
              name="street"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Rua"
                  leftIcon={<MaterialIcons name="location-on" size={20} />}
                  onChangeText={onChange}
                  value={value ?? ''}
                  errorMessage={errors.street?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Cidade"
                  leftIcon={<MaterialIcons name="map" size={20} />}
                  onChangeText={onChange}
                  value={value ?? ''}
                  errorMessage={errors.state?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="postalCode"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="CEP"
                  keyboardType="numeric"
                  leftIcon={
                    <MaterialIcons name="local-post-office" size={20} />
                  }
                  onChangeText={onChange}
                  value={value ?? ''}
                  errorMessage={errors.postalCode?.message}
                />
              )}
            />
          </VStack>

          <Button
            title={isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            mt={8}
            isLoading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            isDisabled={avatarUploading || isSubmitting}
          />
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
