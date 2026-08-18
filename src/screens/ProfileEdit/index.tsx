import React, { useEffect, useState } from 'react'

import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

// ======================================================
// CLOUDINARY
// ======================================================

const CLOUDINARY_CLOUD_NAME = 'dwqr47iii'
const CLOUDINARY_UPLOAD_PRESET = 'products'
const CLOUDINARY_FOLDER = 'avatars'

// ======================================================
// TYPES
// ======================================================

type FormDataProps = {
  name: string
  phone: string
  avatar?: string
  cpf: string
  street?: string
  state?: string
  postalCode?: string
}

// ======================================================
// VALIDATION
// ======================================================

const schema = yup.object({
  name: yup.string().required('Informe o nome'),

  phone: yup.string().required('Informe o telefone'),

  avatar: yup.string().optional(),

  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .test('cpf-valido', 'CPF inválido', (value) => isValidCPF(value || '')),

  street: yup.string().optional(),

  state: yup.string().optional(),

  postalCode: yup.string().optional(),
})

// ======================================================
// IMAGE
// ======================================================

function inferFileMeta(asset: ImagePicker.ImagePickerAsset) {
  const filename =
    asset.fileName || asset.uri.split('/').pop() || `avatar-${Date.now()}.jpg`

  let mime = asset.mimeType

  if (!mime) {
    const ext = (filename.split('.').pop() || '').toLowerCase()

    mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  }

  return {
    filename,
    mime,
  }
}

async function uploadAvatar(asset: ImagePicker.ImagePickerAsset) {
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
    // @ts-ignore React Native file shape
    form.append('file', {
      uri: asset.uri,
      name: filename,
      type: mime,
    })
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

  const data = await response.json()

  return data.secure_url as string
}

// ======================================================
// COMPONENT
// ======================================================

