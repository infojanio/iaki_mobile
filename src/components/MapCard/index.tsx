import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { HStack, Text } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { StackNavigatorRoutesProps } from '@routes/stack.routes'
import { api } from '@services/api'
import LocationSvg from '@assets/location.svg'
import { useAuth } from '@hooks/useAuth'

type Props = {
  handleLayoutChange: (event: any) => void
}

type Address = {
  street: string
  city: string
  state: string
  postalCode: string
}

export function MapCard({ handleLayoutChange }: Props) {
  const navigation = useNavigation<StackNavigatorRoutesProps>()
  const { userId } = useAuth()
  const [address, setAddress] = useState<Address | null>(null)

  // Busca endereço ao montar o componente
  useEffect(() => {
    async function fetchAddress() {
      try {
        const response = await api.get(`/users/${userId}/address`)
        console.log(response.data)
        if (response.data?.address) {
          setAddress(response.data.address)
        }
      } catch (error) {
        console.log('Erro ao buscar endereço:', error)
        setAddress(null) // <- indica ausência de endereço
      }
    }

    fetchAddress()
  }, [userId])

  const formattedAddress = address
    ? `${address.street}\n${address.city} - ${address.state}`
    : 'Não localizamos o endereço...'

  return (
    <HStack
      position={'absolute'}
      bg={'white'}
      width={'90%'}
      height={'12%'}
      marginLeft={4}
      marginTop={4}
      borderRadius={10}
      alignItems={'center'}
      paddingX={4}
      onLayout={handleLayoutChange}
    >
      <LocationSvg height={40} width={40} />
      <Text ml={3} fontSize={'13'}>
        Endereço:{'\n'}
        {formattedAddress}
      </Text>
    </HStack>
  )
}
