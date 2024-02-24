export default function scratch3Motion(packageObject: any) {
  if (!packageObject._moveSteps)
    packageObject._moveSteps = function (
      this: any,
      steps: number,
      target: VM.RenderedTarget
    ) {
      this.moveSteps({ STEPS: steps }, { target })
    }
  if (!packageObject._ifOnEdgeBounce)
    packageObject._ifOnEdgeBounce = function (
      this: any,
      target: VM.RenderedTarget
    ) {
      this.ifOnEdgeBounce({}, { target })
    }
}
