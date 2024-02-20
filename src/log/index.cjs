let stat = false
function nanolog(name) {
  return {
    info(...args) {
      if (stat) console.log(`[🐺 hyren] ${name}:`, ...args)
    },
    warn(...args) {
      if (stat) console.warn(`[🐺 hyren] ${name}:`, ...args)
    },
    error(...args) {
      if (stat) console.error(`[🐺 hyren] ${name}:`, ...args)
    }
  }
}
nanolog.enable = () => {
  stat = true
}
nanolog.disable = () => {
  stat = false
}
module.exports = nanolog
