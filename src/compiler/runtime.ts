import { ExtendedRuntime, ExtendedThread } from '../typing'
import compilerExecute = require('../../scratch-vm/src/compiler/jsexecute')
import patchThread from './thread'
import patchRenderer from './renderer'
import patchIO from './io'
import patchTarget from './target'
import Compatibility from '../compatibility'
import { IRGenerator, ScriptTreeGenerator } from 'scratch-vm/src/compiler/irgen'
import JSGenerator = require('scratch-vm/src/compiler/jsgen')

export default function patchRuntime(vm: VM) {
  class HyrenError extends Error {
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
  vm.runtime.constructor.prototype.setRuntimeOptions = function (
    runtimeOptions: any
  ) {
    this.runtimeOptions = Object.assign({}, this.runtimeOptions, runtimeOptions)
    this.emit(
      (vm.runtime.constructor as any).COMPILER_OPTIONS_CHANGED,
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
  patchRenderer(vm)
  patchTarget(vm)
  patchIO(vm)
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
          if (p === 'isCompiled') return false // Force to run in interpreter.
          if (p === 'peekStack') {
            return () => currentStack
          }
          if (p === 'peekStackFrame') {
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
          }
          if (p === 'goToNextBlock') {
            return () => {
              throw new HyrenError()
            }
          }
          return Reflect.get(target, p, receiver)
        },
        set(target, p, newValue, receiver) {
          if (
            p === 'status' &&
            newValue === (threadConstructor as any).STATUS_RUNNING &&
            !isPromiseWaitOrYieldTick
          ) {
            return true
          } else {
            isPromiseWaitOrYieldTick = true
          }
          return Reflect.set(target, p, newValue, receiver)
        }
      })
      try {
        seq.stepThread(proxy)
      } catch (e) {
        if (!(e instanceof HyrenError)) throw e
      } finally {
        if (seq.activeThread) seq.activeThread = thread
      }
    },
    jsexecute: compilerExecute,
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
      throw new HyrenError()
    }
    try {
      _registerBlockPackages.call(this)
      Object.prototype.hasOwnProperty = _hasOwnProperty
    } catch (e) {
      Object.prototype.hasOwnProperty = _hasOwnProperty
      if (!(e instanceof HyrenError)) throw e
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
  // runtime.constructor.prototype.startHats = function (
  //   requestedHatOpcode: string,
  //   optMatchFields?: Record<string, string>,
  //   optTarget?: VM.Target
  // ) {
  //   if (!Object.prototype.hasOwnProperty.call(this._hats, requestedHatOpcode)) {
  //     // No known hat with this opcode.
  //     return
  //   }
  //   const instance = this
  //   const newThreads: VM.Thread[] = []
  //   // Look up metadata for the relevant hat.
  //   const hatMeta = instance._hats[requestedHatOpcode]

  //   for (const opts in optMatchFields) {
  //     if (!Object.prototype.hasOwnProperty.call(optMatchFields, opts)) continue
  //     optMatchFields[opts] = optMatchFields[opts].toUpperCase()
  //   }

  //   // tw: By assuming that all new threads will not interfere with eachother, we can optimize the loops
  //   // inside the allScriptsByOpcodeDo callback below.
  //   const startingThreadListLength = this.threads.length

  //   // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
  //   this.allScriptsByOpcodeDo(
  //     requestedHatOpcode,
  //     (script: any, target: VM.Target) => {
  //       const { blockId: topBlockId, fieldsOfInputs: hatFields } = script

  //       // Match any requested fields.
  //       // For example: ensures that broadcasts match.
  //       // This needs to happen before the block is evaluated
  //       // (i.e., before the predicate can be run) because "broadcast and wait"
  //       // needs to have a precise collection of started threads.
  //       for (const matchField in optMatchFields) {
  //         if (hatFields[matchField].value !== optMatchFields[matchField]) {
  //           // Field mismatch.
  //           return
  //         }
  //       }

  //       if (hatMeta.restartExistingThreads) {
  //         // If `restartExistingThreads` is true, we should stop
  //         // any existing threads starting with the top block.
  //         // hyren: use `this.threads` instead of `this.threadMap` as non-Turbowarp Scratch does not have it.
  //         const existingThread = this.threads.find(
  //           (v: any) => v.target === target && v.topBlock === topBlockId
  //         )
  //         if (existingThread) {
  //           newThreads.push(this._restartThread(existingThread))
  //           return
  //         }
  //       } else {
  //         // If `restartExistingThreads` is false, we should
  //         // give up if any threads with the top block are running.
  //         for (let j = 0; j < startingThreadListLength; j++) {
  //           if (
  //             this.threads[j].target === target &&
  //             this.threads[j].topBlock === topBlockId &&
  //             // stack click threads and hat threads can coexist
  //             !this.threads[j].stackClick &&
  //             this.threads[j].status !== (threadConstructor as any).STATUS_DONE
  //           ) {
  //             // Some thread is already running.
  //             return
  //           }
  //         }
  //       }
  //       // Start the thread with this top block.
  //       newThreads.push(this._pushThread(topBlockId, target))
  //     },
  //     optTarget
  //   )
  //   // For compatibility with Scratch 2, edge triggered hats need to be processed before
  //   // threads are stepped. See ScratchRuntime.as for original implementation
  //   newThreads.forEach((thread: any) => {
  //     if (thread.isCompiled) {
  //       if (thread.executableHat) {
  //         // It is quite likely that we are currently executing a block, so make sure
  //         // that we leave the compiler's state intact at the end.
  //         compilerExecute.saveGlobalState()
  //         compilerExecute(thread)
  //         compilerExecute.restoreGlobalState()
  //       }
  //     } else {
  //       execute(this.sequencer, thread)
  //       thread.goToNextBlock()
  //     }
  //   })
  //   return newThreads
  // }
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
  runtime.constructor.prototype.setCompilerOptions = function (
    compilerOptions: object
  ) {
    if (
      typeof runtime.compilerOptions === 'object' &&
      runtime.compilerOptions !== null
    )
      Object.assign(this.compilerOptions, compilerOptions)
    else
      this.compilerOptions = Object.assign(
        {},
        this.compilerOptions,
        compilerOptions
      )
    this.resetAllCaches()
    this.emit(
      (runtime as any).constructor.COMPILER_OPTIONS_CHANGED,
      compilerOptions
    )
  }
  ;(vm as any).setCompilerOptions = function (compilerOptions: object) {
    ;(this.runtime as any).setCompilerOptions(compilerOptions)
  }
  if (
    typeof runtime.compilerOptions !== 'object' ||
    runtime.compilerOptions === null ||
    typeof runtime.compilerOptions.enabled !== 'boolean' ||
    typeof runtime.compilerOptions.warpTimer !== 'boolean'
  ) {
    ;(runtime as any).setCompilerOptions({
      enabled: true,
      warpTimer: !!(vm as any)._events.workspaceUpdate
    })
  }
}
