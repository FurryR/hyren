import { ExtendedRuntime } from '../typing'
import jsexecute = require('../../scratch-vm/src/compiler/jsexecute')
import patchThread from './thread'
import Compatibility from '../compatibility'
import { IRGenerator, ScriptTreeGenerator } from 'scratch-vm/src/compiler/irgen'
import JSGenerator = require('scratch-vm/src/compiler/jsgen')

export default function patchRuntime(vm: VM) {
  const runtime = vm.runtime as ExtendedRuntime
  const threadConstructor = patchThread(vm)
  let hyrenExports = Object.assign({}, (vm as any).exports, {
    IRGenerator,
    ScriptTreeGenerator,
    JSGenerator,
    Thread: threadConstructor,
    jsexecute,
    i_will_not_ask_for_help_when_these_break: () =>
      // Compatibility with Turbowarp
      (vm as any).exports
  })
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
    if ((runtime as any).constructor.COMPILE_ERROR)
      this.emit((runtime as any).constructor.COMPILE_ERROR, target, error)
  }
  if (!runtime.constructor.prototype.getAddonBlock)
    runtime.constructor.prototype.getAddonBlock = () => null
  runtime.constructor.prototype.compilerRegisterExtension = function (
    this: any,
    name: string,
    extensionObject: object
  ) {
    this[`ext_${name}`] = extensionObject
  }
  const _registerBlockPackages = runtime._registerBlockPackages
  runtime.constructor.prototype._registerBlockPackages = function (this: any) {
    const _hasOwnProperty = Object.prototype.hasOwnProperty
    let defaultBlockPackages: any
    Object.prototype.hasOwnProperty = function () {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      defaultBlockPackages = this
      throw new Error('interrupted by hyren')
    }
    try {
      _registerBlockPackages.call(this)
      Object.prototype.hasOwnProperty = _hasOwnProperty
    } catch (e) {
      Object.prototype.hasOwnProperty = _hasOwnProperty
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
  if (
    typeof runtime.compilerOptions !== 'object' ||
    runtime.compilerOptions === null ||
    typeof runtime.compilerOptions.enabled !== 'boolean' ||
    typeof runtime.compilerOptions.warpTimer !== 'boolean'
  ) {
    runtime.constructor.prototype.setCompilerOptions = function (
      compilerOptions: object
    ) {
      this.compilerOptions = Object.assign(
        {},
        this.compilerOptions,
        compilerOptions
      )
      this.resetAllCaches()
      if ((runtime as any).constructor.COMPILER_OPTIONS_CHANGED)
        this.emit(
          (runtime as any).constructor.COMPILER_OPTIONS_CHANGED,
          compilerOptions
        )
    }
    ;(vm as any).setCompilerOptions = function (compilerOptions: object) {
      ;(this.runtime as any).setCompilerOptions(compilerOptions)
    }
    ;(runtime as any).setCompilerOptions({
      enabled: true,
      warpTimer: !!(vm as any)._events.workspaceUpdate
    })
  }
}
