import React from 'react'
import { ScrollView } from 'react-native'
import { VStack, Text } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { IconButton, Icon } from 'native-base'

export function PrivacyPolicy() {
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
          Política de Privacidade
        </Text>

        <Text fontSize="sm" color="gray.700">
          Última atualização: 01/09/2025
        </Text>

        <Text fontSize="md" color="gray.800">
          O aplicativo <Text bold>iaki</Text> valoriza sua privacidade e está
          comprometido em proteger seus dados pessoais em conformidade com a Lei
          Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
        </Text>

        <Text fontSize="lg" bold>
          1. Dados coletados
        </Text>
        <Text>
          • Dados de conta: nome, e-mail e senha.{'\n'}• Localização: usada para
          exibir estabelecimentos próximos e calcular cashback.{'\n'}•
          Fotos/imagens: caso o usuário opte por enviar comprovantes ou
          cadastrar produtos.{'\n'}• Dados de uso do app: informações anônimas
          para melhorias de experiência.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          2. Como usamos os dados
        </Text>
        <Text>
          • Fornecer acesso à conta do usuário.{'\n'}• Exibir estabelecimentos
          próximos.{'\n'}• Registrar pedidos e gerar cashback.{'\n'}• Melhorar
          segurança e desempenho do app.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          3. Compartilhamento
        </Text>
        <Text>
          Não vendemos nem alugamos dados pessoais. Compartilhamos apenas com
          fornecedores de serviços essenciais (ex.: hospedagem) ou quando
          exigido por lei.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          4. Segurança
        </Text>
        <Text>
          Adotamos medidas técnicas e administrativas para proteger os dados
          contra acessos não autorizados, perda ou alteração.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          5. Direitos do usuário
        </Text>
        <Text>
          Conforme a LGPD, o usuário pode:{'\n'}• Solicitar acesso, correção ou
          exclusão de seus dados.{'\n'}• Revogar o consentimento para uso de
          localização ou imagens a qualquer momento.
        </Text>

        <Text fontSize="lg" bold mt={2}>
          6. Contato
        </Text>
        <Text>
          Para dúvidas ou solicitações, entre em contato:{'\n'}
          suporte@iaki.com.br
        </Text>
      </VStack>
    </ScrollView>
  )
}
