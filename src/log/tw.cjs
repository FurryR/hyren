// only use colors in non-browser environments
const addColors = typeof document === 'undefined'

const RESET = addColors ? '\u001b[0m' : ''
const GRAY = addColors ? '\u001b[90m' : ''

const createLog = (namespace = '') => {
  const log = childNamespace =>
    createLog(namespace ? `${namespace}::${childNamespace}` : childNamespace)

  const formattedNamespace = namespace ? [`${GRAY}${namespace}${RESET}`] : []

  log.debug = log.log = console.log.bind(
    console,
    '%c🐺 Hyren',
    ` background-color: lightgrey; border-radius: 1rem; margin-right: 0.25rem; padding: 0 0.5rem; color: white; font-weight: normal;`,
    ...formattedNamespace
  )
  log.group = console.group.bind(
    console,
    '%c🐺 Hyren',
    ` background-color: lightgrey; border-radius: 1rem; margin-right: 0.25rem; padding: 0 0.5rem; color: white; font-weight: normal;`,
    ...formattedNamespace
  )
  log.groupCollapsed = console.groupCollapsed.bind(
    console,
    '%c🐺 Hyren',
    ` background-color: lightgrey; border-radius: 1rem; margin-right: 0.25rem; padding: 0 0.5rem; color: white; font-weight: normal;`,
    ...formattedNamespace
  )
  log.groupEnd = console.groupEnd.bind(console)
  log.info = console.info.bind(
    console,
    '%c🐺 Hyren',
    ` background-color: darkblue; border-radius: 1rem; margin-right: 0.25rem; padding: 0 0.5rem; color: white; font-weight: normal;`,
    ...formattedNamespace
  )
  log.warn = console.warn.bind(
    console,
    '%c🐺 Hyren',
    ` background-color: yellow; border-radius: 1rem; margin-right: 0.25rem; padding: 0 0.5rem; color: black; font-weight: normal;`,
    ...formattedNamespace
  )
  log.error = console.error.bind(
    console,
    '%c🐺 Hyren',
    ` background-color: red; border-radius: 1rem; margin-right: 0.25rem; padding: 0 0.5rem; color: white; font-weight: normal;`,
    ...formattedNamespace
  )

  return log
}

/**
 * @deprecated does nothing
 */
createLog.enable = createLog.disable = () => {}

module.exports = createLog
