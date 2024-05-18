const roundToThreeDecimals = (number: number) =>
  Math.round(number * 1000) / 1000

export default function patchMouse(vm: VM) {
  const Mouse = vm.runtime.ioDevices.mouse.constructor
  /**
   * Get the X position of the mouse in scratch coordinates.
   * @return {number} Clamped and integer rounded X position of the mouse cursor.
   */
  Mouse.prototype.getScratchX = function (): number {
    if (this.runtime.runtimeOptions.miscLimits) {
      return Math.round(this._scratchX)
    }
    return roundToThreeDecimals(this._scratchX)
  }

  /**
   * Get the Y position of the mouse in scratch coordinates.
   * @return {number} Clamped and integer rounded Y position of the mouse cursor.
   */
  Mouse.prototype.getScratchY = function (): number {
    if (this.runtime.runtimeOptions.miscLimits) {
      return Math.round(this._scratchY)
    }
    return roundToThreeDecimals(this._scratchY)
  }
}
