import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, X, Minimize2, Maximize2, AlertCircle, ShieldCheck } from 'lucide-react'
import { askClaudeCopilot } from '../services/api'

const QUICK_PROMPTS = [
  'What active programmes do we have and remaining budget?',
  'Why would a student payout be rejected by the policy engine?',
  'How does FundFlow prevent the R14M NSFAS Sibongile Mani error?',
  'Are there any pending disbursements waiting right now?'
]

export default function ClaudeCopilotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello CFO! I am FundFlow's Claude AI Copilot. I have live, read-only tool access to our funding schedules, programme budgets, and 5-Gate Policy Engine audit logs. How can I assist you with today's disbursements?"
    }
  ])

  const chatEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim() || isLoading) return

    const newMessages = [...messages, { role: 'user', content: query.trim() }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Send conversation history to the backend
      const res = await askClaudeCopilot(newMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error communicating with Claude Copilot: ${err.message || 'Network error'}. Please try again.`
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside aria-label="Claude AI Copilot" className="copilot-container">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="copilot-pill-btn"
          onClick={() => setIsOpen(true)}
          title="Open Claude AI Operations Copilot"
        >
          <span className="copilot-badge-icon">
            <Bot size={20} />
          </span>
          <span className="copilot-btn-text">
            <strong>Claude AI Copilot</strong>
            <small>Active Agentic Finance</small>
          </span>
          <span className="copilot-pulse" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="copilot-window">
          {/* Header */}
          <div className="copilot-header">
            <div className="copilot-header-left">
              <span className="copilot-header-icon">
                <Bot size={20} />
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong>Claude AI Copilot</strong>
                  <span className="copilot-model-pill">Claude 4.5</span>
                </div>
                <small>Tool-Calling · Read-Only Financial Assurance</small>
              </div>
            </div>
            <button
              className="copilot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Claude Copilot"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="copilot-body">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`copilot-bubble ${m.role === 'user' ? 'is-user' : 'is-ai'}`}
              >
                {m.role === 'assistant' && (
                  <span className="bubble-avatar">
                    <Sparkles size={14} />
                  </span>
                )}
                <div className="bubble-content">
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="copilot-bubble is-ai is-loading">
                <span className="bubble-avatar">
                  <Sparkles size={14} />
                </span>
                <div className="bubble-content">
                  <span className="copilot-thinking-dots">
                    Claude is querying live FundFlow tools<span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 2 && (
            <div className="copilot-quick-prompts">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className="quick-prompt-btn"
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            className="copilot-footer"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <input
              type="text"
              className="copilot-input"
              placeholder="Ask Claude about programmes, budgets, or rejections..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="copilot-send-btn"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}
