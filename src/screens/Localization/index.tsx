import React from 'react'
import { Center } from 'native-base'

import { MapClient } from '@components/MapClient'

export function Localization() {
  return (
    <Center flex={1}>
      <MapClient />
    </Center>
  )
}
