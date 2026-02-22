export function getActiveRoute(
  state: any,
): { name: string; params?: any } | null {
  if (!state) return null

  const route = state.routes?.[state.index]
  if (!route) return null

  if (route.state) {
    return getActiveRoute(route.state)
  }

  return { name: route.name, params: route.params }
}
