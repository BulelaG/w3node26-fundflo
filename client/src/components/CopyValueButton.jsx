import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CopyValueButton({ value, label }) {
  const [copyState, setCopyState] = useState('idle')

  async function handleCopy(event) {
    event.stopPropagation()
    if (!value) return

    if (!navigator.clipboard?.writeText) {
      setCopyState('unavailable')
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('unavailable')
    }
  }

  return (
    <button
      className="copy-value-button"
      type="button"
      onClick={handleCopy}
      aria-label={copyState === 'copied' ? `${label} copied` : `Copy ${label}`}
      title={
        copyState === 'unavailable'
          ? 'Clipboard access is unavailable'
          : copyState === 'copied'
            ? 'Copied'
            : `Copy ${label}`
      }
    >
      {copyState === 'copied' ? <Check size={13} /> : <Copy size={13} />}
      <span>{copyState === 'copied' ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
