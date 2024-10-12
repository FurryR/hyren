import RenderWebGL = require('scratch-render/dist/web/scratch-render.js')
import FrameLoop = require('scratch-vm/src/engine/tw-frame-loop')
import interpolate = require('scratch-vm/src/engine/tw-interpolate')

export default function patchRenderer(vm: VM) {
  /**
   * Numeric ID for Runtime._step in Profiler instances.
   * @type {number}
   */
  let stepProfilerId: number = -1
  /**
   * Numeric ID for Sequencer.stepThreads in Profiler instances.
   * @type {number}
   */
  let stepThreadsProfilerId: number = -1
  /**
   * Numeric ID for RenderWebGL.draw in Profiler instances.
   * @type {number}
   */
  let rendererDrawProfilerId: number = -1
  function onReady() {
    if (!(vm.runtime.constructor as any).FRAMERATE_CHANGED)
      Object.defineProperty(vm.runtime.constructor, 'FRAMERATE_CHANGED', {
        value: 'FRAMERATE_CHANGED',
        writable: false
      })
    if (!(vm.runtime.constructor as any).INTERPOLATION_CHANGED)
      Object.defineProperty(vm.runtime.constructor, 'INTERPOLATION_CHANGED', {
        value: 'INTERPOLATION_CHANGED',
        writable: false
      })
    if (!(vm.runtime.constructor as any).RUNTIME_STOPPED)
      Object.defineProperty(vm.runtime.constructor, 'RUNTIME_STOPPED', {
        value: 'RUNTIME_STOPPED',
        writable: false
      })
    if (!(vm.runtime.constructor as any).MONITORS_UPDATE)
      Object.defineProperty(vm.runtime.constructor, 'MONITORS_UPDATE', {
        value: 'MONITORS_UPDATE',
        writable: false
      })
    if (!(vm.runtime.constructor as any).STAGE_SIZE_CHANGED)
      Object.defineProperty(vm.runtime.constructor, 'STAGE_SIZE_CHANGED', {
        value: 'STAGE_SIZE_CHANGED',
        writable: false
      })
    ;(vm.runtime as any).frameLoop = new FrameLoop(vm.runtime)
    ;(vm.runtime as any).interpolationEnabled = false
    const _attachRenderer = vm.runtime.attachRenderer
    ;(vm.runtime as any).attachRenderer = function (renderer: RenderWebGL) {
      _attachRenderer.call(this, renderer)
      this.renderer.offscreenTouching = !this.runtimeOptions.fencing
    }
    ;(vm.runtime as any)._renderInterpolatedPositions = function () {
      const frameStarted = this._lastStepTime
      const now = Date.now()
      const timeSinceStart = now - frameStarted
      const progressInFrame = Math.min(
        1,
        Math.max(0, timeSinceStart / this.currentStepTime)
      )

      interpolate.interpolate(this, progressInFrame)

      if (this.renderer) {
        this.renderer.draw()
      }
    }
    ;(vm.runtime as any).quit = function () {
      if (!this.frameLoop.running) {
        return
      }
      this.frameLoop.stop()
      this.emit((vm.runtime.constructor as any).RUNTIME_STOPPED)
    }
    /**
     * Set whether we are in 30 TPS compatibility mode.
     * @param {boolean} compatibilityModeOn True iff in compatibility mode.
     */
    ;(vm.runtime as any).setCompatibilityMode = function (
      compatibilityModeOn: boolean
    ) {
      // tw: "compatibility mode" is replaced with a generic framerate setter,
      // but this method is kept for compatibility
      if (compatibilityModeOn) {
        this.setFramerate(30)
      } else {
        this.setFramerate(60)
      }
    }

    /**
     * tw: Change runtime target frames per second
     * @param {number} framerate Target frames per second
     */
    ;(vm.runtime as any).setFramerate = function (framerate: number) {
      // Setting framerate to anything greater than this is unnecessary and can break the sequencer
      // Additionally, the JS spec says intervals can't run more than once every 4ms (250/s) anyways
      if (framerate > 250) framerate = 250
      // Convert negative framerates to 1FPS
      // Note that 0 is a special value which means "matching device screen refresh rate"
      if (framerate < 0) framerate = 1
      this.frameLoop.setFramerate(framerate)
      this.emit((vm.runtime.constructor as any).FRAMERATE_CHANGED, framerate)
    }

    /**
     * tw: Enable or disable interpolation.
     * @param {boolean} interpolationEnabled True if interpolation should be enabled.
     */
    ;(vm.runtime as any).setInterpolation = function (
      interpolationEnabled: boolean
    ) {
      this.interpolationEnabled = interpolationEnabled
      this.frameLoop.setInterpolation(this.interpolationEnabled)
      this.emit(
        (vm.runtime.constructor as any).INTERPOLATION_CHANGED,
        interpolationEnabled
      )
    }
    ;(vm.runtime as any)._step = function (this: any) {
      if (this.interpolationEnabled) {
        interpolate.setupInitialState(this)
      }

      if (this.profiler !== null) {
        if (stepProfilerId === -1) {
          stepProfilerId = this.profiler.idByName('Runtime._step')
        }
        this.profiler.start(stepProfilerId)
      }

      // Clean up threads that were told to stop during or since the last step
      this.threads = this.threads.filter(
        (thread: VM.Thread) => !thread.isKilled
      )

      // hyren: not all Scratch versions have `runtime.threadMap`.
      if (this.updateThreadMap) this.updateThreadMap()

      // Find all edge-activated hats, and add them to threads to be evaluated.
      for (const hatType in this._hats) {
        if (!Object.prototype.hasOwnProperty.call(this._hats, hatType)) continue
        const hat = this._hats[hatType]
        if (hat.edgeActivated) {
          this.startHats(hatType)
        }
      }
      this.redrawRequested = false
      this._pushMonitors()
      if (this.profiler !== null) {
        if (stepThreadsProfilerId === -1) {
          stepThreadsProfilerId = this.profiler.idByName(
            'Sequencer.stepThreads'
          )
        }
        this.profiler.start(stepThreadsProfilerId)
      }
      this.emit((vm.runtime.constructor as any).BEFORE_EXECUTE)
      const doneThreads = this.sequencer.stepThreads()
      if (this.profiler !== null) {
        this.profiler.stop()
      }
      this.emit((vm.runtime.constructor as any).AFTER_EXECUTE)
      this._updateGlows(doneThreads)
      // Add done threads so that even if a thread finishes within 1 frame, the green
      // flag will still indicate that a script ran.
      this._emitProjectRunStatus(
        this.threads.length +
          doneThreads.length -
          this._getMonitorThreadCount([...this.threads, ...doneThreads])
      )
      // Store threads that completed this iteration for testing and other
      // internal purposes.
      this._lastStepDoneThreads = doneThreads
      if (this.renderer) {
        // @todo: Only render when this.redrawRequested or clones rendered.
        if (this.profiler !== null) {
          if (rendererDrawProfilerId === -1) {
            rendererDrawProfilerId = this.profiler.idByName('RenderWebGL.draw')
          }
          this.profiler.start(rendererDrawProfilerId)
        }
        // tw: do not draw if document is hidden or a rAF loop is running
        // Checking for the animation frame loop is more reliable than using
        // interpolationEnabled in some edge cases
        if (!document.hidden && !this.frameLoop._interpolationAnimation) {
          this.renderer.draw()
        }
        if (this.profiler !== null) {
          this.profiler.stop()
        }
      }

      if (this._refreshTargets) {
        this.emit(
          (vm.runtime.constructor as any).TARGETS_UPDATE,
          false /* Don't emit project changed */
        )
        this._refreshTargets = false
      }

      if (!this._prevMonitorState.equals(this._monitorState)) {
        this.emit(
          (vm.runtime.constructor as any).MONITORS_UPDATE,
          this._monitorState
        )
        this._prevMonitorState = this._monitorState
      }

      if (this.profiler !== null) {
        this.profiler.stop()
        this.profiler.reportFrames()
      }

      if (this.interpolationEnabled) {
        this._lastStepTime = Date.now()
      }
    }
    ;(vm.runtime as any).start = function () {
      // Do not start if we are already running
      if (this.frameLoop.running) return
      this.frameLoop.start()
      this.emit((vm.runtime.constructor as any).RUNTIME_STARTED)
    }
    ;(vm.runtime as any).setStageSize = function (
      width: number,
      height: number
    ) {
      width = Math.round(Math.max(1, width))
      height = Math.round(Math.max(1, height))
      if (this.stageWidth !== width || this.stageHeight !== height) {
        const deltaX = width - this.stageWidth
        const deltaY = height - this.stageHeight
        // Preserve monitor location relative to the center of the stage
        if (this._monitorState.size > 0) {
          const offsetX = deltaX / 2
          const offsetY = deltaY / 2
          for (const monitor of this._monitorState.valueSeq()) {
            const newMonitor = monitor
              .set('x', monitor.get('x') + offsetX)
              .set('y', monitor.get('y') + offsetY)
            this.requestUpdateMonitor(newMonitor)
          }
          this.emit(
            (vm.runtime.constructor as any).MONITORS_UPDATE,
            this._monitorState
          )
        }

        this.stageWidth = width
        this.stageHeight = height
        if (this.renderer) {
          this.renderer.setStageSize(
            -width / 2,
            width / 2,
            -height / 2,
            height / 2
          )
        }
      }
      this.emit(
        (vm.runtime.constructor as any).STAGE_SIZE_CHANGED,
        width,
        height
      )
    }
    const renderer = vm.runtime.renderer
    if ((renderer as any)._gandiShaderManager) {
      // Gandi modifies renderer (incompatible changes) for a lot -- because of Quake. As it reimplemented Turbowarp APIs, we just keep it.
      return
    }
    const {
      _gl,
      canvas,
      _xLeft,
      _xRight,
      _yBottom,
      _yTop,
      _events,
      _shaderManager
    } = renderer as any

    Object.setPrototypeOf(renderer, null)
    for (const key of Object.getOwnPropertyNames(renderer)) {
      delete renderer[key as keyof RenderWebGL]
    }
    Object.setPrototypeOf(renderer, RenderWebGL.prototype)
    const _getContext = (RenderWebGL as any)._getContext
    // Avoid creating new context.
    ;(RenderWebGL as any)._getContext = function () {
      return _gl
    }
    ;(RenderWebGL as any).call(
      renderer,
      canvas,
      _xLeft,
      _xRight,
      _yBottom,
      _yTop
    )
    ;(RenderWebGL as any)._getContext = _getContext
    // Compatible with PenguinMod -- custom effects
    ;(renderer._shaderManager.constructor as any).EFFECT_INFO = Object.assign(
      {},
      _shaderManager.constructor.EFFECT_INFO,
      (renderer._shaderManager.constructor as any).EFFECT_INFO
    )
    ;(renderer._shaderManager.constructor as any).DRAW_MODE = Object.assign(
      {},
      _shaderManager.constructor.DRAW_MODE,
      (renderer._shaderManager.constructor as any).DRAW_MODE
    )
    ;(renderer._shaderManager.constructor as any).EFFECTS = [
      ...new Set([
        ...(renderer._shaderManager.constructor as any).EFFECTS,
        ..._shaderManager.constructor.EFFECTS
      ]).values()
    ]
    const nativeSize = renderer.getNativeSize()
    ;(vm.runtime as any).stageWidth = nativeSize[0]
    ;(vm.runtime as any).stageHeight = nativeSize[1]
    ;(renderer as any)._events = Object.assign(
      {},
      _events,
      (renderer as any)._events
    )
    // renderer.resize = newRenderer.resize.bind(newRenderer)
    vm.runtime.attachRenderer(renderer)
  }
  // Force old renderer to use WebGL2.
  const _getContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    options?: any
  ) {
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
      return (
        _getContext.call(this, 'webgl2', {
          alpha: false,
          stencil: true,
          antialias: false,
          powerPreference: (RenderWebGL as any).powerPreference
        }) ?? _getContext.call(this, contextId, options)
      )
    }
    return _getContext.call(this, contextId, options)
  } as any
  if (vm.runtime.renderer) {
    HTMLCanvasElement.prototype.getContext = _getContext
    onReady()
  }
  const _attachRenderer = vm.runtime.attachRenderer
  vm.runtime.attachRenderer = function (renderer: RenderWebGL) {
    const originalRenderer = this.renderer
    // vm.runtime.constructor.prototype.attachRenderer = _attachRenderer
    _attachRenderer.call(this, renderer)
    // Xiaomawang attaches renderer twice.
    if (originalRenderer !== renderer && !(renderer instanceof RenderWebGL)) {
      if ((renderer as any).clearAllSkins) {
        // Patch Xiaomawang private APIs
        const { clearAllSkins } = renderer as any
        onReady()
        // clearAllSkins() is used to dispose all skins. This API exists because Xiaomawang's developers have skill issue.
        ;(renderer as any).clearAllSkins = clearAllSkins
        // extractDrawable() is used to extract the drawable (for dragging or something else). It slows down the renderer for a lot, so replace it with a no-op function would be fine.
        ;(renderer as any).extractDrawable = function () {
          return {
            data: '',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            scratchOffset: [0, 0]
          }
        }
        new ResizeObserver(() => {
          renderer.resize(
            renderer.canvas.clientWidth,
            renderer.canvas.clientHeight
          )
          requestAnimationFrame(() => {
            ;(renderer as any).dirty = true
            renderer.draw()
          })
        }).observe(renderer.canvas)
      } else {
        HTMLCanvasElement.prototype.getContext = _getContext
        onReady()
      }
    }
  }
}
