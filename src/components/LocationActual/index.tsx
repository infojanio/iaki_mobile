import { StyleSheet, TouchableOpacity } from 'react-native'
import { View, Center } from 'native-base'

import { MyLocationSvg } from '../../assets';

interface Props {
  mBottom: number,
  onPress: () => void;
}

export function LocationActual({onPress}: Props) {
  return (
    
      
      <View     
      position={'absolute'}
    
      width= {20}
      height={20}  
      marginLeft={1} 
      marginTop={150}   
      
      >
        <TouchableOpacity onPress={onPress} >
            <Center bg={'gray.100'} borderRadius={'full'} padding={2} ml={2} mr={8} opacity={0.85} >
            <MyLocationSvg />
            </Center>
        </TouchableOpacity>
    </View>
      
      

  )
}