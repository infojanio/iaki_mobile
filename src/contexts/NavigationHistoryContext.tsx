import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'

type RouteSnapshot = {
  name: string
  params?: any
}

type NavigationHistoryContextType = {
  recordRoute: (route: RouteSnapshot | null) => void

  /**
   * Apenas consulta a rota anterior.
   * Não altera o histórico.
   */
  getPreviousRoute: () => RouteSnapshot | null

  /**
   * Mantido para compatibilidade com
   * códigos que já utilizam esse nome.
   */
  peekPreviousRoute: () => RouteSnapshot | null

  /**
   * Remove a rota atual do histórico
   * e retorna a rota anterior.
   */
  popAndGetBackRoute: () => RouteSnapshot | null

  /**
   * Limpa o histórico.
   *
   * Se uma rota for informada,
   * ela será utilizada como primeira rota.
   */
  resetHistory: (route?: RouteSnapshot | null) => void
}

const NavigationHistoryContext =
  createContext<NavigationHistoryContextType | null>(null)

export function NavigationHistoryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const stackRef = useRef<RouteSnapshot[]>([])

  /* ======================================================
     RECORD ROUTE
  ====================================================== */

  const recordRoute = useCallback((route: RouteSnapshot | null) => {
    if (!route?.name) {
      return
    }

    const stack = stackRef.current

    const last = stack[stack.length - 1]

    /**
     * Evita duplicar a mesma rota
     * consecutivamente.
     *
     * Se os params mudaram,
     * atualizamos a última entrada.
     */
    if (last?.name === route.name) {
      stack[stack.length - 1] = route

      return
    }

    stack.push(route)

    /**
     * Evita crescimento indefinido.
     */
    if (stack.length > 50) {
      stack.shift()
    }
  }, [])

  /* ======================================================
     PREVIOUS ROUTE
  ====================================================== */

  const getPreviousRoute = useCallback(() => {
    const stack = stackRef.current

    if (stack.length < 2) {
      return null
    }

    return stack[stack.length - 2] ?? null
  }, [])

  /**
   * Alias para manter compatibilidade.
   *
   * getPreviousRoute e
   * peekPreviousRoute fazem exatamente
   * a mesma coisa.
   */
  const peekPreviousRoute = getPreviousRoute

  /* ======================================================
     POP CURRENT + GET PREVIOUS
  ====================================================== */

  const popAndGetBackRoute = useCallback(() => {
    const stack = stackRef.current

    /**
     * Remove a rota atual.
     */
    if (stack.length > 0) {
      stack.pop()
    }

    /**
     * Depois da remoção,
     * o topo passa a ser a rota anterior.
     */
    return stack[stack.length - 1] ?? null
  }, [])

  /* ======================================================
     RESET
  ====================================================== */

  const resetHistory = useCallback((route?: RouteSnapshot | null) => {
    stackRef.current = route?.name ? [route] : []
  }, [])

  /* ======================================================
     CONTEXT VALUE
  ====================================================== */

  const value = useMemo(
    () => ({
      recordRoute,

      getPreviousRoute,

      peekPreviousRoute,

      popAndGetBackRoute,

      resetHistory,
    }),
    [
      recordRoute,
      getPreviousRoute,
      peekPreviousRoute,
      popAndGetBackRoute,
      resetHistory,
    ],
  )

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  )
}

/* ======================================================
   HOOK
====================================================== */

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext)

  if (!context) {
    throw new Error(
      'useNavigationHistory deve ser utilizado dentro de NavigationHistoryProvider',
    )
  }

  return context
}
