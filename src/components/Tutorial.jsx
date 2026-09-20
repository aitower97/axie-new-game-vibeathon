// Tutorial.jsx — tarjeta de tutorial por pasos con anillo de resalte opcional.
// UI local: no toca el estado de partida. `steps` viene de tutorialSteps.js;
// cada paso puede tener `target` (selector CSS) y `action` ({label, route}).
import { useEffect, useState } from 'react'

export default function Tutorial({ steps, onClose, onNavigate }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const step = steps[index]
  const last = index === steps.length - 1

  // Sigue al elemento resaltado (puede moverse, montarse tarde o no existir).
  useEffect(() => {
    if (!step.target) return undefined
    const measure = () => {
      const el = document.querySelector(step.target)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect(r.width > 0 && r.height > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null)
    }
    measure()
    const timer = setInterval(measure, 400)
    window.addEventListener('resize', measure)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', measure)
    }
  }, [step.target])

  const ringRect = step.target ? rect : null

  return (
    <>
      {ringRect && (
        <div
          className="tutorial-ring"
          style={{
            top: ringRect.top - 6,
            left: ringRect.left - 6,
            width: ringRect.width + 12,
            height: ringRect.height + 12,
          }}
        />
      )}
      <aside className="tutorial-card" role="dialog" aria-label="Tutorial">
        <button type="button" className="tutorial-close" onClick={onClose} aria-label="Close tutorial">
          ✕
        </button>
        <span className="tutorial-count">
          Step {index + 1} of {steps.length}
        </span>
        <h3 className="tutorial-title">{step.title}</h3>
        <p className="tutorial-text">{step.text}</p>
        <div className="tutorial-dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.title} className={i === index ? 'on' : ''} />
          ))}
        </div>
        <div className="tutorial-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Skip
          </button>
          <span className="tutorial-spacer" />
          <button type="button" className="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Back
          </button>
          {last && step.action && (
            <button
              type="button"
              onClick={() => {
                onNavigate(step.action.route)
                onClose()
              }}
            >
              {step.action.label}
            </button>
          )}
          {last && !step.action && (
            <button type="button" onClick={onClose}>
              Done
            </button>
          )}
          {!last && (
            <button type="button" onClick={() => setIndex(index + 1)}>
              Next
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
