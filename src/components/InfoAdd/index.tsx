import { StyleSheet, TouchableOpacity } from 'react-native'
import { View, Center, Image, Box, Text, VStack } from 'native-base'

import IndicatorPng from '../../assets/down.png'

interface IProps {
  mBottom: number
  onPress: () => void
}

type Props = {
  handleLayoutChange: (event: any) => void
}

export function InfoAdd({ handleLayoutChange }: Props) {
  return (
    <View
      position={'absolute'}
      width={90}
      height={40}
      marginLeft={285}
      marginTop={495}
    >
      <VStack justifyContent={'center'} ml={2} mr={8} opacity={0.85}>
        <Image
          size={120}
          source={IndicatorPng}
          defaultSource={IndicatorPng}
          alt="Ganhe cashbacks!"
          resizeMode="contain"
          position="relative"
        />
      </VStack>
    </View>
  )
}
