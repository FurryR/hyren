import MathUtil = require('scratch-vm/src/util/math-util')

export default function patchTarget(vm: VM) {
  function onReady(target: VM.Target) {
    const Target = target.constructor
    ;(vm as any).exports.Sprite = target.sprite.constructor
    ;(vm as any).exports.RenderedTarget = Target
    Target.prototype.emitVisualChange = function () {
      if (this.onTargetVisualChange) {
        this.onTargetVisualChange(this)
      } else {
        this.emit((Target as any).EVENT_TARGET_VISUAL_CHANGE, this)
      }
    }
    Target.prototype.setSize = function (size: number) {
      // used by compiler
      if (this.isStage) {
        return
      }
      if (this.renderer) {
        // Clamp to scales relative to costume and stage size.
        // See original ScratchSprite.as:setSize.
        const costumeSize = this.renderer.getCurrentSkinSize(this.drawableID)
        const origW = costumeSize[0]
        const origH = costumeSize[1]
        const fencing = this.runtime.runtimeOptions.fencing
        const minScale = fencing
          ? Math.min(1, Math.max(5 / origW, 5 / origH))
          : 0
        const maxScale = fencing
          ? Math.min(
              (1.5 * this.runtime.stageWidth) / origW,
              (1.5 * this.runtime.stageHeight) / origH
            )
          : Infinity
        this.size = MathUtil.clamp(size / 100, minScale, maxScale) * 100
        const { direction, scale } = this._getRenderedDirectionAndScale()
        this.renderer.updateDrawableDirectionScale(
          this.drawableID,
          direction,
          scale
        )
        if (this.visible) {
          this.emitVisualChange()
          this.runtime.requestRedraw()
        }
      } else {
        // tw: setSize should update size even without a renderer
        // needed by tw-change-size-does-not-use-rounded-size.sb3 test
        this.size = size
      }
      this.runtime.requestTargetsUpdate(this)
    }
    Target.prototype.setXY = function (x: number, y: number, force: boolean) {
      // used by compiler
      if (this.isStage) return
      if (this.dragging && !force) return
      const oldX = this.x
      const oldY = this.y
      if (this.renderer) {
        const position = this.runtime.runtimeOptions.fencing
          ? this.renderer.getFencedPositionOfDrawable(this.drawableID, [x, y])
          : [x, y]
        this.x = position[0]
        this.y = position[1]
        this.renderer.updateDrawablePosition(this.drawableID, position)
        if (this.visible) {
          this.emitVisualChange()
          this.runtime.requestRedraw()
        }
      } else {
        this.x = x
        this.y = y
      }
      if (this.onTargetMoved) {
        this.onTargetMoved(this, oldX, oldY, force)
      } else
        this.emit((Target as any).EVENT_TARGET_MOVED, this, oldX, oldY, force)
      this.runtime.requestTargetsUpdate(this)
    }
  }
  const stage = vm.runtime.getTargetForStage()
  if (stage) {
    onReady(stage)
  } else {
    const _addTarget = vm.runtime.constructor.prototype.addTarget
    vm.runtime.constructor.prototype.addTarget = function (
      target: VM.RenderedTarget
    ) {
      vm.runtime.constructor.prototype.addTarget = _addTarget
      onReady(target)
      _addTarget.call(this, target)
    }
  }
}
