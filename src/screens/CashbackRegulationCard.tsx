import React, { useCallback } from 'react'

import { Pressable, StyleSheet, Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation } from '@react-navigation/native'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

type StepProps = {
  icon:
    | 'shopping-cart'
    | 'store'
    | 'verified'
    | 'stars'
    | 'card-giftcard'
    | 'qr-code'

  number: number

  title: string

  description: string
}

function FlowStep({ icon, number, title, description }: StepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <MaterialIcons name={icon} size={20} color="#1D4ED8" />
      </View>

      <View style={styles.stepContent}>
        <View style={styles.stepTitleRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{number}</Text>
          </View>

          <Text style={styles.stepTitle}>{title}</Text>
        </View>

        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  )
}

export function CashbackRegulationCard() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  /* =====================================
     INFORMAÇÕES
  ===================================== */

  const handleOpenAbout = useCallback(() => {
    navigation.navigate('about')
  }, [navigation])

  /*
   * Mantidos separados para que depois
   * possamos direcionar cada um para uma
   * rota específica sem alterar o layout.
   *
   * Atualmente os dois preservam o
   * comportamento existente da tela About.
   */
  const handleOpenPrivacy = useCallback(() => {
    navigation.navigate('about')
  }, [navigation])

  const handleOpenTerms = useCallback(() => {
    navigation.navigate('about')
  }, [navigation])

  return (
    <View style={styles.card}>
      {/* =================================
          CABEÇALHO
      ================================= */}

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="stars" size={25} color="#1D4ED8" />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Como funciona o Clube IAki</Text>

          <Text style={styles.subtitle}>
            Compre, acumule pontos e troque por brindes.
          </Text>
        </View>
      </View>

      {/* =================================
          FLUXO
      ================================= */}

      <View style={styles.steps}>
        <FlowStep
          number={1}
          icon="shopping-cart"
          title="Faça seu pedido"
          description="Escolha os produtos da loja, adicione ao carrinho e finalize o pedido pelo aplicativo."
        />

        <View style={styles.divider} />

        <FlowStep
          number={2}
          icon="store"
          title="Vá até a loja"
          description="Após finalizar o pedido, dirija-se à loja escolhida para concluir sua compra."
        />

        <View style={styles.divider} />

        <FlowStep
          number={3}
          icon="verified"
          title="Confirme a compra"
          description="Informe seu pedido ao atendente. A loja fará a validação depois que a compra for confirmada."
        />

        <View style={styles.divider} />

        <FlowStep
          number={4}
          icon="stars"
          title="Receba seus pontos"
          description="Depois da validação, os pontos da compra são creditados na sua carteira daquela loja."
        />

        <View style={styles.divider} />

        <FlowStep
          number={5}
          icon="card-giftcard"
          title="Escolha seu brinde"
          description="Consulte os brindes disponíveis na loja e escolha uma recompensa quando tiver pontos suficientes."
        />

        <View style={styles.divider} />

        <FlowStep
          number={6}
          icon="qr-code"
          title="Resgate na loja"
          description="Solicite o resgate pelo aplicativo e apresente o código de validação na loja para receber seu brinde."
        />
      </View>

      {/* =================================
          DESTAQUE
      ================================= */}

      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={19} color="#1D4ED8" />

        <Text style={styles.infoText}>
          Os pontos são acumulados separadamente em cada loja participante.
        </Text>
      </View>

      {/* =================================
          INFORMAÇÕES
      ================================= */}

      <Pressable
        onPress={handleOpenAbout}
        style={({ pressed }) => [styles.aboutButton, pressed && styles.pressed]}
      >
        <MaterialIcons name="info-outline" size={20} color="#4B5563" />

        <Text style={styles.aboutText}>
          Mais informações sobre o Clube IAki
        </Text>

        <MaterialIcons name="chevron-right" size={23} color="#9CA3AF" />
      </Pressable>

      {/* =================================
          DOCUMENTOS LEGAIS
      ================================= */}

      <View style={styles.legalContainer}>
        <Text style={styles.legalTitle}>Informações legais</Text>

        <Pressable
          onPress={handleOpenPrivacy}
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}
        >
          <MaterialIcons name="privacy-tip" size={19} color="#1D4ED8" />

          <Text style={styles.legalLinkText}>Política de Privacidade</Text>

          <MaterialIcons name="open-in-new" size={17} color="#6B7280" />
        </Pressable>

        <View style={styles.legalDivider} />

        <Pressable
          onPress={handleOpenTerms}
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}
        >
          <MaterialIcons name="description" size={19} color="#1D4ED8" />

          <Text style={styles.legalLinkText}>Termos de Uso</Text>

          <MaterialIcons name="open-in-new" size={17} color="#6B7280" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,

    marginTop: 8,

    marginBottom: 18,

    paddingHorizontal: 16,

    paddingTop: 18,

    paddingBottom: 14,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: '#DBEAFE',

    backgroundColor: '#FFFFFF',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,

    shadowRadius: 6,

    elevation: 2,
  },

  /* ==================================
     CABEÇALHO
  ================================== */

  header: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 18,
  },

  headerIcon: {
    width: 44,

    height: 44,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#EFF6FF',
  },

  headerText: {
    flex: 1,

    minWidth: 0,

    marginLeft: 12,
  },

  title: {
    fontSize: 17,

    lineHeight: 22,

    fontWeight: '700',

    color: '#1F2937',
  },

  subtitle: {
    marginTop: 3,

    fontSize: 13,

    lineHeight: 18,

    color: '#6B7280',
  },

  /* ==================================
     PASSOS
  ================================== */

  steps: {
    width: '100%',
  },

  step: {
    flexDirection: 'row',

    alignItems: 'flex-start',
  },

  stepIcon: {
    width: 38,

    height: 38,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,

    backgroundColor: '#EFF6FF',
  },

  stepContent: {
    flex: 1,

    minWidth: 0,

    marginLeft: 11,

    paddingTop: 1,
  },

  stepTitleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    flexWrap: 'wrap',
  },

  stepNumber: {
    width: 20,

    height: 20,

    marginRight: 6,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#1D4ED8',
  },

  stepNumberText: {
    fontSize: 11,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  stepTitle: {
    flexShrink: 1,

    fontSize: 14,

    lineHeight: 19,

    fontWeight: '700',

    color: '#374151',
  },

  stepDescription: {
    marginTop: 4,

    fontSize: 13,

    lineHeight: 19,

    color: '#6B7280',
  },

  divider: {
    width: 1,

    height: 14,

    marginLeft: 18,

    marginVertical: 3,

    backgroundColor: '#DBEAFE',
  },

  /* ==================================
     INFORMAÇÃO
  ================================== */

  infoBox: {
    marginTop: 18,

    paddingHorizontal: 12,

    paddingVertical: 11,

    borderRadius: 12,

    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: '#EFF6FF',
  },

  infoText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 12,

    lineHeight: 18,

    fontWeight: '500',

    color: '#4B5563',
  },

  /* ==================================
     SOBRE
  ================================== */

  aboutButton: {
    minHeight: 48,

    marginTop: 14,

    paddingHorizontal: 4,

    flexDirection: 'row',

    alignItems: 'center',

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: '#E5E7EB',
  },

  aboutText: {
    flex: 1,

    marginLeft: 9,

    fontSize: 13,

    fontWeight: '600',

    color: '#4B5563',
  },

  /* ==================================
     LEGAL
  ================================== */

  legalContainer: {
    marginTop: 14,

    paddingTop: 4,
  },

  legalTitle: {
    marginBottom: 4,

    fontSize: 12,

    fontWeight: '600',

    color: '#9CA3AF',

    textTransform: 'uppercase',

    letterSpacing: 0.4,
  },

  legalLink: {
    minHeight: 44,

    flexDirection: 'row',

    alignItems: 'center',
  },

  legalLinkText: {
    flex: 1,

    marginLeft: 9,

    fontSize: 13,

    fontWeight: '600',

    color: '#374151',
  },

  legalDivider: {
    height: StyleSheet.hairlineWidth,

    marginLeft: 28,

    backgroundColor: '#E5E7EB',
  },

  pressed: {
    opacity: 0.6,
  },
})
