import React from 'react'

import { StyleSheet, View } from 'react-native'

import { StoreHeader } from '@components/Store/StoreHeader'
import { Promotion } from '@components/Promotion'

import { StoreDTO } from '@dtos/StoreDTO'
import { BannerDTO } from '@dtos/BannerDTO'

type Props = {
  store: StoreDTO
  banners: BannerDTO[]
}

export function StorePromotionHeader({ store, banners }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.storeHeaderContainer}>
        <StoreHeader store={store} />
      </View>

      {banners.length > 0 ? (
        <View style={styles.bannerContainer}>
          <Promotion banners={banners} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 0,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
  },

  storeHeaderContainer: {
    marginBottom: 0,
    paddingBottom: 0,
  },

  bannerContainer: {
    marginTop: -24,
    paddingTop: 0,
    marginBottom: 0,
  },
})
