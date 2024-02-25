import { MainLog } from './log'
import * as VM from 'scratch-vm'
import { version } from '../package.json'

import patchRuntime from './compiler/runtime'

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
      MainLog.groupCollapsed(`🐺 Hyren v${version}`)
      console.log(
        'Copyright (c) 2024 FurryR. Visit my profile at https://github.com/FurryR'
      )
      console.log(
        'Hyren is based on Turbowarp compiler. Check https://turbowarp.com/editor for more details.'
      )
      console.log('GitHub Repository: https://github.com/FurryR/hyren')
      MainLog.groupEnd()
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
