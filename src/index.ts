import Thread = require('../scratch-vm/src/engine/thread')
import nanolog = require('./log/index.cjs')
import compilerExecute = require('../scratch-vm/src/compiler/jsexecute')
import * as VM from 'scratch-vm'
nanolog.enable()
const MainLog = nanolog('main')
interface ExtendedRuntime extends VM.Runtime {
  compilerOptions?: {
    enabled?: boolean
    warpTimer?: boolean
  }
  _registerBlockPackages(): void
}
interface ExtendedThread extends VM.Thread {
  tryCompile(): void
}
interface ExtendedThreadConstructor {
  new (warpMode: boolean): VM.Thread
  prototype: {
    tryCompile?(): void
    getId?(): string
  }
}
interface ExtendedBlockContainerConstructor {
  new (runtime: VM.Runtime, optNoGlow?: boolean): VM.Blocks
  prototype: {
    getProcedureDefinition?(name: string): string | null
    _getCustomBlockInternal?(defineBlock: object): object
    populateProcedureCache?(): void
    getCachedCompileResult?(blockId: string): any
    cacheCompileResult?(blockId: string, value: any): void
    cacheCompileError?(blockId: string, error: any): void
  }
}
const BlocksImplement = {
  /**
   * Get the cached compilation result of a block.
   * @param {string} blockId ID of the top block.
   * @returns {{success: boolean; value: any}|null} Cached success or error, or null if there is no cached value.
   */
  getCachedCompileResult(this: any, blockId: string): any {
    if (
      Object.prototype.hasOwnProperty.call(this._cache.compiledScripts, blockId)
    ) {
      return this._cache.compiledScripts[blockId]
    }
    return null
  },

  /**
   * Set the cached compilation result of a script.
   * @param {string} blockId ID of the top block.
   * @param {*} value The compilation result to store.
   */
  cacheCompileResult(this: any, blockId: string, value: any) {
    this._cache.compiledScripts[blockId] = {
      success: true,
      value: value
    }
  },

  /**
   * Set the cached error of a script.
   * @param {string} blockId ID of the top block.
   * @param {*} error The error to store.
   */
  cacheCompileError(this: any, blockId: string, error: any) {
    this._cache.compiledScripts[blockId] = {
      success: false,
      value: error
    }
  },
  /**
   * Get the procedure definition for a given name.
   * @param {?string} name Name of procedure to query.
   * @return {?string} ID of procedure definition.
   */
  getProcedureDefinition(this: any, name: any): string | null {
    const blockID = this._cache.procedureDefinitions[name]
    if (typeof blockID !== 'undefined') {
      return blockID
    }

    for (const id in this._blocks) {
      if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue
      const block = this._blocks[id]
      if (block.opcode === 'procedures_definition') {
        // tw: make sure that populateProcedureCache is kept up to date with this method
        const internal = this._getCustomBlockInternal(block)
        if (internal && internal.mutation.proccode === name) {
          this._cache.procedureDefinitions[name] = id // The outer define block id
          return id
        }
      }
    }
    this._cache.procedureDefinitions[name] = null
    return null
  },
  /**
   * Helper to get the corresponding internal procedure definition block
   * @param {!object} defineBlock Outer define block.
   * @return {!object} internal definition block which has the mutation.
   */
  _getCustomBlockInternal(this: any, defineBlock: any): any {
    if (defineBlock.inputs && defineBlock.inputs.custom_block) {
      return this._blocks[defineBlock.inputs.custom_block.block]
    }
  },
  /**
   * tw: Setup the procedureParamNames and procedureDefinitions caches all at once.
   * This makes subsequent calls to these methods faster.
   */
  populateProcedureCache(this: any) {
    if (this._cache.proceduresPopulated) {
      return
    }
    for (const id in this._blocks) {
      if (!Object.prototype.hasOwnProperty.call(this._blocks, id)) continue
      const block = this._blocks[id]

      if (block.opcode === 'procedures_prototype') {
        const name = block.mutation.proccode
        if (!this._cache.procedureParamNames[name]) {
          const names = JSON.parse(block.mutation.argumentnames)
          const ids = JSON.parse(block.mutation.argumentids)
          const defaults = JSON.parse(block.mutation.argumentdefaults)
          this._cache.procedureParamNames[name] = [names, ids, defaults]
        }
        continue
      }

      if (block.opcode === 'procedures_definition') {
        const internal = this._getCustomBlockInternal(block)
        if (internal) {
          const name = internal.mutation.proccode
          if (!this._cache.procedureDefinitions[name]) {
            this._cache.procedureDefinitions[name] = id
          }
          continue
        }
      }
    }
    this._cache.proceduresPopulated = true
  }
}
function patchThread(threadConstructor: ExtendedThreadConstructor) {
  if (!patchThread.initalized) {
    threadConstructor.prototype.tryCompile = function (this: VM.Thread) {
      const blocks: any = this.blockContainer
      if (!blocks._cache.compiledScripts) blocks._cache.compiledScripts = {}
      if (!blocks._cache.compiledProcedures)
        blocks._cache.compiledProcedures = {}
      Thread.prototype.tryCompile.call(this)
    }
    threadConstructor.prototype.getId = Thread.prototype.getId
    patchThread.initalized = true
  }
}
patchThread.initalized = false
function patchBlockContainer(
  blockContainerConstructor: ExtendedBlockContainerConstructor
) {
  if (!patchBlockContainer.initalized) {
    for (const [k, v] of Object.entries(BlocksImplement)) {
      Reflect.set(blockContainerConstructor.prototype, k, v)
    }
    patchBlockContainer.initalized = true
  }
}
patchBlockContainer.initalized = false
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
  runtime.constructor.prototype.emitCompileError = function () {}
  if (!runtime.constructor.prototype.getAddonBlock)
    runtime.constructor.prototype.getAddonBlock = () => null
  if (!runtime.constructor.prototype.compilerRegisterExtension) {
    runtime.constructor.prototype.compilerRegisterExtension = function (
      this: any,
      name: string,
      extensionObject: object
    ) {
      this[`ext_${name}`] = extensionObject
    }
    const _registerBlockPackages = runtime._registerBlockPackages
    runtime.constructor.prototype._registerBlockPackages = function (
      this: any
    ) {
      const _hasOwnProperty = Object.prototype.hasOwnProperty
      let defaultBlockPackages: any
      Object.prototype.hasOwnProperty = function () {
        defaultBlockPackages = this
        throw new Error('interrupted by hyren')
      }
      try {
        _registerBlockPackages.call(this)
        Object.prototype.hasOwnProperty = _hasOwnProperty
      } catch {
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
                if (
                  Object.prototype.hasOwnProperty.call(packagePrimitives, op)
                ) {
                  this._primitives[op] =
                    packagePrimitives[op].bind(packageObject)
                }
              }
            }
            // Collect hat metadata from package.
            if (packageObject.getHats) {
              const packageHats = packageObject.getHats()
              for (const hatName in packageHats) {
                if (
                  Object.prototype.hasOwnProperty.call(packageHats, hatName)
                ) {
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
            switch (packageName) {
              case 'scratch3_control': {
                packageObject._createClone = function (
                  this: any,
                  cloneOption: string,
                  target: VM.RenderedTarget
                ) {
                  this.createClone({ CLONE_OPTION: cloneOption }, { target })
                }
                break
              }
              case 'scratch3_operators': {
                packageObject._random = function (
                  this: any,
                  from: number,
                  to: number
                ) {
                  return this.random({ FROM: from, TO: to })
                }
                break
              }
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
      switch (extensionInfo.id) {
        case 'pen': {
          extensionObject._setPenColorToColor = function (
            this: any,
            color: string,
            target: VM.RenderedTarget
          ) {
            this.setPenColorToColor({ COLOR: color }, { target })
          }
          extensionObject._setPenSizeTo = function (
            this: any,
            size: number,
            target: VM.RenderedTarget
          ) {
            this.setPenSizeTo({ SIZE: String(size) }, { target })
          }
          extensionObject._penDown = function (
            this: any,
            target: VM.RenderedTarget
          ) {
            this.penDown({}, { target })
          }
          extensionObject._penUp = function (
            this: any,
            target: VM.RenderedTarget
          ) {
            this.penUp({}, { target })
          }
          extensionObject._stamp = function (
            this: any,
            target: VM.RenderedTarget
          ) {
            this.stamp({}, { target })
          }
          break
        }
      }
      const res = _registerInternalExtension.call(this, extensionObject)
      this.runtime.compilerRegisterExtension(extensionInfo.id, extensionObject)
      return res
    }
    runtime._registerBlockPackages()
  }
  const _pushThread = runtime._pushThread
  runtime.constructor.prototype._pushThread = function (
    topBlockId: string,
    target: VM.RenderedTarget,
    options: any
  ) {
    const res = _pushThread.call(
      this,
      topBlockId,
      target,
      options
    ) as ExtendedThread
    patchThread(res.constructor as ExtendedThreadConstructor)
    patchBlockContainer(
      res.target.blocks.constructor as ExtendedBlockContainerConstructor
    )
    // tw: compile new threads. Do not attempt to compile monitor threads.
    if (!(options && options.updateMonitor) && this.compilerOptions?.enabled) {
      res.tryCompile()
    }
    return res
  }
  const sequencer: VM.Sequencer = runtime.sequencer
  const _stepThread = sequencer.stepThread
  sequencer.constructor.prototype.stepThread = function stepThread(
    this: VM.Sequencer,
    thread: VM.Thread
  ): void {
    patchThread(thread.constructor as ExtendedThreadConstructor)
    patchBlockContainer(
      thread.target.blocks.constructor as ExtendedBlockContainerConstructor
    )
    if ((thread as any).isCompiled) {
      compilerExecute(thread)
      return
    } else return _stepThread.call(this, thread)
  }
  // note: legacy Scratch does not step immediately after new threads being created, so there is no need to patch.
  if (runtime.constructor.prototype.allScriptsByOpcodeDo) {
    runtime.constructor.prototype.startHats = function (
      this: any,
      requestedHatOpcode: string,
      optMatchFields?: Record<string, unknown>,
      optTarget?: VM.Target
    ): VM.Thread[] | undefined {
      if (
        !Object.prototype.hasOwnProperty.call(this._hats, requestedHatOpcode)
      ) {
        // No known hat with this opcode.
        return
      }
      const instance = this
      const newThreads: any[] = []
      // Look up metadata for the relevant hat.
      const hatMeta = instance._hats[requestedHatOpcode]

      for (const opts in optMatchFields) {
        if (!Object.prototype.hasOwnProperty.call(optMatchFields, opts))
          continue
        optMatchFields[opts] = (optMatchFields[opts] as string).toUpperCase()
      }

      // tw: By assuming that all new threads will not interfere with eachother, we can optimize the loops
      // inside the allScriptsByOpcodeDo callback below.
      const startingThreadListLength = this.threads.length

      // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
      this.allScriptsByOpcodeDo(
        requestedHatOpcode,
        (script: any, target: any) => {
          const { blockId: topBlockId, fieldsOfInputs: hatFields } = script

          // Match any requested fields.
          // For example: ensures that broadcasts match.
          // This needs to happen before the block is evaluated
          // (i.e., before the predicate can be run) because "broadcast and wait"
          // needs to have a precise collection of started threads.
          for (const matchField in optMatchFields) {
            if (hatFields[matchField].value !== optMatchFields[matchField]) {
              // Field mismatch.
              return
            }
          }

          if (hatMeta.restartExistingThreads) {
            // If `restartExistingThreads` is true, we should stop
            // any existing threads starting with the top block.
            // hyren: use threads instead because original Scratch does not support it.
            const possibleThreadId = Thread.getIdFromTargetAndBlock(
              target,
              topBlockId
            )
            const existingThread = this.threads.find(
              (v: any) => v.getId() === possibleThreadId
            )
            if (existingThread) {
              newThreads.push(this._restartThread(existingThread))
              return
            }
          } else {
            // If `restartExistingThreads` is false, we should
            // give up if any threads with the top block are running.
            for (let j = 0; j < startingThreadListLength; j++) {
              if (
                this.threads[j].target === target &&
                this.threads[j].topBlock === topBlockId &&
                // stack click threads and hat threads can coexist
                !this.threads[j].stackClick &&
                this.threads[j].status !== Thread.STATUS_DONE
              ) {
                // Some thread is already running.
                return
              }
            }
          }
          // Start the thread with this top block.
          newThreads.push(this._pushThread(topBlockId, target))
        },
        optTarget
      )
      // For compatibility with Scratch 2, edge triggered hats need to be processed before
      // threads are stepped. See ScratchRuntime.as for original implementation
      newThreads.forEach(thread => {
        if (thread.isCompiled) {
          if (thread.executableHat) {
            // It is quite likely that we are currently executing a block, so make sure
            // that we leave the compiler's state intact at the end.
            compilerExecute.saveGlobalState()
            compilerExecute(thread)
            compilerExecute.restoreGlobalState()
          }
        } else {
          // execute(this.sequencer, thread)
          // thread.goToNextBlock()
          this.sequencer.stepThread(thread)
        }
      })
      return newThreads
    }
  }
})
