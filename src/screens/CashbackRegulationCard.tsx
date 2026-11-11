import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import type { AppNavigatorRoutesProps } from '@routes/app.routes'

type IconName = React.ComponentProps<typeof MaterialIcons>['name']

const steps: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'shopping-cart',
    title: 'Registre seu pedido',
    description:
      'Escolha os produtos de uma loja e finalize o pedido no app. O pagamento é feito diretamente com o estabelecimento.',
  },
  {
    icon: 'store',
    title: 'Compre na loja ou solicite entrega',
    description:
      'Apresente o pedido na loja. Se ela oferecer entrega, toque em “Solicitar entrega” e envie a mensagem pelo WhatsApp para combinar taxa, prazo e pagamento.',
  },
  {
    icon: 'stars',
    title: 'Receba seus pontos',
    description:
      'Depois de confirmar o pagamento, a loja valida a compra. Você ganha 1 ponto a cada R$ 10 pagos, após os descontos.',
  },
  {
    icon: 'card-giftcard',
    title: 'Troque seus pontos por brindes',
    description:
      'Em “Resgates”, escolha a loja e toque em “Ver brindes da loja”. Solicite um brinde disponível e apresente o QR Code na loja para concluir o resgate.',
  },
]

const links: { icon: IconName; label: string }[] = [
  { icon: 'info-outline', label: 'Sobre o Clube IAkí' },
  { icon: 'privacy-tip', label: 'Política de Privacidade' },
  { icon: 'description', label: 'Termos de Uso' },
]

export function CashbackRegulationCard() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="stars" size={26} color="#6D28D9" />
        </View>
        <View style={styles.fill}>
          <Text accessibilityRole="header" style={styles.title}>
            Como funciona o Clube IAkí
          </Text>
          <Text style={styles.subtitle}>
            Suas compras nas lojas parceiras valem pontos e brindes.
          </Text>
        </View>
      </View>

      {steps.map(({ icon, title, description }, index) => (
        <View key={title} style={styles.step}>
          <View style={styles.stepRail}>
            <View style={styles.stepIcon}>
              <MaterialIcons name={icon} size={19} color="#6D28D9" />
            </View>
            {index < steps.length - 1 && <View style={styles.connector} />}
          </View>
          <View style={[styles.fill, styles.stepContent]}>
            <Text style={styles.stepTitle}>
              {index + 1}. {title}
            </Text>
            <Text style={styles.body}>{description}</Text>
          </View>
        </View>
      ))}

      <View style={styles.notice}>
        <MaterialIcons name="info-outline" size={20} color="#6D28D9" />
        <View style={styles.fill}>
          <Text style={styles.noticeTitle}>
            Cada loja tem seu próprio saldo
          </Text>
          <Text style={styles.body}>
            Os pontos de uma loja só podem ser usados nos brindes dela. O pedido
            expira 30 dias após o registro se a compra não for validada.
          </Text>
        </View>
      </View>

      <View style={styles.links}>
        <Text accessibilityRole="header" style={styles.linksTitle}>
          Informações do clube
        </Text>
        {links.map(({ icon, label }, index) => (
          <Pressable
            key={label}
            onPress={() => navigation.navigate('about')}
            accessibilityRole="button"
            accessibilityHint="Abre a tela Sobre o Clube IAkí"
            style={({ pressed }) => [
              styles.link,
              index > 0 && styles.linkDivider,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name={icon} size={19} color="#6D28D9" />
            <Text style={styles.linkLabel}>{label}</Text>
            <MaterialIcons name="chevron-right" size={22} color="#64748B" />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 18,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E9E3FA',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 18,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  fill: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#31204D',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#5F5575',
  },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center' },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  connector: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    backgroundColor: '#EDE9FE',
  },
  stepContent: { paddingTop: 2, paddingBottom: 16 },
  stepTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: '#252238',
  },
  body: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: '#5B5368',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
  },
  noticeTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#4C1D95',
  },
  links: { marginTop: 18 },
  linksTitle: {
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#5B5368',
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  linkDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9E3FA',
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#252238',
  },
  pressed: { backgroundColor: '#F5F3FF' },
})
