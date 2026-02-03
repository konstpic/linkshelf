export const EMOJI_MAP = {
  'Всё': '📂',
  'Избранное': '⭐',
  'Работа': '💼',
  'Развлечения': '🎮',
  'Новости': '📰',
  'Инструменты': '🛠️',
  'Учёба': '📚',
}

export const getEmoji = (name) => EMOJI_MAP[name] || '📁'

/**
 * Сокращение названия категории для узкой панели (collapsed sidebar).
 * - Несколько слов: первые буквы слов («Мои ссылки» → «МС», «Работа Дома» → «РД»).
 * - Одно слово: первая + последняя буква («Развлечения» → «РЯ», «Работа» → «РА», «Инструменты» → «ИЫ») — меньше коллизий и узнаваемее.
 */
export function getAbbreviation(name) {
  const n = String(name).trim()
  if (!n) return '…'
  if (n.length <= 2) return n.toUpperCase()
  const words = n.split(/\s+/).filter(Boolean)
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (n.length <= 3) return n.toUpperCase()
  return (n[0] + n[n.length - 1]).toUpperCase()
}
