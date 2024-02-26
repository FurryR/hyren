import { MainLog } from './log'
import * as VM from 'scratch-vm'
import { version } from '../package.json'

import patchRuntime from './compiler/runtime'

let vmInstance: VM | undefined
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
function vmInstanceAssert(): never {
  MainLog.error('Accessed Hyren APIs before VM instance initialization.')
  throw new Error('Accessed Hyren APIs before VM instance initialization')
}
trap(vm => {
  patchRuntime(vm)
  vmInstance = vm
  ;(window as any).Hyren = {
    Interpolation: {
      set(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).interpolationEnabled
        ;(vmInstance.runtime as any).setInterpolation(!!flag)
      }
    },
    Compiler: {
      set(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).compilerOptions?.enabled
        ;(vmInstance.runtime as any).setCompilerOptions({
          enabled: !!flag
        })
      },
      warp(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).compilerOptions?.warpTimer
        ;(vmInstance.runtime as any).setCompilerOptions({
          warpTimer: !!flag
        })
      }
    },
    Options: {
      hires(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).renderer?.useHighQualityRender
        ;(vmInstance.runtime as any).renderer?.setUseHighQualityRender(!!flag)
      },
      fps(num: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (num === undefined)
          return (vmInstance.runtime as any).frameLoop?.framerate
        const v = Number(num)
        ;(vmInstance.runtime as any).setFramerate(isNaN(v) ? 30 : v)
      },
      maxClones(num: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (num === undefined)
          return (vmInstance.runtime as any).runtimeOptions?.maxClones
        const v = Number(num)
        ;(vmInstance.runtime as any).setRuntimeOptions({
          maxClones: isNaN(v)
            ? (vmInstance.runtime.constructor as any).MAX_CLONES
            : v
        })
      },
      miscLimits(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).runtimeOptions?.miscLimits
        ;(vmInstance.runtime as any).setRuntimeOptions({
          miscLimits: !!flag
        })
      },
      fencing(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).runtimeOptions?.fencing
        ;(vmInstance.runtime as any).setRuntimeOptions({
          fencing: !!flag
        })
      }
    },
    version
  }
})
