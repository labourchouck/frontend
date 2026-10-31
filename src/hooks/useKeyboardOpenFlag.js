import { useEffect } from 'react'

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'tel', 'email', 'url', 'password', 'number', 'date', 'time', ''])

function isTextEntry(el) {
  if (!el) return false
  if (el.tagName === 'TEXTAREA' || el.isContentEditable) return true
  return el.tagName === 'INPUT' && TEXT_INPUT_TYPES.has((el.getAttribute('type') || '').toLowerCase())
}

/**
 * Sets `data-keyboard="open"` on <html> while the on-screen keyboard is showing,
 * so CSS can hide fixed footers and remove excess bottom padding.
 */
export function useKeyboardOpenFlag() {
  useEffect(() => {
    const root = document.documentElement
    let timer

    const sync = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const textActive = isTextEntry(document.activeElement)
        const vv = window.visualViewport
        // If visual viewport height is noticeably smaller than window innerHeight (virtual keyboard showing)
        const vvCollapsed = vv ? vv.height < window.innerHeight * 0.85 : false
        const isMobileScreen =
          window.innerWidth <= 768 ||
          (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)

        if (isMobileScreen && (textActive || vvCollapsed)) {
          root.setAttribute('data-keyboard', 'open')
        } else {
          root.removeAttribute('data-keyboard')
        }
      }, 50)
    }

    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', sync)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', sync)
    }

    return () => {
      clearTimeout(timer)
      document.removeEventListener('focusin', sync)
      document.removeEventListener('focusout', sync)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', sync)
      }
      root.removeAttribute('data-keyboard')
    }
  }, [])
}
