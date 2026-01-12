import { VStack } from 'native-base'

import { StoreHeader } from '@components/Store/StoreHeader'
import { Promotion } from '@components/Promotion'
import { SeparatorItem } from '@components/SeparatorItem'

import { StoreDTO } from '@dtos/StoreDTO'
import { BannerDTO } from '@dtos/BannerDTO'

type Props = {
  store: StoreDTO
  banners: BannerDTO[]
}

export function StorePromotionHeader({ store, banners }: Props) {
  return (
    <VStack>
      {/* Header da loja */}
      <StoreHeader store={store} />

      {/* Banners da loja (somente se existir) */}
      {banners.length > 0 && (
        <>
          <SeparatorItem />
          <Promotion banners={banners} />
          <SeparatorItem />
        </>
      )}
    </VStack>
  )
}
