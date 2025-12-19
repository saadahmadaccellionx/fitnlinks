"use client"

import { useCallback } from "react"

type DeviceType = "ios" | "android" | "desktop"

const APP_STORE_URLS = {
  ios: "https://apps.apple.com/pk/app/fitn/id1660781140",
  android: "https://play.google.com/store/apps/details?id=com.georgefitnlifestyle.fitn",
}

export function useOpenApp() {
  const detectDevice = useCallback((): DeviceType => {
    if (typeof window === "undefined") return "desktop"

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    if (isIOS) return "ios"
    if (isAndroid) return "android"
    return "desktop"
  }, [])

  const openDeepLink = useCallback(
    (playlistId: string) => {
      const deepLink = `myapp://PlaylistDetail?id=${playlistId}`
      const device = detectDevice()
      
      // Set a timeout to detect if app didn't open
      // If the app opens, the page will lose focus/blur
      // If it doesn't open within timeout, redirect to app store
      let timeout: NodeJS.Timeout | null = null
      let blurHandler: (() => void) | null = null

      const handleBlur = () => {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        if (blurHandler) {
          window.removeEventListener("blur", blurHandler)
          blurHandler = null
        }
      }

      blurHandler = handleBlur
      window.addEventListener("blur", blurHandler, { once: true })

      // Try to open the deep link
      window.location.href = deepLink

      timeout = setTimeout(() => {
        if (device === "ios") {
          window.open(APP_STORE_URLS.ios, "_blank")
        } else if (device === "android") {
          window.open(APP_STORE_URLS.android, "_blank")
        } else {
          // Desktop: show both options or default to iOS
          window.open(APP_STORE_URLS.ios, "_blank")
        }
        handleBlur()
      }, 1000)
    },
    [detectDevice]
  )

  const openAppStore = useCallback((device?: DeviceType) => {
    const targetDevice = device || detectDevice()
    const url = targetDevice === "ios" ? APP_STORE_URLS.ios : APP_STORE_URLS.android
    window.open(url, "_blank")
  }, [detectDevice])

  const getAppStoreUrls = useCallback(() => {
    return APP_STORE_URLS
  }, [])

  return {
    detectDevice,
    openDeepLink,
    openAppStore,
    getAppStoreUrls,
  }
}

