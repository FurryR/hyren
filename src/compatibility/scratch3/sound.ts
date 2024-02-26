import MathUtil = require('scratch-vm/src/util/math-util')
import Cast = require('scratch-vm/src/util/cast')

export default function scratch3Sound(packageObject: any) {
  const Scratch3SoundBlocks = packageObject.constructor
  Scratch3SoundBlocks.prototype._updateEffect = function (
    args: any,
    util: any,
    change: any
  ): void | Promise<void> {
    const effect = Cast.toString(args.EFFECT).toLowerCase()
    const value = Cast.toNumber(args.VALUE)

    const soundState = this._getSoundState(util.target)
    if (!Object.prototype.hasOwnProperty.call(soundState.effects, effect))
      return

    if (change) {
      soundState.effects[effect] += value
    } else {
      soundState.effects[effect] = value
    }

    const miscLimits = this.runtime.runtimeOptions.miscLimits
    const { min, max } = miscLimits
      ? Scratch3SoundBlocks.EFFECT_RANGE[effect]
      : Scratch3SoundBlocks.LARGER_EFFECT_RANGE[effect]
    soundState.effects[effect] = MathUtil.clamp(
      soundState.effects[effect],
      min,
      max
    )

    this._syncEffectsForTarget(util.target)
    if (miscLimits) {
      // Yield until the next tick.
      return Promise.resolve()
    }

    // Requesting a redraw makes sure that "forever: change pitch by 1" still work but without
    // yielding unnecessarily in other cases
    this.runtime.requestRedraw()
  }
}
