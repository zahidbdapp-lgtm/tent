'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLoading } from '@/contexts/loading-context'

let navigationTimeout: NodeJS.Timeout

export function PageLoader() {
  const router = useRouter()
  const { startLoading, stopLoading } = useLoading()

  useEffect(() => {
    const handleStart = () => {
      navigationTimeout = setTimeout(() => {
        startLoading()
      }, 200) // শুধুমাত্র ২০০ms এর চেয়ে বেশি সময় লাগলে দেখাবে
    }

    const handleComplete = () => {
      clearTimeout(navigationTimeout)
      stopLoading()
    }

    // Next.js 13+ এ router events জন্য
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = ((...args: any[]) => {
      handleStart()
      const result = originalPush.apply(router, args)
      Promise.resolve(result).then(handleComplete)
      return result
    }) as typeof router.push

    router.replace = ((...args: any[]) => {
      handleStart()
      const result = originalReplace.apply(router, args)
      Promise.resolve(result).then(handleComplete)
      return result
    }) as typeof router.replace

    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [router, startLoading, stopLoading])

  return null
}
