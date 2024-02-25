import nanolog = require('@turbowarp/nanolog')
nanolog.enable()
export const MainLog = nanolog('main')
export const VMLog = nanolog('vm')
