export default function extensionPen(packageObject: any) {
  if (!packageObject._penDown)
    packageObject._penDown = function (this: any, target: VM.RenderedTarget) {
      this.penDown({}, { target })
    }
  if (!packageObject._changePenSizeBy)
    packageObject._changePenSizeBy = function (
      this: any,
      size: number,
      target: VM.RenderedTarget
    ) {
      this.changePenSizeBy({ SIZE: size }, { target })
    }
  if (!packageObject._changePenHueBy)
    packageObject._changePenHueBy = function (
      this: any,
      hueChange: number,
      target: VM.RenderedTarget
    ) {
      this.changePenHueBy({ HUE: hueChange }, { target })
    }
  if (!packageObject._changePenShadeBy)
    packageObject._changePenShadeBy = function (
      this: any,
      shade: string,
      target: VM.RenderedTarget
    ) {
      this.changePenShadeBy({ SHADE: shade }, { target })
    }
  if (!packageObject._setPenHueToNumber)
    packageObject._setPenHueToNumber = function (
      this: any,
      hueValue: number,
      target: VM.RenderedTarget
    ) {
      this.setPenHueToNumber({ HUE: hueValue }, { target })
    }
  if (!packageObject._setPenShadeToNumber)
    packageObject._setPenShadeToNumber = function (
      this: any,
      shade: string,
      target: VM.RenderedTarget
    ) {
      this.setPenShadeToNumber({ SHADE: shade }, { target })
    }
  if (!packageObject._setPenColorToColor)
    packageObject._setPenColorToColor = function (
      this: any,
      color: string,
      target: VM.RenderedTarget
    ) {
      this.setPenColorToColor({ COLOR: color }, { target })
    }
  if (!packageObject._setPenSizeTo)
    packageObject._setPenSizeTo = function (
      this: any,
      size: number,
      target: VM.RenderedTarget
    ) {
      this.setPenSizeTo({ SIZE: String(size) }, { target })
    }
  if (!packageObject._stamp)
    packageObject._stamp = function (this: any, target: VM.RenderedTarget) {
      this.stamp({}, { target })
    }
  if (!packageObject._penUp)
    packageObject._penUp = function (this: any, target: VM.RenderedTarget) {
      this.penUp({}, { target })
    }
}
