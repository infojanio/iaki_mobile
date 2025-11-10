let signOutCallback: () => void

export function setSignOutCallback(callback: () => void) {
  signOutCallback = callback
}

export function signOutApp() {
  if (signOutCallback) {
    signOutCallback()
  }
}
