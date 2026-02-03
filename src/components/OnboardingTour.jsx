import { useState, useEffect, useRef } from 'react'

const ONBOARDING_STORAGE_KEY = 'linkshelf_onboarding_done'

export function isOnboardingDone() {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
  } catch {}
}

const STEPS = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Категории',
    text: 'Здесь ваши категории. Создавайте папки для организации ссылок. «Всё» показывает все, «Избранное» — закреплённые.',
  },
  {
    target: '[data-tour="search"]',
    title: 'Поиск',
    text: 'Поиск по названию, URL и тегам.',
  },
  {
    target: '[data-tour="more"]',
    title: 'Меню',
    text: 'Импорт, экспорт, добавление из браузера (букмарклет), настройка папки данных.',
  },
  {
    target: '[data-tour="add"]',
    title: 'Добавить ссылку',
    text: 'Нажмите, чтобы добавить ссылку вручную. Или используйте расширение браузера / букмарклет.',
  },
  {
    target: '[data-tour="grid"]',
    title: 'Ссылки',
    text: 'Здесь появятся ваши карточки. Клик — открыть, звёздочка — в избранное. Переключайте вид: сетка или список.',
  },
]

export default function OnboardingTour({ onComplete, onSkip }) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const overlayRef = useRef(null)

  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    const el = document.querySelector(currentStep?.target)
    if (el) {
      const updateRect = () => {
        const rect = el.getBoundingClientRect()
        setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
      }
      updateRect()
      const ro = new ResizeObserver(updateRect)
      ro.observe(el)
      window.addEventListener('scroll', updateRect, true)
      return () => {
        ro.disconnect()
        window.removeEventListener('scroll', updateRect, true)
      }
    } else {
      setTargetRect(null)
    }
  }, [step, currentStep?.target])

  const handleNext = () => {
    if (isLast) {
      setOnboardingDone()
      onComplete?.()
    } else {
      setStep((s) => s + 1)
    }
  }

  const handleSkip = () => {
    setOnboardingDone()
    onSkip?.()
  }

  if (!currentStep) return null

  return (
    <div className="onboarding-overlay" ref={overlayRef}>
      {/* Transparent layer - click anywhere to skip */}
      <div className="onboarding-skip-layer" onClick={handleSkip} aria-hidden />
      {/* Spotlight: box-shadow creates a "hole" - div is transparent, shadow fills the rest */}
      {targetRect && (
        <div
          className="onboarding-spotlight"
          style={{
            position: 'fixed',
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Tooltip card */}
      <div className="onboarding-tooltip">
        <h4>{currentStep.title}</h4>
        <p>{currentStep.text}</p>
        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip" onClick={handleSkip}>
            Пропустить
          </button>
          <button type="button" className="onboarding-next" onClick={handleNext}>
            {isLast ? 'Готово' : 'Далее'}
          </button>
        </div>
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'active' : ''} />
          ))}
        </div>
      </div>
    </div>
  )
}
