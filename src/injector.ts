import * as VM from 'scratch-vm'
import { locale, formatMessage } from './l10n'
import { version } from 'package.json'
import { MainLog } from './log'

import patchRuntime from './compiler/runtime'

export function loadHyren(vm: VM) {
  if (Reflect.has(window, 'Hyren')) {
    return
  }
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
  ;(window as any).Hyren = {
    interpolation(flag: unknown) {
      if (flag === undefined) return (vm.runtime as any).interpolationEnabled
      const enabled = !!flag
      if (enabled) MainLog.log(formatMessage('hyren.interpolation.enabled'))
      else MainLog.log(formatMessage('hyren.interpolation.disabled'))
      ;(vm.runtime as any).setInterpolation(enabled)
    },
    compiler: Object.assign(
      (flag: unknown) => {
        if (flag === undefined)
          return (vm.runtime as any).compilerOptions?.enabled
        const enabled = !!flag
        if (enabled) MainLog.log(formatMessage('hyren.compiler.enabled'))
        else MainLog.log(formatMessage('hyren.compiler.disabled'))
        ;(vm.runtime as any).setCompilerOptions({
          enabled
        })
      },
      {
        warp(flag: unknown) {
          if (flag === undefined)
            return (vm.runtime as any).compilerOptions?.warpTimer
          const enabled = !!flag
          if (enabled) MainLog.log(formatMessage('hyren.warp.enabled'))
          else MainLog.log(formatMessage('hyren.warp.disabled'))
          ;(vm.runtime as any).setCompilerOptions({
            warpTimer: enabled
          })
        }
      }
    ),
    size(width: unknown, height: unknown) {
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
      ;(vm.runtime as any).setStageSize(x, y)
      return [x, y]
    },
    hires(flag: unknown) {
      if (flag === undefined)
        return (vm.runtime as any).renderer?.useHighQualityRender
      const enabled = !!flag
      if (enabled) MainLog.log(formatMessage('hyren.hires.enabled'))
      else MainLog.log(formatMessage('hyren.hires.disabled'))
      ;(vm.runtime as any).renderer?.setUseHighQualityRender(enabled)
      return enabled
    },
    fps(num: unknown) {
      if (num === undefined) return (vm.runtime as any).frameLoop?.framerate
      const v = Number(num)
      const fps = isNaN(v) ? 30 : v
      if (fps === 0) {
        MainLog.log(formatMessage('hyren.fps.sync'))
      } else {
        MainLog.log(formatMessage('hyren.fps').replace('%o', String(fps)))
      }
      ;(vm.runtime as any).setFramerate(fps)
      return fps
    },
    maxClones(num: unknown) {
      if (num === undefined)
        return (vm.runtime as any).runtimeOptions?.maxClones
      const v = Number(num)
      const maxClones = isNaN(v)
        ? (vm.runtime.constructor as any).MAX_CLONES
        : v
      if (maxClones === (vm.runtime.constructor as any).MAX_CLONES) {
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
      ;(vm.runtime as any).setRuntimeOptions({
        maxClones
      })
    },
    miscLimits(flag: unknown) {
      if (flag === undefined)
        return (vm.runtime as any).runtimeOptions?.miscLimits
      const enabled = !!flag
      if (enabled) MainLog.log(formatMessage('hyren.miscLimits.enabled'))
      else MainLog.log(formatMessage('hyren.miscLimits.disabled'))
      ;(vm.runtime as any).setRuntimeOptions({
        miscLimits: enabled
      })
    },
    fencing(flag: unknown) {
      if (flag === undefined) return (vm.runtime as any).runtimeOptions?.fencing
      const enabled = !!flag
      if (enabled) MainLog.log(formatMessage('hyren.fencing.enabled'))
      else MainLog.log(formatMessage('hyren.fencing.disabled'))
      ;(vm.runtime as any).setRuntimeOptions({
        fencing: enabled
      })
    },
    save() {
      MainLog.log(formatMessage('hyren.save'))
      ;(vm as any).storeProjectOptions()
    },
    version
  }
}
