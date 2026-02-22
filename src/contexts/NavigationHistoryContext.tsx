import React, { createContext, useCallback, useContext, useRef } from 'react'

type RouteSnapshot = {
  name: string
  params?: any
}

type NavigationHistoryContextType = {
  recordRoute: (route: RouteSnapshot | null) => void
  peekPreviousRoute: () => RouteSnapshot | null
  popAndGetBackRoute: () => RouteSnapshot | null
  resetHistory: (route?: RouteSnapshot | null) => void
}

const NavigationHistoryContext = createContext(
  {} as NavigationHistoryContextType,
)

export function NavigationHistoryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const stackRef = useRef<RouteSnapshot[]>([])

  const recordRoute = useCallback((route: RouteSnapshot | null) => {
    if (!route?.name) return

    const stack = stackRef.current
    const last = stack[stack.length - 1]

    // evita duplicar a mesma tela seguida (inclusive ao re-render)
    if (last?.name === route.name) {
      // se quiser, pode atualizar params aqui:
      stack[stack.length - 1] = route
      return
    }

    stack.push(route)

    // opcional: limita tamanho da pilha
    if (stack.length > 50) stack.shift()
  }, [])

  const peekPreviousRoute = useCallback(() => {
    const stack = stackRef.current
    if (stack.length < 2) return null
    return stack[stack.length - 2]
  }, [])

  const popAndGetBackRoute = useCallback(() => {
    const stack = stackRef.current

    // remove a rota atual
    if (stack.length > 0) stack.pop()

    // agora o topo é a rota “anterior”
    const target = stack[stack.length - 1] ?? null
    return target
  }, [])

  const resetHistory = useCallback((route?: RouteSnapshot | null) => {
    stackRef.current = route?.name ? [route] : []
  }, [])

  return (
    <NavigationHistoryContext.Provider
      value={{
        recordRoute,
        peekPreviousRoute,
        popAndGetBackRoute,
        resetHistory,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  )
}

export function useNavigationHistory() {
  return useContext(NavigationHistoryContext)
}
