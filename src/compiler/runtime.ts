import { ExtendedRuntime } from '../typing'
import patchThread from './thread'
import Compatibility from '../compatibility'

export default function patchRuntime(vm: VM) {
  const runtime = vm.runtime as ExtendedRuntime
  if (
    typeof runtime.compilerOptions !== 'object' ||
    runtime.compilerOptions === null ||
    typeof runtime.compilerOptions.enabled !== 'boolean' ||
    typeof runtime.compilerOptions.warpTimer !== 'boolean'
  ) {
    runtime.compilerOptions = {
      enabled: true,
      warpTimer: true
    }
  }
  patchThread(vm)
  runtime.constructor.prototype.emitCompileError = function () {}
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
  runtime.constructor.prototype.setCompilerOptions = function (
    compilerOptions: object
  ) {
    this.compilerOptions = Object.assign(
      {},
      this.compilerOptions,
      compilerOptions
    )
    this.resetAllCaches()
  }
}
