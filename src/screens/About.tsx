import React from 'react'
import { ScrollView, Linking, Image } from 'react-native'
import {
  VStack,
  Text,
  IconButton,
  Icon,
  Center,
  Button,
  HStack,
  Box,
} from 'native-base'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import { AuthNavigatorRoutesProps } from '@routes/auth.routes'
import IakiPng from '@assets/logoiaki.png'

type BenefitProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  title: string
  description: string
  bg: string
  color: string
}

function BenefitCard({ icon, title, description, bg, color }: BenefitProps) {
  return (
    <HStack alignItems="center" space={2} flex={1} minW="47%">
      <Center w={12} h={12} rounded="full" bg={bg}>
        <Icon as={MaterialCommunityIcons} name={icon} size={7} color={color} />
      </Center>

      <VStack flex={1}>
        <Text fontSize="xs" fontWeight="800" color="gray.900" numberOfLines={1}>
          {title}
        </Text>

        <Text fontSize="2xs" color="gray.600" lineHeight="xs">
          {description}
        </Text>
      </VStack>
    </HStack>
  )
}

function BenefitsStrip() {
  return (
    <Box
      bg="blueGray.50"
      rounded="2xl"
      px={3}
      py={4}
      borderWidth={1}
      borderColor="blueGray.100"
      shadow={1}
    >
      <HStack flexWrap="wrap" justifyContent="space-between">
        <BenefitCard
          icon="currency-usd"
          title="Acumule pontos"
          description="A cada compra"
          bg="blue.100"
          color="blue.600"
        />

        <BenefitCard
          icon="gift-outline"
          title="Resgate prêmios"
          description="Produtos e descontos"
          bg="purple.100"
          color="purple.600"
        />

        <BenefitCard
          icon="ticket-percent-outline"
          title="Ofertas exclusivas"
          description="Só para você"
          bg="green.100"
          color="green.600"
        />

        <BenefitCard
          icon="star-outline"
          title="Mais vantagens"
          description="Quanto mais usa, mais ganha"
          bg="orange.100"
          color="orange.500"
        />
      </HStack>
    </Box>
  )
}

export function About() {
  const navigation = useNavigation<AuthNavigatorRoutesProps>()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space={4}>
        <IconButton
          borderRadius="full"
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          icon={<Icon as={Feather} name="chevron-left" size="8" />}
          onPress={() => navigation.goBack()}
        />

        <Center>
          <Text fontSize="sm" color="gray.500">
            Versão 1.0.1
          </Text>
        </Center>

        <Center>
          <Image
            style={{ height: 90, width: 160 }}
            alt="Logo IAki"
            source={IakiPng}
            resizeMode="contain"
          />
        </Center>

        <Text fontSize="md" color="gray.800" mt={2} mx={2} textAlign="center">
          O aplicativo <Text bold>IAki</Text> foi desenvolvido para oferecer
          benefícios em compras, promoções exclusivas e praticidade no dia a
          dia.
        </Text>

        <BenefitsStrip />

        <VStack space={3} mt={4}>
          <Button
            variant="outline"
            colorScheme="blue"
            rounded="xl"
            onPress={() => navigation.navigate('privacy')}
          >
            📜 Política de Privacidade
          </Button>

          <Button
            variant="outline"
            colorScheme="blue"
            rounded="xl"
            onPress={() => navigation.navigate('terms')}
          >
            📄 Termos de Uso
          </Button>

          <Button
            variant="outline"
            colorScheme="blue"
            rounded="xl"
            onPress={() => Linking.openURL('mailto:contato@iaki.com.br')}
          >
            📧 Contatar Suporte
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  )
}