export function ProfileEdit() {
  const { user, signOut } = useAuth()

  const nav = useNavigation()

  const toast = useToast()

  // ====================================================
  // STATES
  // ====================================================

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatar ?? null,
  )

  const [avatarUploading, setAvatarUploading] = useState(false)

  const [loadingUser, setLoadingUser] = useState(true)

  const [deletingAccount, setDeletingAccount] = useState(false)

  // ====================================================
  // FORM
  // ====================================================

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

      state: user?.state ?? '',

      street: user?.street ?? '',

      postalCode: user?.postalCode ?? '',
    },
  })

  // ====================================================
  // LOAD PROFILE
  // ====================================================

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        setLoadingUser(true)

        const { data } = await api.get('/users/profile')

        const u = data?.user ?? {}

        if (!mounted) {
          return
        }

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
      } catch (error) {
        console.log('[ProfileEdit] Erro ao carregar perfil:', error)

        toast.show({
          title: 'Não foi possível carregar seu perfil.',

          placement: 'top',

          bgColor: 'red.500',
        })
      } finally {
        if (mounted) {
          setLoadingUser(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [reset, toast])

  // ====================================================
  // AVATAR
  // ====================================================

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

    if (result.canceled) {
      return
    }

    const asset = result.assets?.[0]

    if (!asset?.uri) {
      return
    }

    try {
      setAvatarUploading(true)

      const url = await uploadAvatar(asset)

      setAvatarUrl(url)

      toast.show({
        title: 'Foto atualizada!',

        placement: 'top',

        bgColor: 'emerald.600',
      })
    } catch (error: any) {
      console.log('[ProfileEdit] Erro no avatar:', error)

      toast.show({
        title: error?.message || 'Falha no upload do avatar.',

        placement: 'top',

        bgColor: 'red.500',
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  // ====================================================
  // UPDATE PROFILE
  // ====================================================

  async function onSubmit(data: FormDataProps) {
    try {
      const payload = {
        ...data,

        avatar: avatarUrl ?? undefined,
      }

      const userId = (user as any)?.id

      if (!userId) {
        throw new Error('ID do usuário não encontrado no contexto.')
      }

      await api.patch(`/users/${userId}`, payload)

      toast.show({
        title: 'Dados atualizados!',

        placement: 'top',

        bgColor: 'emerald.600',
      })

      nav.goBack()
    } catch (error: any) {
      console.log(
        '[ProfileEdit] Erro ao atualizar:',
        error?.response?.data ?? error,
      )

      toast.show({
        title:
          error?.response?.data?.message ??
          'Não foi possível salvar suas alterações.',

        placement: 'top',

        bgColor: 'red.500',
      })
    }
  }

  // ====================================================
  // DELETE ACCOUNT
  // ====================================================

  async function deleteMyAccount() {
    try {
      setDeletingAccount(true)

      /*
       * O userId NÃO é enviado.
       *
       * O backend identifica o usuário
       * através do JWT:
       *
       * request.user.sub
       */
      const response = await api.patch('/users/me/anonymize')

      /*
       * Após a anonimização:
       *
       * - e-mail foi removido
       * - CPF removido
       * - telefone removido
       * - endereço removido
       * - senha inutilizada
       * - refresh tokens removidos
       */

      Alert.alert(
        'Conta excluída',
        response?.data?.message ??
          'Sua conta e seus dados pessoais foram excluídos com sucesso.',
        [
          {
            text: 'OK',

            onPress: async () => {
              /*
               * Limpa usuário/token
               * armazenado no mobile.
               */
              await signOut()
            },
          },
        ],
        {
          cancelable: false,
        },
      )
    } catch (error: any) {
      console.log(
        '[ProfileEdit] Erro ao excluir conta:',
        error?.response?.data ?? error,
      )

      toast.show({
        title:
          error?.response?.data?.message ??
          'Não foi possível excluir sua conta.',

        placement: 'top',

        bgColor: 'red.500',
      })
    } finally {
      setDeletingAccount(false)
    }
  }

  function handleDeleteAccount() {
    if (deletingAccount) {
      return
    }

    Alert.alert(
      'Excluir minha conta',
      'Tem certeza de que deseja excluir sua conta do Clube IAki?',
      [
        {
          text: 'Cancelar',

          style: 'cancel',
        },

        {
          text: 'Continuar',

          style: 'destructive',

          onPress: () => {
            Alert.alert(
              'Confirmar exclusão',
              'Seus dados pessoais serão removidos e você perderá o acesso à sua conta. Esta ação não poderá ser desfeita.',
              [
                {
                  text: 'Não, manter minha conta',

                  style: 'cancel',
                },

                {
                  text: 'Sim, excluir minha conta',

                  style: 'destructive',

                  onPress: deleteMyAccount,
                },
              ],
            )
          },
        },
      ],
    )
  }

  // ====================================================
  // LOADING
  // ====================================================

  if (loadingUser) {
    return (
      <View
        style={{
          flex: 1,

          alignItems: 'center',

          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    )
  }

  // ====================================================
  // UI
  // ====================================================

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
        }}
        keyboardShouldPersistTaps="handled"
      >
        <VStack flex={1} p={4} pb={12} space={2} bg="gray.50" borderRadius={8}>
          {/* =================================================
              HEADER
          ================================================= */}

          <View
            style={{
              flexDirection: 'row',

              alignItems: 'center',
            }}
          >
            <IconButton
              borderRadius="full"
              variant="ghost"
              size="sm"
              icon={<Icon as={Feather} name="chevron-left" size="8" />}
              onPress={() => nav.goBack()}
            />

            <Text ml={2} fontSize="2xl" fontWeight="bold">
              Editar perfil
            </Text>
          </View>

          {/* =================================================
              AVATAR
          ================================================= */}

          <Center mt={4} mb={2}>
            <TouchableOpacity
              onPress={pickAvatar}
              activeOpacity={0.8}
              disabled={deletingAccount}
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

                  borderWidth: 2,

                  borderColor: '#fff',
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
              Toque para alterar a foto
            </Text>
          </Center>

          {/* =================================================
              FORM
          ================================================= */}

          <VStack space={5}>
            <Text fontSize="md" color="gray.600" fontWeight="semibold">
              Dados pessoais
            </Text>

            {/* NOME */}

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

            {/* =================================================
                CPF
            ================================================= */}

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

                    backgroundColor: '#fff',
                  }}
                >
                  <MaterialIcons
                    name="badge"
                    size={20}
                    color="#666"
                    style={{
                      marginRight: 8,
                    }}
                  />

                  <TextInputMask
                    type="cpf"
                    value={value ?? ''}
                    onChangeText={onChange}
                    style={{
                      flex: 1,

                      fontSize: 14,
                    }}
                    keyboardType="numeric"
                    placeholder="Digite seu CPF"
                    placeholderTextColor="#999"
                    editable={!deletingAccount}
                  />
                </View>
              )}
            />

            {errors.cpf && (
              <Text color="red.500" fontSize="xs">
                {errors.cpf.message}
              </Text>
            )}

            {/* =================================================
                TELEFONE
            ================================================= */}

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

                    backgroundColor: '#fff',
                  }}
                >
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#666"
                    style={{
                      marginRight: 8,
                    }}
                  />

                  <TextInputMask
                    type="cel-phone"
                    options={{
                      maskType: 'BRL',

                      withDDD: true,

                      dddMask: '(99) ',
                    }}
                    value={value ?? ''}
                    onChangeText={onChange}
                    style={{
                      flex: 1,

                      fontSize: 14,

                      height: 48,
                    }}
                    keyboardType="phone-pad"
                    placeholder="Digite seu telefone"
                    placeholderTextColor="#999"
                    editable={!deletingAccount}
                  />
                </View>
              )}
            />

            {/* =================================================
                ENDEREÇO
            ================================================= */}

            <Text fontSize="md" color="gray.600" fontWeight="semibold" mt={4}>
              Endereço
            </Text>

            {/* RUA */}

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

            {/* CIDADE */}

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

            {/* CEP */}

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

          {/* =================================================
              SAVE
          ================================================= */}

          <Button
            title={isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            mt={8}
            isLoading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            isDisabled={avatarUploading || isSubmitting || deletingAccount}
          />

          {/* =================================================
              DELETE ACCOUNT
          ================================================= */}

          <Box mt={10} pt={6} borderTopWidth={1} borderTopColor="gray.200">
            <View
              style={{
                flexDirection: 'row',

                alignItems: 'center',
              }}
            >
              <MaterialIcons name="warning" size={22} color="#DC2626" />

              <Text ml={2} fontSize="md" fontWeight="bold" color="red.600">
                Atenção!
              </Text>
            </View>

            <Text mt={3} fontSize="sm" color="gray.600" lineHeight="md">
              Ao excluir sua conta, seus dados pessoais serão removidos e você
              perderá o acesso ao Clube IAki.
            </Text>

            <Text mt={2} fontSize="sm" color="gray.600" lineHeight="md">
              Esta ação é permanente e não poderá ser desfeita.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={deletingAccount || isSubmitting || avatarUploading}
              onPress={handleDeleteAccount}
              style={{
                marginTop: 18,

                minHeight: 52,

                borderRadius: 8,

                borderWidth: 1,

                borderColor: '#DC2626',

                backgroundColor: '#FEF2F2',

                flexDirection: 'row',

                alignItems: 'center',

                justifyContent: 'center',

                opacity: deletingAccount ? 0.6 : 1,
              }}
            >
              {deletingAccount ? (
                <>
                  <ActivityIndicator size="small" color="#DC2626" />

                  <Text ml={2} color="red.600" fontSize="md" fontWeight="bold">
                    Excluindo...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons
                    name="delete-forever"
                    size={24}
                    color="#DC2626"
                  />

                  <Text ml={2} color="red.600" fontSize="md" fontWeight="bold">
                    Excluir minha conta
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View
              style={{
                marginTop: 14,

                padding: 12,

                borderRadius: 8,

                backgroundColor: '#FFF7ED',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',

                  alignItems: 'flex-start',
                }}
              >
                <MaterialIcons name="info-outline" size={18} color="#9A3412" />

                <Text
                  ml={2}
                  flex={1}
                  fontSize="xs"
                  color="orange.800"
                  lineHeight="sm"
                >
                  Alguns registros históricos poderão permanecer de forma
                  anonimizada quando necessários para segurança, auditoria e
                  integridade das operações.
                </Text>
              </View>
            </View>
          </Box>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
