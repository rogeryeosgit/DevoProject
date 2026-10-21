// Catches browser errors nothing else handles - Vue render/lifecycle errors,
// uncaught exceptions, unhandled promise rejections - and reports them to
// QTApp.log (utils/reportClientError.ts).

// Noise that isn't a bug in this app: a harmless browser layout warning, and
// cross-origin script errors the browser hides the details of.
const IGNORED_MESSAGES = [/ResizeObserver loop/i, /^Script error\.?$/i]

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:error', (err, _instance, info) => {
    reportClientEvent('error', 'vue', describeClientError(err), { detail: `during ${info}` })
  })
  nuxtApp.hook('app:error', (err) => {
    reportClientEvent('error', 'app', describeClientError(err))
  })

  window.addEventListener('error', (event) => {
    if (!event.message || IGNORED_MESSAGES.some(re => re.test(event.message))) return
    // Browser extensions and third-party scripts (analytics) aren't ours to fix.
    if (event.filename && !event.filename.startsWith(location.origin)) return
    reportClientEvent('error', 'window', event.message, { detail: `${event.filename}:${event.lineno}:${event.colno}` })
  })
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'AbortError') return
    reportClientEvent('error', 'promise', describeClientError(event.reason))
  })
})
