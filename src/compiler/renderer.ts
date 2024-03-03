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
    const _attachRenderer = vm.runtime.constructor.prototype.attachRenderer
    vm.runtime.constructor.prototype.attachRenderer = function (
      renderer: RenderWebGL
    ) {
      _attachRenderer.call(this, renderer)
      this.renderer.offscreenTouching = !this.runtimeOptions.fencing
    }
    vm.runtime.constructor.prototype._renderInterpolatedPositions =
      function () {
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
    /**
     * Set whether we are in 30 TPS compatibility mode.
     * @param {boolean} compatibilityModeOn True iff in compatibility mode.
     */
    vm.runtime.constructor.prototype.setCompatibilityMode = function (
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
    vm.runtime.constructor.prototype.setFramerate = function (
      framerate: number
    ) {
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
    vm.runtime.constructor.prototype.setInterpolation = function (
      interpolationEnabled: boolean
    ) {
      this.interpolationEnabled = interpolationEnabled
      this.frameLoop.setInterpolation(this.interpolationEnabled)
      this.emit(
        (vm.runtime.constructor as any).INTERPOLATION_CHANGED,
        interpolationEnabled
      )
    }
    vm.runtime.constructor.prototype._step = function (this: any) {
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
    vm.runtime.constructor.prototype.start = function () {
      // Do not start if we are already running
      if (this.frameLoop.running) return
      this.frameLoop.start()
      this.emit((vm.runtime.constructor as any).RUNTIME_STARTED)
    }
    vm.runtime.constructor.prototype.setStageSize = function (
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
      // you won gandi, i will keep your shader manager.
      return
    }
    const newRenderer: RenderWebGL = new (RenderWebGL as any)(
      renderer.canvas,
      renderer._xLeft,
      renderer._xRight,
      renderer._yBottom,
      renderer._yTop
    )
    const nativeSize = newRenderer.getNativeSize()
    ;(vm.runtime as any).stageWidth = nativeSize[0]
    ;(vm.runtime as any).stageHeight = nativeSize[1]
    ;(newRenderer as any)._events = Object.assign(
      {},
      (renderer as any)._events,
      (newRenderer as any)._events
    )
    renderer.resize = newRenderer.resize.bind(newRenderer)
    vm.runtime.attachRenderer(newRenderer)
  }
  if (vm.runtime.renderer) {
    onReady()
  } else {
    const _attachRenderer = vm.runtime.constructor.prototype.attachRenderer
    vm.runtime.constructor.prototype.attachRenderer = function (
      renderer: RenderWebGL
    ) {
      vm.runtime.constructor.prototype.attachRenderer = _attachRenderer
      _attachRenderer.call(this, renderer)
      onReady()
    }
  }
}
