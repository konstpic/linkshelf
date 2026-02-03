const browserAPI = typeof browser !== 'undefined' ? browser : chrome

document.getElementById('add-btn').addEventListener('click', async () => {
  const btn = document.getElementById('add-btn')
  btn.disabled = true
  btn.textContent = 'Adding…'

  try {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true })
    const invalidProtocols = ['chrome:', 'edge:', 'about:', 'moz-extension:']
    const isInvalid = !tab?.url || invalidProtocols.some(p => tab.url.startsWith(p))
    if (isInvalid) {
      btn.textContent = 'Cannot add this page'
      return
    }
    const url = encodeURIComponent(tab.url)
    const title = encodeURIComponent(tab.title || '')
    const linkshelfUrl = `linkshelf://add?url=${url}&title=${title}`
    await browserAPI.tabs.create({ url: linkshelfUrl })
    window.close()
  } catch (e) {
    btn.textContent = 'Error'
  }
})
