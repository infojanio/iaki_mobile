import { TouchableOpacity, StyleSheet } from 'react-native'
import { View } from 'native-base'

import { PlusSvg, CloseSvg } from '../../assets'

interface Props {
  mBottom: number
  showMarkerSetter: boolean
  onPress: () => void
}

export function NewMarker({ mBottom, onPress, showMarkerSetter }: Props) {
  return (
    <View
      position={'absolute'}
      width={44}
      height={20}
      marginLeft={300}
      marginTop={605}
    >
      <TouchableOpacity
        onPress={onPress}
        style={styles(null, showMarkerSetter).button}
      >
        {showMarkerSetter ? <CloseSvg /> : <PlusSvg />}
      </TouchableOpacity>
    </View>
  )
}

/*

        <TouchableOpacity onPress={onPress} >
            <Center bg={'gray.100'} borderRadius={'full'} padding={2} ml={2} mr={8} opacity={0.85} >
            <MyLocationSvg />
            </Center>
        </TouchableOpacity>
*/

const styles = (mBottom?: number | null, showMarkerSetter?: boolean) =>
  StyleSheet.create({
    button: {
      width: 35,
      height: 35,
      backgroundColor: showMarkerSetter ? '#cfd8d8' : '#f3f4f6',
      borderRadius: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
