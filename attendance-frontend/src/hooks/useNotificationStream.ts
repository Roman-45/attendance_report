import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api/v1'

export interface SSENotificationPayload {
  type?: string
  title?: string
  message?: string
  studentName?: string
}

/**
 * Opens an SSE connection to /notifications/stream and invalidates notification
 * queries whenever an event arrives.
 *
 * The JWT is passed as a ?token= query param because the browser's EventSource
 * API does not support custom request headers.
 *
 * @param enabled    Set to false to skip connecting (e.g., non-ADMIN users)
 * @param onEvent    Optional callback fired with parsed event data (for toast popups)
 */
export function useNotificationStream(
  enabled: boolean,
  onEvent?: (payload: SSENotificationPayload) => void,
) {
  const queryClient = useQueryClient()
  const esRef = useRef<EventSource | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    const url = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener('notification', (event) => {
      // Refresh both the bell counter and the full list in the background
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })

      // Fire toast callback with parsed payload
      if (onEventRef.current) {
        try {
          const data = JSON.parse((event as MessageEvent).data)
          onEventRef.current(data)
        } catch {
          onEventRef.current({})
        }
      }
    })

    es.onerror = () => {
      // On error/disconnect the browser will attempt reconnect automatically.
      // Nothing extra needed — EventSource has built-in reconnect logic.
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [enabled, queryClient])
}
