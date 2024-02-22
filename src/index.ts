import nanolog = require('./log/index.cjs')
import * as VM from 'scratch-vm'

import patchRuntime from './compiler/runtime'
nanolog.enable()
const MainLog = nanolog('main')

/**
 * Trap to get Virtual Machine instance.
 * @param callback Callback.
 */
export function trap(callback: (vm: VM) => void) {
  const oldBind = Function.prototype.bind
  Function.prototype.bind = function (self: unknown, ...args: unknown[]) {
    if (
      typeof self === 'object' &&
      self !== null &&
      Object.prototype.hasOwnProperty.call(self, 'editingTarget') &&
      Object.prototype.hasOwnProperty.call(self, 'runtime')
    ) {
      MainLog.info(
        'Hyren is based on Turbowarp compiler. Check https://turbowarp.com/editor for more details.'
      )
      MainLog.info(
        'Copyright (c) 2024 FurryR. Visit my profile at https://github.com/FurryR'
      )
      MainLog.info('Repository URL: https://github.com/FurryR/hyren')
      Function.prototype.bind = oldBind
      callback(self as VM)
      return oldBind.call(this, self, ...args)
    }
    return oldBind.call(this, self, ...args)
  }
}
trap(vm => {
  patchRuntime(vm)
})
