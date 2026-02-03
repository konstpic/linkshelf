document.getElementById('add-btn').addEventListener('click', async () => {
  const btn = document.getElementById('add-btn')
  btn.disabled = true
  btn.textContent = 'Adding…'

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      btn.textContent = 'Cannot add this page'
      return
    }
    const url = encodeURIComponent(tab.url)
    const title = encodeURIComponent(tab.title || '')
    const linkshelfUrl = `linkshelf://add?url=${url}&title=${title}`
    await chrome.tabs.create({ url: linkshelfUrl })
    window.close()
  } catch (e) {
    btn.textContent = 'Error'
  }
})
