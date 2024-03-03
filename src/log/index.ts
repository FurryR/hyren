import nanolog = require('@turbowarp/nanolog')
nanolog.enable()
export const MainLog = nanolog()
export const VMLog = nanolog('vm')
