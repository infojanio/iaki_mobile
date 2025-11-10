import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  Image,
} from 'react-native'

import {
  mapTerrainPng,
  mapStandardPng,
  mapSatellitePng,
  CloseSvg,
} from '../../assets'

interface Props {
  handleLayoutChange: (event: LayoutChangeEvent) => void
  closeModal: () => void
  changeMapType: (mapType: 'standard' | 'satellite' | 'terrain') => void
}

export function MapTypeCard({
  handleLayoutChange,
  closeModal,
  changeMapType,
}: Props) {
  return (
    <View onLayout={handleLayoutChange} style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => closeModal()} style={styles.close}>
          <CloseSvg />
        </TouchableOpacity>
        <Text style={styles.heading}>TIPO DE MAPA</Text>
      </View>
      <View style={styles.mapRow}>
        <TouchableOpacity
          onPress={() => changeMapType('standard')}
          style={styles.touchable}
        >
          <Image source={mapStandardPng} style={styles.image} />
          <Text>Padrão</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => changeMapType('satellite')}
          style={styles.touchable}
        >
          <Image source={mapSatellitePng} style={styles.image} />
          <Text>Terreno</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    height: '100%',
    width: '60%',
    borderRadius: 20,
    backgroundColor: '#f9faf8',
    marginLeft: 10,
    marginTop: 520,
    opacity: 0.9,
    elevation: 5,
  },
  header: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 12,
  },
  close: {
    zIndex: 1,
  },
  heading: {
    position: 'absolute',
    textAlign: 'center',
    width: '100%',
    fontSize: 18,
    fontWeight: '700',
  },
  mapRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  touchable: {
    display: 'flex',
    alignItems: 'center',
  },
  image: {
    width: 75,
    height: 75,
    marginLeft: 4,
  },
})
