import MathUtil = require('../../../scratch-vm/src/util/math-util')

export default function scratch3Looks(packageObject: any) {
  if (!packageObject.clampEffect)
    packageObject.clampEffect = function (
      this: any,
      effect: string,
      value: number
    ) {
      let clampedValue = value
      switch (effect) {
        case 'ghost':
          clampedValue = MathUtil.clamp(value, 0, 100)
          break
        case 'brightness':
          clampedValue = MathUtil.clamp(value, -100, 100)
          break
      }
      return clampedValue
    }
}
