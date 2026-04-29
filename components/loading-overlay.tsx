'use client'

import React, { useEffect, useState } from 'react'
import { useLoading } from '@/contexts/loading-context'

export function LoadingOverlay() {
  const { isLoading } = useLoading()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (isLoading) {
      setVisible(true)
    } else {
      timeout = setTimeout(() => {
        setVisible(false)
      }, 300)
    }

    return () => clearTimeout(timeout)
  }, [isLoading])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-900 rounded-lg p-8 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-slate-900 dark:text-white text-lg font-semibold">লোড হচ্ছে অপেক্ষা করুন</p>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">পৃষ্ঠা লোডিং চলছে...</p>
        </div>
      </div>
    </div>
  )
}
