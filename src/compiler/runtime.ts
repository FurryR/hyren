import { ExtendedRuntime, ExtendedThread } from '../typing'
import * as ExtendedJSON from '@turbowarp/json'
import { formatMessage } from 'src/l10n'
import { MainLog, VMLog } from 'src/log'
import compilerExecute = require('scratch-vm/src/compiler/jsexecute')
import patchThread from './thread'
import patchRenderer from './renderer'
import patchIO from './io'
import patchTarget from './target'
import Compatibility from '../compatibility'
import { IRGenerator, ScriptTreeGenerator } from 'scratch-vm/src/compiler/irgen'
import JSGenerator = require('scratch-vm/src/compiler/jsgen')
import uid = require('scratch-vm/src/util/uid')

export default function patchRuntime(vm: VM) {
  class HyrenInterrupt extends Error {
    constructor() {
      super('Interrupted by Hyren')
    }
  }
  const runtime = vm.runtime as ExtendedRuntime
  if (!(vm.runtime.constructor as any).RUNTIME_OPTIONS_CHANGED)
    Object.defineProperty(vm.runtime.constructor, 'RUNTIME_OPTIONS_CHANGED', {
      value: 'RUNTIME_OPTIONS_CHANGED',
      writable: false
    })
  if (!(vm.runtime.constructor as any).COMPILE_ERROR)
    Object.defineProperty(vm.runtime.constructor, 'COMPILE_ERROR', {
      value: 'COMPILE_ERROR',
      writable: false
    })
  if (!(vm.runtime.constructor as any).COMPILER_OPTIONS_CHANGED)
    Object.defineProperty(vm.runtime.constructor, 'COMPILER_OPTIONS_CHANGED', {
      value: 'COMPILER_OPTIONS_CHANGED',
      writable: false
    })
  if (!(vm.runtime.constructor as any).TURBO_MODE_ON)
    Object.defineProperty(vm.runtime.constructor, 'TURBO_MODE_ON', {
      value: 'TURBO_MODE_ON',
      writable: false
    })
  if (!(vm.runtime.constructor as any).TURBO_MODE_OFF)
    Object.defineProperty(vm.runtime.constructor, 'TURBO_MODE_OFF', {
      value: 'TURBO_MODE_OFF',
      writable: false
    })
  vm.runtime.constructor.prototype.setRuntimeOptions = function (
    runtimeOptions: any
  ) {
    this.runtimeOptions = Object.assign({}, this.runtimeOptions, runtimeOptions)
    this.emit(
      (vm.runtime.constructor as any).RUNTIME_OPTIONS_CHANGED,
      this.runtimeOptions
    )
    if (this.renderer) {
      this.renderer.offscreenTouching = !this.runtimeOptions.fencing
    }
  }
  ;(vm.runtime as any).setRuntimeOptions({
    maxClones: (vm.runtime.constructor as any).MAX_CLONES,
    miscLimits: true,
    fencing: true
  })
  vm.runtime.constructor.prototype.clonesAvailable = function () {
    return this._cloneCounter < this.runtimeOptions.maxClones
  }
  Object.defineProperty(vm.runtime, 'compatibilityMode', {
    get() {
      return (vm.runtime as any).frameLoop?.framerate === 30
    }
  })
  const threadConstructor = patchThread(vm)
  let hyrenExports = Object.assign({}, (vm as any).exports, {
    IRGenerator,
    ScriptTreeGenerator,
    JSGenerator,
    Thread: threadConstructor,
    compilerExecute,
    execute: (seq: VM.Sequencer, thread: ExtendedThread) => {
      const currentStack = thread.peekStack()
      let isPromiseWaitOrYieldTick = false
      const proxy = new Proxy(thread, {
        get(target, p, receiver) {
          if (p === 'isCompiled')
            return false // Force to run in interpreter.
          else if (p === 'peekStack') {
            return () => currentStack
          } else if (p === 'peekStackFrame') {
            const _peekStackFrame = Reflect.get(target, p, receiver)
            return function (this: VM.Thread) {
              const result = _peekStackFrame.call(this)
              if (!result) return result
              return new Proxy(result, {
                get(target, p, receiver) {
                  if (p === 'warpMode') return false // Disables warp mode.
                  return Reflect.get(target, p, receiver)
                }
              })
            }
          } else if (p === 'goToNextBlock') {
            return () => {
              throw new HyrenInterrupt()
            }
          }
          return Reflect.get(target, p, receiver)
        },
        set(target, p, newValue, receiver) {
          if (p === 'status') {
            if (
              newValue === (threadConstructor as any).STATUS_RUNNING &&
              !isPromiseWaitOrYieldTick
            ) {
              return true
            } else if (newValue !== (threadConstructor as any).STATUS_YIELD) {
              isPromiseWaitOrYieldTick = true
            }
          } else if (p === 'blockGlowInFrame') return true // hyren: preventing set blockGlowInFrame (by stepThread())
          return Reflect.set(target, p, newValue, receiver)
        }
      })
      try {
        seq.stepThread(proxy)
      } catch (e) {
        if (!(e instanceof HyrenInterrupt)) throw e
      } finally {
        if (seq.activeThread) seq.activeThread = thread
      }
    },
    jsexecute: compilerExecute,
    i_will_not_ask_for_help_when_these_break: () =>
      // Compatibility with Turbowarp
      (vm as any).exports
  })
  patchTarget(vm)
  patchRenderer(vm)
  patchIO(vm)
  Object.defineProperty(vm as any, 'exports', {
    get() {
      return hyrenExports
    },
    set(v) {
      hyrenExports = Object.assign({}, v, hyrenExports)
    },
    configurable: true
  })

  runtime.constructor.prototype.emitCompileError = function (
    target: VM.RenderedTarget,
    error: object
  ) {
    this.emit((runtime as any).constructor.COMPILE_ERROR, target, error)
  }
  if (!runtime.constructor.prototype.getAddonBlock)
    runtime.constructor.prototype.getAddonBlock = () => null
  runtime.constructor.prototype.compilerRegisterExtension = function (
    this: any,
    name: string,
    extensionObject: object
  ) {
    if (name === 'pen' && (extensionObject as any).print) {
      // Aerfaying private APIs
      const { _getPenLayerID } = extensionObject as any
      extensionObject.constructor.prototype._getPenLayerID = function () {
        if (this._penSkinId < 0) {
          const id = _getPenLayerID.call(this)
          if (runtime.renderer) {
            ;(runtime.renderer as any)._penSkinId = id
            ;(runtime.renderer as any)._watermarkSkinId = this._watermarkSkinId
            const _updateRenderQuality =
              runtime.renderer.constructor.prototype._updateRenderQuality
            runtime.renderer.constructor.prototype._updateRenderQuality =
              function () {
                const penSkinId = this._penSkinId
                const watermarkSkinId = this._watermarkSkinId
                _updateRenderQuality.call(this)
                this._penSkinId = watermarkSkinId
                _updateRenderQuality.call(this)
                this._penSkinId = penSkinId
              }
          }
          return id
        } else return _getPenLayerID.call(this)
      }
    }
    this[`ext_${name}`] = extensionObject
  }
  const _registerBlockPackages = runtime._registerBlockPackages
  runtime.constructor.prototype._registerBlockPackages = function (this: any) {
    const _hasOwnProperty = Object.prototype.hasOwnProperty
    let defaultBlockPackages: any
    Object.prototype.hasOwnProperty = function () {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      defaultBlockPackages = this
      throw new HyrenInterrupt()
    }
    try {
      _registerBlockPackages.call(this)
      Object.prototype.hasOwnProperty = _hasOwnProperty
    } catch (e) {
      Object.prototype.hasOwnProperty = _hasOwnProperty
      if (!(e instanceof HyrenInterrupt)) throw e
      // Object.assign(defaultBlockPackages, twBlocks)
      for (const packageName in defaultBlockPackages) {
        if (
          Object.prototype.hasOwnProperty.call(
            defaultBlockPackages,
            packageName
          )
        ) {
          // @todo pass a different runtime depending on package privilege?
          const packageObject = new defaultBlockPackages[packageName](this)
          // Collect primitives from package.
          if (packageObject.getPrimitives) {
            const packagePrimitives = packageObject.getPrimitives()
            for (const op in packagePrimitives) {
              if (Object.prototype.hasOwnProperty.call(packagePrimitives, op)) {
                this._primitives[op] = packagePrimitives[op].bind(packageObject)
              }
            }
          }
          // Collect hat metadata from package.
          if (packageObject.getHats) {
            const packageHats = packageObject.getHats()
            for (const hatName in packageHats) {
              if (Object.prototype.hasOwnProperty.call(packageHats, hatName)) {
                this._hats[hatName] = packageHats[hatName]
              }
            }
          }
          // Collect monitored from package.
          if (packageObject.getMonitored) {
            this.monitorBlockInfo = Object.assign(
              {},
              this.monitorBlockInfo,
              packageObject.getMonitored()
            )
          }
          if (
            Object.prototype.hasOwnProperty.call(Compatibility, packageName)
          ) {
            Compatibility[packageName](packageObject)
          }
          this.compilerRegisterExtension(packageName, packageObject)
        }
      }
    }
  }
  const _registerInternalExtension = (vm.extensionManager as any)
    ._registerInternalExtension
  ;(
    vm.extensionManager as any
  ).constructor.prototype._registerInternalExtension = function (
    extensionObject: any
  ): any {
    const extensionInfo = extensionObject.getInfo()
    if (Object.prototype.hasOwnProperty.call(Compatibility, extensionInfo.id)) {
      Compatibility[extensionInfo.id](extensionObject)
    }
    const res = _registerInternalExtension.call(this, extensionObject)
    this.runtime.compilerRegisterExtension(extensionInfo.id, extensionObject)
    return res
  }
  runtime._registerBlockPackages()
  const _blocklyListen =
    runtime.flyoutBlocks.constructor.prototype.blocklyListen
  runtime.flyoutBlocks.constructor.prototype.blocklyListen = function (e: any) {
    if (typeof e !== 'object') return
    if (
      typeof e.blockId !== 'string' &&
      typeof e.varId !== 'string' &&
      typeof e.commentId !== 'string'
    ) {
      return
    }
    if (
      [
        'var_create',
        'var_delete',
        'comment_create',
        'comment_delete',
        'comment_change'
      ].includes(e.type)
    )
      this.resetCache()
    return _blocklyListen.call(this, e)
  }
  if (runtime.constructor.prototype.allScriptsByOpcodeDo) {
    const _startHats = runtime.constructor.prototype.startHats
    runtime.constructor.prototype.startHats = function (
      requestedHatOpcode: string,
      optMatchFields?: Record<string, string>,
      optTarget?: VM.Target
    ) {
      const _forEach = Array.prototype.forEach
      Array.prototype.forEach = function (callbackfn, thisArg) {
        Array.prototype.forEach = _forEach
        for (const [index, value] of this.entries()) {
          if (value?.isCompiled && value?.executableHat) {
            // It is quite likely that we are currently executing a block, so make sure
            // that we leave the compiler's state intact at the end.
            compilerExecute.saveGlobalState()
            compilerExecute(value)
            compilerExecute.restoreGlobalState()
          } else callbackfn.call(thisArg, value, index, this)
        }
      }
      try {
        return _startHats.call(
          this,
          requestedHatOpcode,
          optMatchFields,
          optTarget
        )
      } finally {
        Array.prototype.forEach = _forEach
      }
    }
  }
  const _resetCache = runtime.flyoutBlocks.constructor.prototype.resetCache
  runtime.flyoutBlocks.constructor.prototype.resetCache = function () {
    _resetCache.call(this)
    this._cache.compiledScripts = {}
    this._cache.compiledProcedures = {}
    this._cache.proceduresPopulated = false
  }
  runtime.constructor.prototype.resetAllCaches = function (this: VM.Runtime) {
    for (const target of this.targets) {
      if (target.isOriginal) {
        target.blocks.resetCache()
      }
    }
    this.flyoutBlocks.resetCache()
    this.monitorBlocks.resetCache()
  }
  runtime.constructor.prototype.precompile = function () {
    this.allScriptsDo((topBlockId: string, target: VM.RenderedTarget) => {
      const topBlock = target.blocks.getBlock(topBlockId)
      if (this.getIsHat(topBlock!.opcode)) {
        threadConstructor.prototype.tryCompile?.call({
          target,
          blockContainer: target.blocks,
          topBlock: topBlockId
        })
      }
    })
  }
  runtime.constructor.prototype.enableDebug = function () {
    this.resetAllCaches()
    this.debug = true
  }
  vm.constructor.prototype.enableDebug = function () {
    this.runtime.enableDebug()
    return 'enabled debug mode'
  }
  runtime.constructor.prototype.setCompilerOptions = function (
    compilerOptions: object
  ) {
    this.compilerOptions = Object.assign(
      {},
      this.compilerOptions,
      compilerOptions
    )
    this.resetAllCaches()
    this.emit(
      (runtime as any).constructor.COMPILER_OPTIONS_CHANGED,
      this.compilerOptions
    )
  }
  ;(vm as any).setCompilerOptions = function (compilerOptions: object) {
    ;(this.runtime as any).setCompilerOptions(compilerOptions)
  }
  ;(runtime as any).setCompilerOptions({
    enabled: true,
    warpTimer: !!(vm as any)._events.workspaceUpdate
  })
  if (!vm.runtime.constructor.prototype.parseProjectOptions) {
    const COMMENT_CONFIG_MAGIC = ' // _twconfig_'
    const _installTargets = vm.constructor.prototype.installTargets
    vm.constructor.prototype.installTargets = function (
      targets: object[],
      extensions: object,
      wholeProject: boolean
    ) {
      return _installTargets
        .call(this, targets, extensions, wholeProject)
        .then(() => {
          if (wholeProject) {
            this.runtime.parseProjectOptions()
          }
        })
    }
    vm.runtime.constructor.prototype.findProjectOptionsComment = function () {
      const target = this.getTargetForStage()
      const comments: any[] = target.comments
      for (const comment of Object.values(comments)) {
        if (comment.text.includes(COMMENT_CONFIG_MAGIC)) {
          return comment
        }
      }
      return null
    }
    vm.runtime.constructor.prototype.parseProjectOptions = function () {
      const comment = this.findProjectOptionsComment()
      if (!comment) return
      const lineWithMagic = comment.text
        .split('\n')
        .find((i: string) => i.endsWith(COMMENT_CONFIG_MAGIC))
      if (!lineWithMagic) {
        VMLog.warn('Config comment does not contain valid line')
        return
      }

      const jsonText = lineWithMagic.substr(
        0,
        lineWithMagic.length - COMMENT_CONFIG_MAGIC.length
      )
      let parsed: any
      try {
        parsed = ExtendedJSON.parse(jsonText)
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid object')
        }
      } catch (e) {
        VMLog.warn('Config comment has invalid JSON', e)
        return
      }

      if (typeof parsed.framerate === 'number') {
        if (parsed.framerate === 0) {
          MainLog.log(formatMessage('hyren.fps.sync'))
        } else {
          MainLog.log(
            formatMessage('hyren.fps').replace('%o', String(parsed.framerate))
          )
        }
        this.setFramerate(parsed.framerate)
      }
      if (parsed.turbo) {
        this.turboMode = true
        this.emit((vm.runtime.constructor as any).TURBO_MODE_ON)
      }
      if (parsed.interpolation) {
        this.setInterpolation(true)
        MainLog.log(formatMessage('hyren.interpolation.enabled'))
      }
      if (parsed.runtimeOptions) {
        if (parsed.runtimeOptions?.miscLimits === false)
          MainLog.log(formatMessage('hyren.miscLimits.disabled'))
        if (parsed.runtimeOptions?.fencing === false)
          MainLog.log(formatMessage('hyren.fencing.disabled'))
        if (typeof parsed.runtimeOptions?.maxClones !== 'undefined')
          MainLog.log(
            formatMessage('hyren.maxClones').replace(
              '%o',
              String(parsed.runtimeOptions.maxClones)
            )
          )
        this.setRuntimeOptions(parsed.runtimeOptions)
      }
      if (parsed.hq && this.renderer) {
        MainLog.log(formatMessage('hyren.hires.enabled'))
        this.renderer.setUseHighQualityRender(true)
      }
      const storedWidth = +parsed.width || this.stageWidth
      const storedHeight = +parsed.height || this.stageHeight
      if (
        storedWidth !== this.stageWidth ||
        storedHeight !== this.stageHeight
      ) {
        MainLog.log(
          formatMessage('hyren.size')
            .replace('%o', String(storedWidth))
            .replace('%2o', String(storedHeight))
        )
        this.setStageSize(storedWidth, storedHeight)
      }
    }
    vm.runtime.constructor.prototype.storeProjectOptions = function () {
      const options = this.generateDifferingProjectOptions()
      // TODO: translate
      const text = `Configuration for https://turbowarp.org/\nYou can move, resize, and minimize this comment, but don't edit it by hand. This comment can be deleted to remove the stored settings.\n${ExtendedJSON.stringify(options)}${COMMENT_CONFIG_MAGIC}`
      const existingComment = this.findProjectOptionsComment()
      if (existingComment) {
        existingComment.text = text
      } else {
        const target = this.getTargetForStage()
        // TODO: smarter position logic
        target.createComment(uid(), null, text, 50, 50, 350, 170, false)
      }
      this.emitProjectChanged()
    }
    vm.runtime.constructor.prototype.generateDifferingProjectOptions =
      function () {
        const difference = (oldObject: any, newObject: any) => {
          const result: any = {}
          for (const key of Object.keys(newObject)) {
            const newValue = newObject[key]
            const oldValue = oldObject[key]
            if (typeof newValue === 'object' && newValue) {
              const valueDiffering = difference(oldValue, newValue)
              if (Object.keys(valueDiffering).length > 0) {
                result[key] = valueDiffering
              }
            } else if (newValue !== oldValue) {
              result[key] = newValue
            }
          }
          return result
        }
        return difference(
          this._defaultStoredSettings,
          this._generateAllProjectOptions()
        )
      }
    vm.runtime.constructor.prototype._generateAllProjectOptions = function () {
      return {
        framerate: this.frameLoop?.framerate ?? 30,
        runtimeOptions: this.runtimeOptions,
        interpolation: this.interpolationEnabled ?? false,
        turbo: this.turboMode,
        hq: this.renderer ? this.renderer.useHighQualityRender ?? false : false,
        width: this.stageWidth ?? (vm.runtime.constructor as any).STAGE_WIDTH,
        height: this.stageHeight ?? (vm.runtime.constructor as any).STAGE_HEIGHT
      }
    }
    vm.constructor.prototype.storeProjectOptions = function () {
      this.runtime.storeProjectOptions()
      if (this.editingTarget.isStage) {
        this.emitWorkspaceUpdate()
      }
    }
    ;(vm.runtime as any)._defaultStoredSettings = (
      vm.runtime as any
    )._generateAllProjectOptions()
  }
  if (
    !(vm.runtime as any)._events[(vm.runtime.constructor as any).TURBO_MODE_ON]
  ) {
    vm.runtime.on((vm.runtime.constructor as any).TURBO_MODE_ON, () => {
      vm.emit((vm.runtime.constructor as any).TURBO_MODE_ON)
    })
  }
  if (
    !(vm.runtime as any)._events[(vm.runtime.constructor as any).TURBO_MODE_OFF]
  ) {
    vm.runtime.on((vm.runtime.constructor as any).TURBO_MODE_OFF, () => {
      vm.emit((vm.runtime.constructor as any).TURBO_MODE_OFF)
    })
  }
}
