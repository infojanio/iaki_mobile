import { HStack, VStack, Text, Box, Icon } from 'native-base'

import { MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons'

export function BenefitsBar() {
  return (
    <Box
      mx={4}
      mt={2}
      mb={2}
      bg="white"
      borderRadius={24}
      shadow={1}
      px={3}
      py={4}
    >
      <HStack justifyContent="space-between">
        {/* Acumule pontos */}
        <HStack flex={1} alignItems="center">
          <Box bg="blue.100" p={3} borderRadius="full" mr={2}>
            <Icon
              as={MaterialCommunityIcons}
              name="cash"
              size={5}
              color="blue.600"
            />
          </Box>

          <VStack flex={1}>
            <Text fontSize="xs" fontWeight="700" color="gray.800">
              Acumule pontos
            </Text>

            <Text fontSize="2xs" color="gray.500">
              A cada compra
            </Text>
          </VStack>
        </HStack>

        {/* Resgate prêmios */}
        <HStack flex={1} alignItems="center">
          <Box bg="purple.100" p={3} borderRadius="full" mr={2}>
            <Icon as={Feather} name="gift" size={5} color="purple.600" />
          </Box>

          <VStack flex={1}>
            <Text fontSize="xs" fontWeight="700" color="gray.800">
              Resgate prêmios
            </Text>

            <Text fontSize="2xs" color="gray.500">
              Produtos e descontos
            </Text>
          </VStack>
        </HStack>
      </HStack>

      <HStack justifyContent="space-between" mt={4}>
        {/* Ofertas */}
        <HStack flex={1} alignItems="center">
          <Box bg="green.100" p={3} borderRadius="full" mr={2}>
            <Icon as={Feather} name="tag" size={5} color="green.600" />
          </Box>

          <VStack flex={1}>
            <Text fontSize="xs" fontWeight="700" color="gray.800">
              Ofertas exclusivas
            </Text>

            <Text fontSize="2xs" color="gray.500">
              Só para você
            </Text>
          </VStack>
        </HStack>

        {/* Vantagens */}
        <HStack flex={1} alignItems="center">
          <Box bg="orange.100" p={3} borderRadius="full" mr={2}>
            <Icon as={AntDesign} name="staro" size={5} color="orange.500" />
          </Box>

          <VStack flex={1}>
            <Text fontSize="xs" fontWeight="700" color="gray.800">
              Mais vantagens
            </Text>

            <Text fontSize="2xs" color="gray.500">
              Quanto mais usa, mais ganha
            </Text>
          </VStack>
        </HStack>
      </HStack>
    </Box>
  )
}
