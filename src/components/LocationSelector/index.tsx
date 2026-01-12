import { Pressable } from 'react-native'
import { HStack, Text, Icon, useTheme } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import MarketPng from '@assets/logoiaki.png'

import { useContext } from 'react'
import { CityContext } from '@contexts/CityContext'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '@routes/types'

type NavigationProps = NativeStackNavigationProp<RootStackParamList>

export function LocationSelector() {
  const { city } = useContext(CityContext)
  const navigation = useNavigation<NavigationProps>()
  const { colors, sizes } = useTheme()

  function handleChangeCity() {
    navigation.navigate('selectCity')
  }

  return (
    <Pressable onPress={handleChangeCity}>
      <HStack alignItems="center" space={1}>
        <Icon
          as={MaterialIcons}
          name="location-on"
          size={sizes[1.5]}
          color={colors.red[700]}
        />

        <Text
          fontSize="md"
          fontWeight="bold"
          color="gray.800"
          numberOfLines={1}
        >
          {city ? `${city.name}` : 'Selecionar cidade'}
        </Text>

        <Icon
          as={MaterialIcons}
          name="expand-more"
          size={sizes[2]}
          color={colors.gray[500]}
        />
      </HStack>
    </Pressable>
  )
}
