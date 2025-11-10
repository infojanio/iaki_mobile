import * as Updates from 'expo-updates'
import { AppState } from 'react-native'

export async function checkAndApplyOtaNow() {
  try {
    const update = await Updates.checkForUpdateAsync()
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync()
      await Updates.reloadAsync() // reinicia já no novo bundle
    }
  } catch (_) {
    // log opcional
  }
}

export function wireOtaOnAppState() {
  let currentState = AppState.currentState
  const sub = AppState.addEventListener('change', async (next) => {
    if (currentState.match(/inactive|background/) && next === 'active') {
      // app voltou ao primeiro plano → checa OTA
      await checkAndApplyOtaNow()
    }
    currentState = next
  })
  return () => sub.remove()
}
