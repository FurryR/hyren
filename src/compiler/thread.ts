import compilerExecute = require('scratch-vm/src/compiler/jsexecute')
import Thread = require('scratch-vm/src/engine/thread')
import {
  ExtendedRuntime,
  ExtendedThread,
  ExtendedThreadConstructor
} from '../typing'

import { ExtendedBlockContainerConstructor } from '../typing'

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
function patchBlockContainerInternal(
  blockContainerConstructor: ExtendedBlockContainerConstructor
) {
  if (!patchBlockContainerInternal.initalized) {
    for (const [k, v] of Object.entries(BlocksImplement)) {
      Reflect.set(blockContainerConstructor.prototype, k, v)
    }
    patchBlockContainerInternal.initalized = true
  }
}
patchBlockContainerInternal.initalized = false

function patchThreadInternal(threadConstructor: ExtendedThreadConstructor) {
  threadConstructor.prototype.tryCompile = function (this: VM.Thread) {
    const blocks: any = this.blockContainer
    if (!blocks._cache.compiledScripts) blocks._cache.compiledScripts = {}
    if (!blocks._cache.compiledProcedures) blocks._cache.compiledProcedures = {}
    Thread.prototype.tryCompile.call(this)
  }
  threadConstructor.prototype.getId = Thread.prototype.getId
}

export default function patchThread(vm: VM): ExtendedThreadConstructor {
  const runtime = vm.runtime as ExtendedRuntime
  // Hack to disable compliation before first compiling.
  const thread = runtime._pushThread('', {} as VM.RenderedTarget, {
    updateMonitor: true
  })
  runtime.threads.pop()
  patchThreadInternal(thread.constructor as ExtendedThreadConstructor)

  const _pushThread = runtime._pushThread
  runtime.constructor.prototype._pushThread = function (
    topBlockId: string,
    target: VM.RenderedTarget,
    options: any
  ) {
    patchBlockContainerInternal(
      target.blocks.constructor as ExtendedBlockContainerConstructor
    )
    const res = _pushThread.call(
      this,
      topBlockId,
      target,
      options
    ) as ExtendedThread
    // tw: compile new threads. Do not attempt to compile monitor threads.
    if (
      !(options && options.updateMonitor) &&
      typeof res.triedToCompile === 'undefined' &&
      this.compilerOptions?.enabled
    ) {
      res.tryCompile()
    }
    return res
  }
  const _restartThread = runtime.constructor.prototype._restartThread
  runtime.constructor.prototype._restartThread = function (thread: VM.Thread) {
    const newThread: any = _restartThread.call(this, thread)
    if (newThread.triedToCompile && this.compilerOptions.enabled) {
      newThread.tryCompile()
    }
    return newThread
  }
  const sequencer: VM.Sequencer = runtime.sequencer
  const _stepThread = sequencer.stepThread
  sequencer.constructor.prototype.stepThread = function stepThread(
    this: VM.Sequencer,
    thread: VM.Thread
  ): void {
    patchBlockContainerInternal(
      thread.target.blocks.constructor as ExtendedBlockContainerConstructor
    )
    if ((thread as any).isCompiled) {
      compilerExecute(thread)
      return
    } else return _stepThread.call(this, thread)
  }
  // note: legacy Scratch does not step immediately after new threads being created, so there is no need to patch.
  // if (runtime.constructor.prototype.allScriptsByOpcodeDo) {
  //   const _startHats = runtime.constructor.prototype.startHats
  //   runtime.constructor.prototype.startHats = function (
  //     this: any,
  //     requestedHatOpcode: string,
  //     optMatchFields?: Record<string, unknown>,
  //     optTarget?: VM.Target
  //   ): VM.Thread[] | undefined {
  //     const _forEach = Array.prototype.forEach
  //     Array.prototype.forEach = function patchedForeach(predict) {
  //       Array.prototype.forEach = _forEach
  //       for (const [index, value] of this.entries()) {
  //         if (value?.isCompiled) {
  //           // It is quite likely that we are currently executing a block, so make sure
  //           // that we leave the compiler's state intact at the end.
  //           compilerExecute.saveGlobalState()
  //           compilerExecute(value)
  //           compilerExecute.restoreGlobalState()
  //         } else predict(value, index, this)
  //       }
  //     }
  //     try {
  //       return _startHats.call(
  //         this,
  //         requestedHatOpcode,
  //         optMatchFields,
  //         optTarget
  //       )
  //     } finally {
  //       Array.prototype.forEach = _forEach
  //     }
  //   }
  // }
  return thread.constructor as ExtendedThreadConstructor
}
