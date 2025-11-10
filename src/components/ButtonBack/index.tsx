import { StyleSheet, TouchableOpacity } from 'react-native'
import { HStack, Center, Text, Button, Icon } from 'native-base'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

type Props = {
  handleLayoutChange: (event: any) => void
}

//voltar a tela anterior
export function ButtonBack({ handleLayoutChange }: Props) {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleGoBack() {
    navigation.goBack()
    console.log('voltei')
  }

  return (
    <HStack
      position={'absolute'}
      width={'20%'}
      height={'10%'}
      marginTop={590}
      alignItems={'center'}
      borderRadius={30}
    >
      <TouchableOpacity onPress={handleGoBack}>
        <Icon
          opacity={1.25}
          as={<MaterialIcons name="arrow-back" />}
          size={6}
          mr={1}
          ml={4}
          _light={{
            color: 'gray.800',
          }}
          _dark={{
            color: 'gray.100',
          }}
        />
      </TouchableOpacity>
    </HStack>
  )
}
