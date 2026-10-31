import { useEffect } from 'react'

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'tel', 'email', 'url', 'password', 'number', 'date', 'time', ''])

function isTextEntry(el) {
  if (!el) return false
  if (el.tagName === 'TEXTAREA' || el.isContentEditable) return true
  return el.tagName === 'INPUT' && TEXT_INPUT_TYPES.has((el.getAttribute('type') || '').toLowerCase())
}

/**
 * Sets `data-keyboard="open"` on <html> while the on-screen keyboard is likely showing
 * (touch device + text field focused), so CSS can hide fixed footers that would otherwise
 * ride up above the keyboard.
 */
export function useKeyboardOpenFlag() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    const root = document.documentElement
    let timer
    const sync = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (isTextEntry(document.activeElement)) root.setAttribute('data-keyboard', 'open')
        else root.removeAttribute('data-keyboard')
      }, 50)
    }
    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', sync)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('focusin', sync)
      document.removeEventListener('focusout', sync)
      root.removeAttribute('data-keyboard')
    }
  }, [])
}
