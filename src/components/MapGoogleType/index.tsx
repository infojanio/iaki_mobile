import { StyleSheet, TouchableOpacity } from 'react-native'
import { Center, View } from 'native-base'

import { MapTypeSvg } from '../../assets';

interface Props {
  mBottom: number,
  onPress: () => void;
}

export function MapGoogleType({onPress}: Props) {
  return (
    
      
      <View     
      position={'absolute'}    
      width= {20}
      height={20}  
      marginLeft={1}      
      marginTop={100}   
      
      >
        <TouchableOpacity onPress={onPress} >
        <Center bg={'gray.100'} borderRadius={'full'} padding={2} ml={2} mr={8} opacity={0.85} >
            <MapTypeSvg />
            </Center>
        </TouchableOpacity>
    </View>
      
      

  )
}