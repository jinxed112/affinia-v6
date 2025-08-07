import { useState, useEffect } from 'react'

interface WebViewInfo {
  isWebView: boolean
  userAgent: string
  detectedApp?: string
}

const detectWebView = (): WebViewInfo => {
  const userAgent = window.navigator.userAgent.toLowerCase()

  const webViewIndicators = [
    { pattern: 'fbav', app: 'Facebook App' },
    { pattern: 'fban', app: 'Facebook App' },
    { pattern: 'instagram', app: 'Instagram App' },
    { pattern: 'twitter', app: 'Twitter App' },
    { pattern: 'linkedin', app: 'LinkedIn App' },
    { pattern: 'tiktok', app: 'TikTok App' },
    { pattern: 'snapchat', app: 'Snapchat App' },
    { pattern: 'micromessenger', app: 'WeChat' },
    { pattern: 'line', app: 'Line App' },
    { pattern: 'webview', app: 'Generic WebView' },
    { pattern: 'wv', app: 'Generic WebView' }
  ]

  const detectedIndicator = webViewIndicators.find(indicator => 
    userAgent.includes(indicator.pattern)
  )

  const isStandalone = (window.navigator as any).standalone === true
  const isMissingChrome = !window.chrome && userAgent.includes('chrome')

  return {
    isWebView: !!detectedIndicator || isStandalone || isMissingChrome,
    userAgent,
    detectedApp: detectedIndicator?.app
  }
}

export const useWebView = () => {
  const [webViewInfo, setWebViewInfo] = useState<WebViewInfo>(() => detectWebView())

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setWebViewInfo(detectWebView())
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const openInBrowser = (url?: string) => {
    const targetUrl = url || window.location.href
    
    try {
      navigator.clipboard.writeText(targetUrl).then(() => {
        alert(`Lien copié ! Collez-le dans ${webViewInfo.detectedApp ? 'votre navigateur' : 'Chrome ou Safari'}.`)
      }).catch(() => {
        const textArea = document.createElement('textarea')
        textArea.value = targetUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert(`Lien copié ! Collez-le dans ${webViewInfo.detectedApp ? 'votre navigateur' : 'Chrome ou Safari'}.`)
      })
    } catch (error) {
      prompt('Copiez ce lien et ouvrez-le dans votre navigateur:', targetUrl)
    }
  }

  return {
    ...webViewInfo,
    openInBrowser
  }
}
