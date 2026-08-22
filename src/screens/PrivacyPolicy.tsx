import React from 'react'

import { ScrollView, Linking } from 'react-native'

import { VStack, Text, IconButton, Icon, Box } from 'native-base'

import { useNavigation } from '@react-navigation/native'

import { Feather } from '@expo/vector-icons'

export function PrivacyPolicy() {
  const navigation = useNavigation()

  function openWebsite() {
    Linking.openURL('https://www.iaki.com.br')
  }

  function openDeleteAccountPage() {
    Linking.openURL('https://www.iaki.com.br/excluir-conta')
  }

  function openEmail() {
    Linking.openURL('mailto:contato@iaki.com.br')
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#fff',
      }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 48,
      }}
    >
      <VStack space={4}>
        {/* BOTÃO VOLTAR */}

        <IconButton
          borderRadius="full"
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          icon={<Icon as={Feather} name="chevron-left" size="8" />}
          onPress={() => navigation.goBack()}
        />

        {/* TÍTULO */}

        <Text fontSize="2xl" fontWeight="bold" mb={1}>
          Política de Privacidade — Clube IAki
        </Text>

        <Text fontSize="sm" color="gray.600">
          Última atualização: 22/08/2026
        </Text>

        {/* INTRODUÇÃO */}

        <Text fontSize="md" color="gray.800" lineHeight="md">
          A sua privacidade é importante para o Clube IAki. Esta Política de
          Privacidade explica como coletamos, utilizamos, armazenamos,
          protegemos e, quando necessário, compartilhamos dados pessoais dos
          usuários do aplicativo Clube IAki, do site www.iaki.com.br e dos
          serviços relacionados à plataforma.
        </Text>

        <Text fontSize="md" color="gray.800" lineHeight="md">
          O tratamento de dados pessoais é realizado em conformidade com a
          legislação brasileira aplicável, especialmente a Lei nº 13.709/2018 —
          Lei Geral de Proteção de Dados Pessoais (LGPD).
        </Text>

        {/* ==================================================
            1. IDENTIFICAÇÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          1. Identificação do responsável
        </Text>

        <Box
          bg="gray.50"
          borderWidth={1}
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
        >
          <Text lineHeight="md">
            <Text fontWeight="bold">Plataforma:</Text> Clube IAki
            {'\n'}
            <Text fontWeight="bold">
              Desenvolvedor e responsável pela operação tecnológica:
            </Text>{' '}
            Jânio Florêncio dos Santos
            {'\n'}
            <Text fontWeight="bold">Site:</Text> www.iaki.com.br
            {'\n'}
            <Text fontWeight="bold">E-mail:</Text> contato@iaki.com.br
          </Text>
        </Box>

        <Text lineHeight="md">
          Jânio Florêncio dos Santos é responsável pelo desenvolvimento,
          manutenção e operação tecnológica da plataforma Clube IAki.
        </Text>

        <Text lineHeight="md">
          Os estabelecimentos comerciais contratantes e parceiros do Clube IAki
          são responsáveis pelas informações comerciais que publicam ou
          disponibilizam na plataforma, incluindo produtos, preços, ofertas,
          descontos, campanhas, brindes, recompensas, banners, vídeos, imagens,
          textos publicitários e demais conteúdos relacionados aos seus
          estabelecimentos.
        </Text>

        {/* ==================================================
            2. SOBRE O IAKI
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          2. Sobre o Clube IAki
        </Text>

        <Text lineHeight="md">
          O Clube IAki é uma plataforma tecnológica destinada a aproximar
          consumidores e estabelecimentos comerciais parceiros, permitindo que
          usuários encontrem lojas, produtos, ofertas e campanhas de
          fidelização.
        </Text>

        <Text lineHeight="md">
          Entre as funcionalidades disponibilizadas poderão estar:
          {'\n\n'}• Consulta a lojas e estabelecimentos.
          {'\n'}• Consulta a produtos e ofertas.
          {'\n'}• Identificação de estabelecimentos próximos.
          {'\n'}• Criação e acompanhamento de pedidos.
          {'\n'}• Acumulação de pontos.
          {'\n'}• Consulta de saldo de pontos por estabelecimento.
          {'\n'}• Troca de pontos por brindes e recompensas.
          {'\n'}• Acesso a descontos e benefícios.
          {'\n'}• Histórico de pedidos e movimentações.
          {'\n'}• Avaliação de estabelecimentos.
          {'\n'}• Gerenciamento do perfil do usuário.
        </Text>

        {/* ==================================================
            3. DADOS COLETADOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          3. Dados pessoais coletados
        </Text>

        <Text lineHeight="md">
          Para criação e utilização da conta, poderão ser tratados os seguintes
          dados:
          {'\n\n'}• Nome completo.
          {'\n'}• Endereço de e-mail.
          {'\n'}• Telefone.
          {'\n'}• CPF.
          {'\n'}• Cidade.
          {'\n'}• Rua e endereço informado.
          {'\n'}• Estado.
          {'\n'}• CEP.
          {'\n'}• Foto de perfil ou avatar, quando adicionada pelo usuário.
        </Text>

        <Text lineHeight="md">
          A senha do usuário é armazenada de forma protegida utilizando técnicas
          criptográficas de hash. O Clube IAki não necessita armazenar a senha
          original de forma legível.
        </Text>

        {/* ==================================================
            4. LOCALIZAÇÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          4. Dados de localização
        </Text>

        <Text lineHeight="md">
          Mediante autorização do usuário e quando necessário para determinada
          funcionalidade, o Clube IAki poderá utilizar informações de
          localização do dispositivo.
        </Text>

        <Text lineHeight="md">
          A localização poderá ser utilizada para:
          {'\n\n'}• Identificar estabelecimentos próximos.
          {'\n'}• Exibir lojas disponíveis na região.
          {'\n'}• Ordenar estabelecimentos por proximidade.
          {'\n'}• Apresentar ofertas e serviços disponíveis na cidade
          selecionada.
          {'\n'}• Melhorar funcionalidades dependentes de localização.
        </Text>

        <Text lineHeight="md">
          O usuário poderá controlar a permissão de localização diretamente nas
          configurações do dispositivo.
        </Text>

        {/* ==================================================
            5. DADOS DE USO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          5. Dados relacionados ao uso da plataforma
        </Text>

        <Text lineHeight="md">
          Durante a utilização do Clube IAki poderão ser registrados dados
          relacionados às operações realizadas, incluindo:
          {'\n\n'}• Produtos selecionados.
          {'\n'}• Itens adicionados ao carrinho.
          {'\n'}• Pedidos realizados.
          {'\n'}• Pedidos validados.
          {'\n'}• Histórico de pedidos.
          {'\n'}• Loja relacionada a cada operação.
          {'\n'}• Pontos acumulados.
          {'\n'}• Movimentações de pontos.
          {'\n'}• Recompensas disponíveis.
          {'\n'}• Brindes e recompensas resgatados.
          {'\n'}• Cupons e benefícios utilizados.
          {'\n'}• Avaliações realizadas.
          {'\n'}• Participação em campanhas promocionais.
        </Text>

        {/* ==================================================
            6. DADOS TÉCNICOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          6. Dados técnicos e de segurança
        </Text>

        <Text lineHeight="md">
          Também poderão ser tratados dados técnicos necessários ao
          funcionamento e à segurança da plataforma, como:
          {'\n\n'}• Endereço IP.
          {'\n'}• Data e horário de acesso.
          {'\n'}• Registros de autenticação.
          {'\n'}• Identificadores de sessão.
          {'\n'}• Tokens de autenticação.
          {'\n'}• Registros técnicos de requisições.
          {'\n'}• Informações utilizadas para identificação de falhas.
          {'\n'}• Registros de erros e eventos de segurança.
        </Text>

        {/* ==================================================
            7. FINALIDADES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          7. Como utilizamos os dados
        </Text>

        <Text lineHeight="md">
          Os dados poderão ser utilizados para:
          {'\n\n'}• Criar e autenticar a conta do usuário.
          {'\n'}• Permitir a utilização das funcionalidades da plataforma.
          {'\n'}• Exibir lojas, produtos e ofertas.
          {'\n'}• Processar e registrar pedidos.
          {'\n'}• Registrar compras validadas.
          {'\n'}• Calcular e atribuir pontos.
          {'\n'}• Permitir resgate de brindes e recompensas.
          {'\n'}• Gerenciar descontos e benefícios.
          {'\n'}• Recuperar o acesso à conta.
          {'\n'}• Enviar comunicações relacionadas ao cadastro, segurança e
          operações.
          {'\n'}• Prevenir fraudes e acessos indevidos.
          {'\n'}• Melhorar segurança, funcionamento e desempenho da plataforma.
          {'\n'}• Cumprir obrigações legais e regulatórias.
        </Text>

        {/* ==================================================
            8. LOJAS PARCEIRAS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          8. Lojas e estabelecimentos parceiros
        </Text>

        <Text lineHeight="md">
          Os estabelecimentos comerciais contratantes do Clube IAki possuem
          autonomia para cadastrar e administrar conteúdos relacionados aos
          próprios negócios.
        </Text>

        <Text lineHeight="md">
          Cada loja parceira é responsável pela veracidade, atualização,
          disponibilidade e legalidade dos conteúdos comerciais que publicar,
          incluindo:
          {'\n\n'}• Produtos e serviços.
          {'\n'}• Descrições.
          {'\n'}• Preços.
          {'\n'}• Estoques.
          {'\n'}• Ofertas.
          {'\n'}• Descontos.
          {'\n'}• Campanhas promocionais.
          {'\n'}• Pontuação.
          {'\n'}• Brindes.
          {'\n'}• Recompensas.
          {'\n'}• Banners.
          {'\n'}• Reels e vídeos.
          {'\n'}• Fotografias.
          {'\n'}• Textos e demais conteúdos publicitários.
        </Text>

        <Text lineHeight="md">
          O Clube IAki atua como plataforma tecnológica para disponibilização e
          gerenciamento dessas informações, não sendo responsável pela criação
          de conteúdo publicitário produzido e publicado diretamente pelos
          estabelecimentos parceiros.
        </Text>

        {/* ==================================================
            9. COMPARTILHAMENTO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          9. Compartilhamento de dados
        </Text>

        <Text lineHeight="md">
          O Clube IAki não comercializa dados pessoais dos usuários.
        </Text>

        <Text lineHeight="md">
          Dados poderão ser compartilhados apenas quando necessário para o
          funcionamento dos serviços, incluindo:
          {'\n\n'}• Estabelecimentos parceiros envolvidos em uma operação.
          {'\n'}• Prestadores de serviços de hospedagem e infraestrutura.
          {'\n'}• Serviços de banco de dados.
          {'\n'}• Serviços de armazenamento de imagens.
          {'\n'}• Serviços de envio de e-mails.
          {'\n'}• Serviços de segurança e monitoramento.
          {'\n'}• Autoridades públicas, mediante obrigação legal, ordem judicial
          ou solicitação válida.
        </Text>

        {/* ==================================================
            10. SEGURANÇA
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          10. Segurança dos dados
        </Text>

        <Text lineHeight="md">
          O Clube IAki adota medidas técnicas e administrativas destinadas a
          proteger os dados contra acesso não autorizado, perda, alteração,
          destruição ou divulgação indevida.
        </Text>

        <Text lineHeight="md">
          Entre as medidas utilizadas estão:
          {'\n\n'}• Autenticação por tokens.
          {'\n'}• Senhas armazenadas por hash.
          {'\n'}• Controle de acesso baseado em perfis.
          {'\n'}• Separação de permissões entre usuários, administradores e
          superadministradores.
          {'\n'}• Uso de conexões seguras por HTTPS.
          {'\n'}• Infraestrutura protegida para armazenamento de dados.
          {'\n'}• Backups e procedimentos de recuperação.
        </Text>

        {/* ==================================================
            11. RETENÇÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          11. Armazenamento e retenção
        </Text>

        <Text lineHeight="md">
          Os dados serão mantidos pelo período necessário para cumprir as
          finalidades descritas nesta Política e atender obrigações legais,
          regulatórias, contratuais, de segurança e de exercício regular de
          direitos.
        </Text>

        <Text lineHeight="md">
          Determinados registros relacionados a pedidos, movimentações de
          pontos, recompensas, segurança e auditoria poderão permanecer
          armazenados após a exclusão da conta, sempre que necessário e
          permitido pela legislação aplicável.
        </Text>

        {/* ==================================================
            12. EXCLUSÃO DA CONTA
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          12. Exclusão da conta
        </Text>

        <Text lineHeight="md">
          O Clube IAki disponibiliza ao usuário autenticado uma opção para
          excluir diretamente sua própria conta.
        </Text>

        <Box
          bg="red.50"
          borderWidth={1}
          borderColor="red.100"
          borderRadius="lg"
          p={4}
        >
          <Text fontWeight="bold" color="red.700">
            Exclusão pelo aplicativo
          </Text>

          <Text mt={2} color="gray.700" lineHeight="md">
            Acesse:
            {'\n\n'}
            Perfil → Editar Perfil → Excluir minha conta
          </Text>
        </Box>

        <Text lineHeight="md">
          Após a confirmação, os dados pessoais associados à conta serão
          removidos ou anonimizados conforme aplicável, e o acesso à conta será
          encerrado.
        </Text>

        <Text lineHeight="md">
          O usuário receberá uma confirmação da exclusão no e-mail originalmente
          cadastrado, quando tecnicamente possível.
        </Text>

        {/* ==================================================
            13. EXCLUSÃO PELO SITE
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          13. Solicitação de exclusão pelo site
        </Text>

        <Text lineHeight="md">
          Caso o usuário não consiga acessar sua conta pelo aplicativo, poderá
          solicitar a exclusão através da página pública:
        </Text>

        <Text
          color="blue.600"
          fontWeight="semibold"
          onPress={openDeleteAccountPage}
        >
          www.iaki.com.br/excluir-conta
        </Text>

        <Text lineHeight="md">
          A solicitação será encaminhada à equipe do Clube IAki para localização
          da conta e processamento da exclusão.
        </Text>

        {/* ==================================================
            14. EFEITOS DA EXCLUSÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          14. O que acontece após a exclusão
        </Text>

        <Text lineHeight="md">
          Após a exclusão, dados pessoais diretamente associados ao cadastro
          poderão ser removidos ou anonimizados, incluindo:
          {'\n\n'}• Nome.
          {'\n'}• E-mail.
          {'\n'}• Telefone.
          {'\n'}• CPF.
          {'\n'}• Foto de perfil.
          {'\n'}• Rua e informações pessoais de endereço.
          {'\n'}• Credenciais utilizadas para acesso à conta.
        </Text>

        <Text lineHeight="md">
          Alguns registros históricos poderão permanecer vinculados
          exclusivamente a uma identificação técnica anonimizada quando
          necessários para:
          {'\n\n'}• Integridade dos pedidos.
          {'\n'}• Histórico de movimentações de pontos.
          {'\n'}• Registro de recompensas e resgates.
          {'\n'}• Auditoria.
          {'\n'}• Segurança.
          {'\n'}• Prevenção de fraude.
          {'\n'}• Cumprimento de obrigações legais.
          {'\n'}• Exercício regular de direitos.
        </Text>

        {/* ==================================================
            15. DIREITOS DO USUÁRIO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          15. Direitos do usuário
        </Text>

        <Text lineHeight="md">
          Nos termos da LGPD, o usuário poderá exercer os direitos legalmente
          aplicáveis relacionados aos seus dados pessoais, incluindo:
          {'\n\n'}• Confirmação da existência de tratamento.
          {'\n'}• Acesso aos dados pessoais.
          {'\n'}• Correção de dados incompletos, inexatos ou desatualizados.
          {'\n'}• Solicitação de anonimização, bloqueio ou eliminação nas
          hipóteses previstas em lei.
          {'\n'}• Informação sobre compartilhamento.
          {'\n'}• Revogação de consentimento quando aplicável.
          {'\n'}• Oposição ao tratamento nas situações previstas pela
          legislação.
          {'\n'}• Solicitação de exclusão da conta.
        </Text>

        {/* ==================================================
            16. PERMISSÕES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          16. Permissões do dispositivo
        </Text>

        <Text lineHeight="md">
          Algumas funcionalidades poderão solicitar permissões específicas do
          dispositivo, como acesso à localização e à galeria de imagens.
        </Text>

        <Text lineHeight="md">
          O usuário poderá conceder ou revogar essas permissões através das
          configurações do dispositivo. A revogação poderá limitar apenas as
          funcionalidades que dependam daquela permissão.
        </Text>

        {/* ==================================================
            17. CRIANÇAS E ADOLESCENTES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          17. Crianças e adolescentes
        </Text>

        <Text lineHeight="md">
          O Clube IAki não deverá ser utilizado por pessoa sem capacidade legal
          adequada sem participação, assistência ou representação de responsável
          legal, quando exigida pela legislação.
        </Text>

        {/* ==================================================
            18. ALTERAÇÕES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          18. Alterações desta Política
        </Text>

        <Text lineHeight="md">
          Esta Política poderá ser atualizada para refletir novas
          funcionalidades, mudanças tecnológicas, alterações operacionais ou
          exigências legais.
        </Text>

        <Text lineHeight="md">
          A versão mais recente será disponibilizada no aplicativo e nos canais
          oficiais do Clube IAki.
        </Text>

        {/* ==================================================
            19. CONTATO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          19. Contato
        </Text>

        <Text lineHeight="md">
          Para dúvidas, solicitações relacionadas à privacidade, exercício de
          direitos ou exclusão de conta:
        </Text>

        <Box
          bg="gray.50"
          borderWidth={1}
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
        >
          <Text>
            <Text fontWeight="bold">Clube IAki</Text>
            {'\n'}
            Desenvolvedor e responsável pela operação tecnológica:
            {'\n'}
            <Text fontWeight="bold">Jânio Florêncio dos Santos</Text>
          </Text>

          <Text
            mt={3}
            color="blue.600"
            fontWeight="semibold"
            onPress={openEmail}
          >
            contato@iaki.com.br
          </Text>

          <Text
            mt={2}
            color="blue.600"
            fontWeight="semibold"
            onPress={openWebsite}
          >
            www.iaki.com.br
          </Text>
        </Box>

        {/* AVISO FINAL */}

        <Text
          mt={4}
          fontSize="xs"
          color="gray.500"
          textAlign="center"
          lineHeight="sm"
        >
          Ao utilizar o Clube IAki, o usuário declara ter ciência desta Política
          de Privacidade e das condições de tratamento de dados aqui
          apresentadas.
        </Text>
      </VStack>
    </ScrollView>
  )
}
