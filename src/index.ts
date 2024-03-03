import { MainLog } from './log'
import * as VM from 'scratch-vm'
import { locale, formatMessage } from './l10n'
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
  vm.on('LOCALE_CHANGED' as any, () => {
    locale.value = (vm as any).getLocale()
  })
  vm.once('targetsUpdate', () => {
    locale.value = (vm as any).getLocale()
    MainLog.groupCollapsed(`🐺 Hyren v${version}`)
    console.log(formatMessage('hyren.aboutme'))
    console.log(formatMessage('hyren.abouttw'))
    console.log(formatMessage('hyren.ghrepo'))
    console.log(formatMessage('hyren.help'))
    MainLog.groupEnd()
  })
  patchRuntime(vm)
  vmInstance = vm
  ;(window as any).Hyren = {
    Interpolation: {
      set(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).interpolationEnabled
        const enabled = !!flag
        if (enabled) MainLog.log(formatMessage('hyren.interpolation.enabled'))
        else MainLog.log(formatMessage('hyren.interpolation.disabled'))
        ;(vmInstance.runtime as any).setInterpolation(enabled)
      }
    },
    Compiler: {
      set(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).compilerOptions?.enabled
        const enabled = !!flag
        if (enabled) MainLog.log(formatMessage('hyren.compiler.enabled'))
        else MainLog.log(formatMessage('hyren.compiler.disabled'))
        ;(vmInstance.runtime as any).setCompilerOptions({
          enabled
        })
      },
      warp(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).compilerOptions?.warpTimer
        const enabled = !!flag
        if (enabled) MainLog.log(formatMessage('hyren.warp.enabled'))
        else MainLog.log(formatMessage('hyren.warp.disabled'))
        ;(vmInstance.runtime as any).setCompilerOptions({
          warpTimer: enabled
        })
      }
    },
    Options: {
      size(width: unknown, height: unknown) {
        if (!vmInstance) vmInstanceAssert()
        const nativeSize = vm.runtime.renderer.getNativeSize()
        if (width === undefined && height == undefined) return nativeSize
        width = width ?? nativeSize[0]
        height = height ?? nativeSize[1]
        const v = Number(width)
        const v2 = Number(height)
        const x = isNaN(v) ? nativeSize[0] : width
        const y = isNaN(v2) ? nativeSize[1] : height
        MainLog.log(
          formatMessage('hyren.size')
            .replace('%o', String(x))
            .replace('%2o', String(y))
        )
        ;(vmInstance.runtime as any).setStageSize(x, y)
        return [x, y]
      },
      hires(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).renderer?.useHighQualityRender
        const enabled = !!flag
        if (enabled) MainLog.log(formatMessage('hyren.hires.enabled'))
        else MainLog.log(formatMessage('hyren.hires.disabled'))
        ;(vmInstance.runtime as any).renderer?.setUseHighQualityRender(enabled)
        return enabled
      },
      fps(num: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (num === undefined)
          return (vmInstance.runtime as any).frameLoop?.framerate
        const v = Number(num)
        const fps = isNaN(v) ? 30 : v
        if (fps === 0) {
          MainLog.log(formatMessage('hyren.fps.sync'))
        } else {
          MainLog.log(formatMessage('hyren.fps').replace('%o', String(fps)))
        }
        ;(vmInstance.runtime as any).setFramerate(fps)
        return fps
      },
      maxClones(num: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (num === undefined)
          return (vmInstance.runtime as any).runtimeOptions?.maxClones
        const v = Number(num)
        const maxClones = isNaN(v)
          ? (vmInstance.runtime.constructor as any).MAX_CLONES
          : v
        if (maxClones === (vmInstance.runtime.constructor as any).MAX_CLONES) {
          MainLog.log(
            formatMessage('hyren.maxClones.default').replace(
              '%o',
              String(maxClones)
            )
          )
        } else {
          MainLog.log(
            formatMessage('hyren.maxClones').replace('%o', String(maxClones))
          )
        }
        ;(vmInstance.runtime as any).setRuntimeOptions({
          maxClones
        })
      },
      miscLimits(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).runtimeOptions?.miscLimits
        const enabled = !!flag
        if (enabled) MainLog.log(formatMessage('hyren.miscLimits.enabled'))
        else MainLog.log(formatMessage('hyren.miscLimits.disabled'))
        ;(vmInstance.runtime as any).setRuntimeOptions({
          miscLimits: enabled
        })
      },
      fencing(flag: unknown) {
        if (!vmInstance) vmInstanceAssert()
        if (flag === undefined)
          return (vmInstance.runtime as any).runtimeOptions?.fencing
        const enabled = !!flag
        if (enabled) MainLog.log(formatMessage('hyren.fencing.enabled'))
        else MainLog.log(formatMessage('hyren.fencing.disabled'))
        ;(vmInstance.runtime as any).setRuntimeOptions({
          fencing: enabled
        })
      }
    },
    save() {
      if (!vmInstance) vmInstanceAssert()
      MainLog.log(formatMessage('hyren.save'))
      ;(vmInstance as any).storeProjectOptions()
    },
    version
  }
})
