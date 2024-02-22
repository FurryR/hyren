export default function extensionPen(packageObject: any) {
  packageObject._setPenColorToColor = function (
    this: any,
    color: string,
    target: VM.RenderedTarget
  ) {
    this.setPenColorToColor({ COLOR: color }, { target })
  }
  packageObject._setPenSizeTo = function (
    this: any,
    size: number,
    target: VM.RenderedTarget
  ) {
    this.setPenSizeTo({ SIZE: String(size) }, { target })
  }
  packageObject._penDown = function (
    this: any,
    target: VM.RenderedTarget
  ) {
    this.penDown({}, { target })
  }
  packageObject._penUp = function (
    this: any,
    target: VM.RenderedTarget
  ) {
    this.penUp({}, { target })
  }
  packageObject._stamp = function (
    this: any,
    target: VM.RenderedTarget
  ) {
    this.stamp({}, { target })
  }
}
