import React from 'react'
import { ScrollView } from 'react-native'
import { VStack, Text, IconButton, Icon } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'

export function TermsOfUse() {
  const navigation = useNavigation()

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

        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Termos de Uso
        </Text>

        <Text fontSize="sm" color="gray.700">
          Última atualização: 01/09/2025
        </Text>

        <Text fontSize="md" color="gray.800">
          Bem-vindo ao aplicativo <Text bold>iaki</Text>. Ao utilizar nossos
          serviços, você concorda com estes Termos de Uso, que estabelecem os
          direitos e responsabilidades entre você e a plataforma.
        </Text>

        <Text fontSize="lg" bold>
          1. Cadastro e Conta
        </Text>
        <Text>
          • O usuário deve fornecer informações verdadeiras, completas e
          atualizadas.{'\n'}• É responsável por manter a confidencialidade da
          sua senha.{'\n'}• O uso da conta é pessoal e intransferível.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          2. Uso do Aplicativo
        </Text>
        <Text>
          • O app destina-se a fornecer informações sobre cashback, compras e
          promoções.{'\n'}• É proibido usar o aplicativo para fins ilegais,
          fraudulentos ou que prejudiquem terceiros.{'\n'}• Reservamo-nos o
          direito de suspender ou encerrar contas que violem estes termos.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          3. Cashback
        </Text>
        <Text>
          • As regras de acúmulo e utilização do cashback são definidas pela
          plataforma e podem ser alteradas com aviso prévio.{'\n'}• O saldo de
          cashback é pessoal e não pode ser transferido, vendido ou convertido
          em dinheiro, salvo quando explicitamente permitido.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          4. Responsabilidades
        </Text>
        <Text>
          • O aplicativo é oferecido “como está”, podendo sofrer atualizações,
          melhorias e ajustes.{'\n'}• Não nos responsabilizamos por falhas
          externas de rede, terceiros ou uso inadequado do app.{'\n'}• O usuário
          concorda em usar o app de forma ética e respeitosa.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          5. Alterações
        </Text>
        <Text>
          Podemos atualizar estes Termos de Uso periodicamente. Notificaremos os
          usuários em caso de alterações relevantes.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          6. Contato
        </Text>
        <Text>
          Para dúvidas ou suporte, entre em contato:{'\n'}
          suporte@iaki.com.br
        </Text>
      </VStack>
    </ScrollView>
  )
}
