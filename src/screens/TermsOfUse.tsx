import React from 'react'

import { ScrollView, Linking } from 'react-native'

import { VStack, Text, IconButton, Icon, Box } from 'native-base'

import { useNavigation } from '@react-navigation/native'

import { Feather } from '@expo/vector-icons'

export function TermsOfUse() {
  const navigation = useNavigation()

  function openPrivacyPolicy() {
    Linking.openURL('https://www.iaki.com.br/politica-de-privacidade')
  }

  function openDeleteAccountPage() {
    Linking.openURL('https://www.iaki.com.br/excluir-conta')
  }

  function openWebsite() {
    Linking.openURL('https://www.iaki.com.br')
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
        {/* ==================================================
            VOLTAR
        ================================================== */}

        <IconButton
          borderRadius="full"
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          icon={<Icon as={Feather} name="chevron-left" size="8" />}
          onPress={() => navigation.goBack()}
        />

        {/* ==================================================
            TÍTULO
        ================================================== */}

        <Text fontSize="2xl" fontWeight="bold" mb={1}>
          Termos de Uso — Clube IAki
        </Text>

        <Text fontSize="sm" color="gray.600">
          Última atualização: 22/08/2026
        </Text>

        {/* ==================================================
            INTRODUÇÃO
        ================================================== */}

        <Text fontSize="md" color="gray.800" lineHeight="md">
          Bem-vindo ao Clube IAki. Estes Termos de Uso regulamentam o acesso e a
          utilização do aplicativo, site e demais serviços relacionados à
          plataforma.
        </Text>

        <Text fontSize="md" color="gray.800" lineHeight="md">
          Ao criar uma conta ou utilizar o Clube IAki, o usuário declara ter
          lido e compreendido estes Termos de Uso e a Política de Privacidade.
        </Text>

        <Text fontSize="md" color="gray.800" lineHeight="md">
          Caso não concorde com estas condições, o usuário não deverá utilizar
          os serviços da plataforma.
        </Text>

        {/* ==================================================
            1. IDENTIFICAÇÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          1. Identificação da plataforma
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
          Os estabelecimentos comerciais contratantes e parceiros são
          responsáveis pelas informações comerciais, produtos, preços, ofertas,
          promoções, brindes, campanhas, imagens, vídeos, banners, textos e
          demais conteúdos publicitários que cadastrarem ou disponibilizarem na
          plataforma.
        </Text>

        {/* ==================================================
            2. SOBRE O CLUBE IAKI
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          2. Sobre o Clube IAki
        </Text>

        <Text lineHeight="md">
          O Clube IAki é uma plataforma tecnológica destinada a aproximar
          consumidores e estabelecimentos comerciais parceiros.
        </Text>

        <Text lineHeight="md">
          Conforme a disponibilidade das funcionalidades, o usuário poderá:
          {'\n\n'}• Localizar lojas e estabelecimentos.
          {'\n'}• Consultar produtos e ofertas.
          {'\n'}• Criar pedidos.
          {'\n'}• Participar de campanhas de fidelização.
          {'\n'}• Acumular pontos.
          {'\n'}• Consultar saldos.
          {'\n'}• Trocar pontos por brindes e recompensas.
          {'\n'}• Consultar descontos e benefícios.
          {'\n'}• Participar de campanhas de cashback, quando disponíveis.
          {'\n'}• Consultar histórico de operações.
          {'\n'}• Avaliar estabelecimentos.
          {'\n'}• Gerenciar seu perfil.
        </Text>

        {/* ==================================================
            3. CADASTRO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          3. Cadastro e conta
        </Text>

        <Text lineHeight="md">
          Para acessar determinadas funcionalidades, o usuário deverá criar uma
          conta.
        </Text>

        <Text lineHeight="md">
          O usuário compromete-se a:
          {'\n\n'}• Fornecer informações verdadeiras, completas e atualizadas.
          {'\n'}• Não utilizar dados de terceiros sem autorização.
          {'\n'}• Manter seus dados cadastrais atualizados.
          {'\n'}• Proteger sua senha e demais credenciais de acesso.
          {'\n'}• Não compartilhar sua conta com terceiros de forma indevida.
        </Text>

        <Text lineHeight="md">
          O Clube IAki poderá adotar medidas de segurança para verificar
          informações e prevenir cadastros fraudulentos.
        </Text>

        {/* ==================================================
            4. SEGURANÇA DA CONTA
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          4. Segurança da conta
        </Text>

        <Text lineHeight="md">
          O usuário é responsável por manter suas credenciais em segurança.
        </Text>

        <Text lineHeight="md">
          Não é permitido:
          {'\n\n'}• Compartilhar senha com terceiros.
          {'\n'}• Fornecer códigos de recuperação de acesso.
          {'\n'}• Tentar acessar contas de outros usuários.
          {'\n'}• Utilizar credenciais obtidas de forma indevida.
        </Text>

        <Text lineHeight="md">
          Caso identifique acesso suspeito, o usuário deverá alterar suas
          credenciais ou entrar em contato com a equipe do Clube IAki.
        </Text>

        {/* ==================================================
            5. USO ADEQUADO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          5. Uso adequado da plataforma
        </Text>

        <Text lineHeight="md">
          O usuário deverá utilizar o Clube IAki exclusivamente para finalidades
          legítimas.
        </Text>

        <Text lineHeight="md">
          É proibido:
          {'\n\n'}• Criar contas falsas.
          {'\n'}• Utilizar identidade ou CPF de terceiros.
          {'\n'}• Simular compras.
          {'\n'}• Manipular ou tentar obter pontos indevidamente.
          {'\n'}• Fraudar pedidos.
          {'\n'}• Manipular resgates de brindes ou recompensas.
          {'\n'}• Explorar falhas do sistema.
          {'\n'}• Tentar obter acesso não autorizado.
          {'\n'}• Introduzir códigos maliciosos.
          {'\n'}• Interferir na segurança da plataforma.
          {'\n'}• Utilizar o serviço para práticas ilícitas.
        </Text>

        {/* ==================================================
            6. ESTABELECIMENTOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          6. Estabelecimentos parceiros
        </Text>

        <Text lineHeight="md">
          Os estabelecimentos parceiros possuem autonomia para cadastrar e
          administrar conteúdos relacionados aos próprios negócios.
        </Text>

        <Text lineHeight="md">
          Cada estabelecimento é responsável pelas informações que publicar,
          incluindo:
          {'\n\n'}• Produtos e serviços.
          {'\n'}• Descrições.
          {'\n'}• Preços.
          {'\n'}• Estoques e disponibilidade.
          {'\n'}• Ofertas.
          {'\n'}• Descontos.
          {'\n'}• Campanhas promocionais.
          {'\n'}• Regras de pontuação.
          {'\n'}• Brindes e recompensas.
          {'\n'}• Banners.
          {'\n'}• Reels e vídeos.
          {'\n'}• Fotografias.
          {'\n'}• Textos publicitários.
          {'\n'}• Demais conteúdos comerciais.
        </Text>

        <Text lineHeight="md">
          O estabelecimento deverá manter essas informações corretas,
          atualizadas e em conformidade com a legislação aplicável.
        </Text>

        <Text lineHeight="md">
          O Clube IAki atua como fornecedor da tecnologia utilizada para
          disponibilização e gerenciamento dessas informações, não sendo o autor
          dos conteúdos comerciais inseridos diretamente pelos estabelecimentos
          parceiros.
        </Text>

        {/* ==================================================
            7. PEDIDOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          7. Pedidos
        </Text>

        <Text lineHeight="md">
          O aplicativo poderá permitir que o usuário selecione produtos e crie
          pedidos vinculados a um estabelecimento parceiro.
        </Text>

        <Text lineHeight="md">
          A criação de um pedido no aplicativo não representa, necessariamente,
          pagamento ou conclusão definitiva da compra.
        </Text>

        <Text lineHeight="md">
          Dependendo da operação, o pedido poderá precisar de validação pelo
          estabelecimento para confirmação da compra e concessão de pontos ou
          benefícios.
        </Text>

        <Text lineHeight="md">
          Disponibilidade de produtos e estoque poderão sofrer alterações até a
          confirmação da operação.
        </Text>

        {/* ==================================================
            8. PAGAMENTO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          8. Pagamentos
        </Text>

        <Text lineHeight="md">
          Quando a plataforma não disponibilizar pagamento eletrônico próprio, o
          pagamento da compra será realizado diretamente entre o consumidor e o
          estabelecimento parceiro pelos meios oferecidos pela própria loja.
        </Text>

        <Text lineHeight="md">
          Nessas situações, o Clube IAki não recebe nem armazena informações de
          cartões utilizados diretamente no estabelecimento.
        </Text>

        {/* ==================================================
            9. PONTOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          9. Programa de pontos
        </Text>

        <Text lineHeight="md">
          Estabelecimentos parceiros poderão oferecer programas de fidelidade
          por pontos.
        </Text>

        <Text lineHeight="md">
          A quantidade de pontos poderá depender de fatores como:
          {'\n\n'}• Valor da compra.
          {'\n'}• Produtos elegíveis.
          {'\n'}• Campanhas vigentes.
          {'\n'}• Regras definidas pelo estabelecimento.
          {'\n'}• Validação da compra.
        </Text>

        <Text lineHeight="md">
          Os pontos poderão ser vinculados individualmente a cada
          estabelecimento e não constituem moeda, depósito financeiro ou
          investimento.
        </Text>

        <Text lineHeight="md">
          Salvo quando expressamente informado de outra forma, os pontos:
          {'\n\n'}• Não podem ser sacados em dinheiro.
          {'\n'}• Não possuem rendimento financeiro.
          {'\n'}• Não podem ser comercializados.
          {'\n'}• Não podem ser transferidos entre usuários.
          {'\n'}• São utilizados para obtenção de recompensas disponíveis no
          respectivo programa.
        </Text>

        {/* ==================================================
            10. VALIDAÇÃO DOS PONTOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          10. Validação das compras e pontos
        </Text>

        <Text lineHeight="md">
          Compras poderão precisar ser confirmadas ou validadas pelo
          estabelecimento antes que os pontos ou benefícios sejam
          definitivamente atribuídos.
        </Text>

        <Text lineHeight="md">
          Compras canceladas, inválidas, fraudulentas ou não confirmadas poderão
          não gerar pontos.
        </Text>

        {/* ==================================================
            11. BRINDES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          11. Brindes e recompensas
        </Text>

        <Text lineHeight="md">
          Os estabelecimentos poderão disponibilizar brindes, produtos,
          benefícios ou outras recompensas para resgate.
        </Text>

        <Text lineHeight="md">
          Cada recompensa poderá possuir:
          {'\n\n'}• Quantidade específica de pontos necessária.
          {'\n'}• Estoque limitado.
          {'\n'}• Descrição própria.
          {'\n'}• Regras específicas.
          {'\n'}• Período de validade.
          {'\n'}• Condições definidas pelo estabelecimento.
        </Text>

        <Text lineHeight="md">
          O resgate poderá depender de validação pelo estabelecimento parceiro.
        </Text>

        {/* ==================================================
            12. QR CODE
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          12. QR Code e validações digitais
        </Text>

        <Text lineHeight="md">
          Algumas operações poderão utilizar QR Code ou outros identificadores
          digitais para validar recompensas, resgates ou benefícios.
        </Text>

        <Text lineHeight="md">
          É proibido adulterar, reproduzir, compartilhar ou reutilizar códigos
          com finalidade fraudulenta.
        </Text>

        {/* ==================================================
            13. DESCONTOS E CASHBACK
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          13. Descontos, cashback e campanhas
        </Text>

        <Text lineHeight="md">
          Estabelecimentos parceiros poderão disponibilizar descontos, cashback,
          campanhas, cupons e outras vantagens.
        </Text>

        <Text lineHeight="md">
          Cada benefício poderá estar sujeito a condições próprias, tais como:
          {'\n\n'}• Período de validade.
          {'\n'}• Quantidade limitada.
          {'\n'}• Estoque disponível.
          {'\n'}• Valor mínimo de compra.
          {'\n'}• Produtos participantes.
          {'\n'}• Outras regras definidas na campanha.
        </Text>

        {/* ==================================================
            14. PREÇOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          14. Preços e informações comerciais
        </Text>

        <Text lineHeight="md">
          Os preços, descrições, disponibilidade e demais informações comerciais
          exibidas na plataforma são cadastrados ou administrados pelos
          respectivos estabelecimentos parceiros.
        </Text>

        <Text lineHeight="md">
          As lojas são responsáveis por manter suas informações comerciais
          atualizadas e por cumprir as ofertas que divulgarem, observada a
          legislação aplicável às relações de consumo.
        </Text>

        {/* ==================================================
            15. PUBLICIDADE
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          15. Publicidade e conteúdo comercial
        </Text>

        <Text lineHeight="md">
          Banners, imagens, vídeos, reels, ofertas, promoções, fotografias e
          demais conteúdos publicitários poderão ser cadastrados diretamente
          pelos estabelecimentos contratantes.
        </Text>

        <Text lineHeight="md">
          O estabelecimento que publicar determinado conteúdo é responsável por
          possuir os direitos necessários sobre imagens, marcas, textos e demais
          materiais utilizados, bem como por garantir que a publicidade esteja
          em conformidade com a legislação.
        </Text>

        <Text lineHeight="md">
          O Clube IAki poderá remover conteúdos que apresentem indícios de
          ilegalidade, fraude, violação de direitos de terceiros ou
          descumprimento destes Termos.
        </Text>

        {/* ==================================================
            16. LOCALIZAÇÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          16. Localização
        </Text>

        <Text lineHeight="md">
          O usuário poderá autorizar o aplicativo a utilizar a localização do
          dispositivo para encontrar estabelecimentos próximos e utilizar
          funcionalidades baseadas em distância.
        </Text>

        <Text lineHeight="md">
          Essa autorização poderá ser gerenciada nas configurações do
          dispositivo.
        </Text>

        {/* ==================================================
            17. AVALIAÇÕES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          17. Avaliações e conteúdo do usuário
        </Text>

        <Text lineHeight="md">
          Quando o Clube IAki permitir avaliações ou outros conteúdos produzidos
          pelo usuário, não será permitido publicar conteúdo:
          {'\n\n'}• Ilegal.
          {'\n'}• Fraudulento.
          {'\n'}• Discriminatório.
          {'\n'}• Ameaçador.
          {'\n'}• Ofensivo.
          {'\n'}• Que viole direitos de terceiros.
          {'\n'}• Que exponha indevidamente dados pessoais de terceiros.
        </Text>

        {/* ==================================================
            18. PROPRIEDADE INTELECTUAL
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          18. Propriedade intelectual
        </Text>

        <Text lineHeight="md">
          A marca Clube IAki, sua identidade visual, logotipos, interfaces,
          software, elementos gráficos, textos institucionais e demais conteúdos
          próprios são protegidos pela legislação aplicável.
        </Text>

        <Text lineHeight="md">
          O uso da plataforma não transfere ao usuário qualquer direito de
          propriedade sobre esses elementos.
        </Text>

        <Text lineHeight="md">
          Marcas, imagens, produtos e conteúdos pertencentes aos
          estabelecimentos parceiros permanecem de titularidade dos respectivos
          responsáveis.
        </Text>

        {/* ==================================================
            19. DISPONIBILIDADE
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          19. Disponibilidade da plataforma
        </Text>

        <Text lineHeight="md">
          O Clube IAki busca manter seus serviços disponíveis e funcionais, mas
          poderão ocorrer interrupções decorrentes de:
          {'\n\n'}• Manutenções.
          {'\n'}• Atualizações.
          {'\n'}• Falhas de infraestrutura.
          {'\n'}• Serviços de terceiros.
          {'\n'}• Problemas de conectividade.
          {'\n'}• Eventos fora do controle razoável da plataforma.
        </Text>

        <Text lineHeight="md">
          Sempre que possível, serão adotadas medidas para restabelecer o
          funcionamento do serviço.
        </Text>

        {/* ==================================================
            20. ATUALIZAÇÕES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          20. Atualizações do aplicativo
        </Text>

        <Text lineHeight="md">
          Algumas funcionalidades poderão depender da utilização de uma versão
          atualizada do aplicativo.
        </Text>

        <Text lineHeight="md">
          Versões antigas poderão deixar de funcionar corretamente em razão de
          alterações técnicas, de segurança ou compatibilidade.
        </Text>

        {/* ==================================================
            21. SUSPENSÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          21. Suspensão de conta
        </Text>

        <Text lineHeight="md">
          Uma conta poderá ser temporariamente restringida ou suspensa quando
          houver indícios razoáveis de:
          {'\n\n'}• Fraude.
          {'\n'}• Violação destes Termos.
          {'\n'}• Manipulação indevida de pontos ou recompensas.
          {'\n'}• Tentativa de acesso não autorizado.
          {'\n'}• Criação abusiva de contas.
          {'\n'}• Uso de identidade falsa.
          {'\n'}• Prejuízo a usuários, parceiros ou à plataforma.
          {'\n'}• Determinação legal ou de autoridade competente.
        </Text>

        {/* ==================================================
            22. EXCLUSÃO PELO APP
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          22. Exclusão da conta pelo usuário
        </Text>

        <Text lineHeight="md">
          O usuário poderá excluir sua própria conta diretamente pelo
          aplicativo.
        </Text>

        <Box
          bg="red.50"
          borderWidth={1}
          borderColor="red.100"
          borderRadius="lg"
          p={4}
        >
          <Text fontWeight="bold" color="red.700">
            Para excluir a conta:
          </Text>

          <Text mt={2} color="gray.700" lineHeight="md">
            Perfil → Editar Perfil → Excluir minha conta
          </Text>
        </Box>

        <Text lineHeight="md">
          Após a confirmação, o processo de exclusão será realizado e o acesso à
          conta será encerrado.
        </Text>

        {/* ==================================================
            23. EXCLUSÃO PELO SITE
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          23. Exclusão sem acesso ao aplicativo
        </Text>

        <Text lineHeight="md">
          Caso o usuário não consiga acessar sua conta pelo aplicativo, poderá
          enviar uma solicitação pela página:
        </Text>

        <Text
          color="blue.600"
          fontWeight="semibold"
          onPress={openDeleteAccountPage}
        >
          www.iaki.com.br/excluir-conta
        </Text>

        <Text lineHeight="md">
          A equipe utilizará as informações fornecidas para localizar a conta e
          processar a solicitação.
        </Text>

        {/* ==================================================
            24. EFEITOS DA EXCLUSÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          24. Efeitos da exclusão
        </Text>

        <Text lineHeight="md">
          A exclusão resulta na remoção ou anonimização dos dados pessoais
          diretamente associados ao cadastro, conforme aplicável.
        </Text>

        <Text lineHeight="md">
          Alguns registros históricos poderão permanecer de forma anonimizada
          quando necessários para:
          {'\n\n'}• Integridade de pedidos.
          {'\n'}• Histórico de pontos.
          {'\n'}• Recompensas e resgates.
          {'\n'}• Segurança.
          {'\n'}• Auditoria.
          {'\n'}• Prevenção de fraude.
          {'\n'}• Cumprimento de obrigação legal.
          {'\n'}• Exercício regular de direitos.
        </Text>

        {/* ==================================================
            25. NOVO CADASTRO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          25. Novo cadastro após a exclusão
        </Text>

        <Text lineHeight="md">
          Após a exclusão, o antigo acesso deixará de existir.
        </Text>

        <Text lineHeight="md">
          Caso queira utilizar o Clube IAki novamente no futuro e não exista
          impedimento legítimo relacionado à segurança ou fraude, o usuário
          poderá realizar um novo cadastro.
        </Text>

        {/* ==================================================
            26. PRIVACIDADE
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          26. Privacidade e proteção de dados
        </Text>

        <Text lineHeight="md">
          O tratamento de dados pessoais realizado através da plataforma é
          detalhado na Política de Privacidade do Clube IAki.
        </Text>

        <Text
          color="blue.600"
          fontWeight="semibold"
          onPress={openPrivacyPolicy}
        >
          Consultar Política de Privacidade
        </Text>

        {/* ==================================================
            27. RESPONSABILIDADES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          27. Responsabilidades
        </Text>

        <Text lineHeight="md">
          Cada parte será responsável pelos próprios atos e omissões conforme a
          legislação aplicável.
        </Text>

        <Text lineHeight="md">
          O Clube IAki é responsável pela operação tecnológica da plataforma
          dentro dos limites de sua atuação.
        </Text>

        <Text lineHeight="md">
          Os estabelecimentos comerciais parceiros são responsáveis por suas
          ofertas, produtos, serviços, preços, estoques, publicidade e demais
          informações comerciais que cadastrarem.
        </Text>

        <Text lineHeight="md">
          Nada nestes Termos pretende excluir ou limitar direitos assegurados
          aos consumidores pela legislação brasileira.
        </Text>

        {/* ==================================================
            28. ADMINISTRADORES DAS LOJAS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          28. Administradores dos estabelecimentos
        </Text>

        <Text lineHeight="md">
          Usuários autorizados a administrar estabelecimentos deverão utilizar
          as funcionalidades administrativas exclusivamente para as lojas às
          quais estiverem vinculados.
        </Text>

        <Text lineHeight="md">
          É proibido tentar acessar informações de outros estabelecimentos ou
          utilizar informações obtidas através da plataforma para finalidades
          incompatíveis com o serviço.
        </Text>

        {/* ==================================================
            29. PLANOS
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          29. Planos e serviços para estabelecimentos
        </Text>

        <Text lineHeight="md">
          Estabelecimentos parceiros poderão contratar planos, assinaturas ou
          serviços disponibilizados pelo Clube IAki.
        </Text>

        <Text lineHeight="md">
          Cada plano poderá possuir limites e funcionalidades específicas
          relacionadas, por exemplo, à quantidade de produtos, campanhas,
          banners, reels ou outros recursos da plataforma.
        </Text>

        <Text lineHeight="md">
          Condições comerciais específicas poderão ser apresentadas
          separadamente ao estabelecimento contratante.
        </Text>

        {/* ==================================================
            30. ALTERAÇÕES
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          30. Alterações destes Termos
        </Text>

        <Text lineHeight="md">
          Estes Termos poderão ser atualizados em razão de alterações legais,
          novas funcionalidades, melhorias de segurança, mudanças operacionais
          ou evolução dos serviços.
        </Text>

        <Text lineHeight="md">
          Quando houver alteração relevante, o Clube IAki poderá informar os
          usuários através do aplicativo, site, e-mail ou outro canal
          apropriado.
        </Text>

        {/* ==================================================
            31. LEGISLAÇÃO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          31. Legislação aplicável
        </Text>

        <Text lineHeight="md">
          Estes Termos são regidos pelas leis da República Federativa do Brasil,
          incluindo, quando aplicáveis, a Lei Geral de Proteção de Dados
          Pessoais, o Marco Civil da Internet e o Código de Defesa do
          Consumidor.
        </Text>

        <Text lineHeight="md">
          Eventuais conflitos deverão observar os órgãos e foros competentes
          definidos pela legislação brasileira, inclusive os direitos
          assegurados ao consumidor quando aplicáveis.
        </Text>

        {/* ==================================================
            32. CONTATO
        ================================================== */}

        <Text fontSize="lg" fontWeight="bold" mt={2}>
          32. Contato e suporte
        </Text>

        <Text lineHeight="md">
          Para dúvidas, suporte, privacidade ou assuntos relacionados à conta:
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

        {/* ==================================================
            AVISO FINAL
        ================================================== */}

        <Text
          mt={4}
          fontSize="xs"
          color="gray.500"
          textAlign="center"
          lineHeight="sm"
        >
          Ao criar uma conta ou continuar utilizando o Clube IAki, o usuário
          declara ter ciência destes Termos de Uso e da Política de Privacidade
          da plataforma.
        </Text>
      </VStack>
    </ScrollView>
  )
}
