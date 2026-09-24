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
    paddingHorizontal: 0,
    paddingTop: 0,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },

  storeHeaderContainer: {
    width: '100%',
    marginBottom: 2,
    paddingBottom: 2,
  },

  bannerContainer: {
    width: '100%',
    alignSelf: 'stretch',

    marginTop: 0,
    marginHorizontal: 0,

    paddingTop: 0,
    paddingHorizontal: 0,

    overflow: 'hidden',
  },
})
