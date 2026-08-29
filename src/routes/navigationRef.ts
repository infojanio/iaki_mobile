// src/routes/navigationRef.ts

import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native'

import type { RootStackParamList } from '@routes/types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

type RootRouteName = Extract<keyof RootStackParamList, string>

export function navigate<RouteName extends RootRouteName>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
) {
  if (!navigationRef.isReady()) {
    return
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name,
      params,
    }),
  )
}
