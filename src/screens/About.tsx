import React from 'react'
import { ScrollView, Linking, Image } from 'react-native'
import { VStack, Text, IconButton, Icon, Center, Button } from 'native-base'
import { Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { AuthNavigatorRoutesProps } from '@routes/auth.routes'
import IakiPng from '@assets/logoiaki.png'

export function About() {
  const navigation = useNavigation<AuthNavigatorRoutesProps>()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <VStack space={4}>
        {/* Botão voltar */}
        <IconButton
          borderRadius="full"
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          icon={<Icon as={Feather} name="chevron-left" size="8" />}
          onPress={() => navigation.goBack()}
        />

        <Center>
          <Text fontSize="sm" color="gray.600">
            Versão 1.0.1
          </Text>
        </Center>
        <Center>
          <Image
            style={{ height: 90, width: 160 }}
            alt="Logo da Loja"
            source={IakiPng}
            borderRadius={1}
          />
        </Center>

        <Text fontSize="md" color="gray.800" mt={4} ml={2} mr={2}>
          O aplicativo <Text bold>IAki</Text> foi desenvolvido para oferecer
          cashback em compras, promoções exclusivas e praticidade no dia a dia.
        </Text>

        <VStack space={3} mt={6}>
          <Button
            variant="outline"
            colorScheme="blue"
            onPress={() => navigation.navigate('privacy')}
          >
            📜 Política de Privacidade
          </Button>

          <Button
            variant="outline"
            colorScheme="blue"
            onPress={() => navigation.navigate('terms')}
          >
            📄 Termos de Uso
          </Button>

          <Button
            variant="outline"
            colorScheme="blue"
            onPress={() => Linking.openURL('mailto:contato@iaki.com.br')}
          >
            📧 Contatar Suporte
          </Button>
        </VStack>
      </VStack>
    </ScrollView>
  )
}
