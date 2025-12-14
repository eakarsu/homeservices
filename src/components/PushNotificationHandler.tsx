'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { isNative, initPushNotifications } from '@/lib/capacitor'

export default function PushNotificationHandler() {
  const { data: session } = useSession()
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    if (!isNative() || !session?.user) return

    const setupPush = async () => {
      const success = await initPushNotifications(
        // Token received - save to server
        async (token) => {
          console.log('Push token:', token)
          try {
            await fetch('/api/users/push-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, platform: 'ios' }),
            })
            setPushEnabled(true)
          } catch (error) {
            console.error('Failed to save push token:', error)
          }
        },
        // Notification received while app is open
        (notification) => {
          console.log('Notification received:', notification)
          // Show in-app notification or handle as needed
        },
        // Notification tapped - navigate to relevant screen
        (notification) => {
          console.log('Notification tapped:', notification)
          const data = notification.data
          if (data?.jobId) {
            window.location.href = `/tech/job/${data.jobId}`
          }
        }
      )

      if (!success) {
        console.log('Push notifications not available or denied')
      }
    }

    setupPush()
  }, [session])

  // This component doesn't render anything visible
  return null
}
