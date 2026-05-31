import { Pressable } from 'react-native'
import { HStack, Icon, Text, Box } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

export function SearchBar() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  function handleNavigate() {
    navigation.navigate('searchProducts')
  }

  return (
    <Pressable onPress={handleNavigate}>
      <Box
        mx={1}
        mt={-4}
        mb={2}
        bg="white"
        h={12}
        borderRadius={20}
        shadow={3}
        justifyContent="center"
        px={4}
      >
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space={3}>
            <Icon as={MaterialIcons} name="search" size={6} color="gray.400" />

            <Text color="gray.400" fontSize="md">
              Buscar produtos em oferta...
            </Text>
          </HStack>

          <Icon
            as={MaterialIcons}
            name="qr-code-scanner"
            size={6}
            color="gray.500"
          />
        </HStack>
      </Box>
    </Pressable>
  )
}
