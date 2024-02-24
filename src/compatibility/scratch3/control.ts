export default function scratch3Control(packageObject: any) {
  if (!packageObject._counter) packageObject._counter = 0
  if (!packageObject._createClone)
    packageObject._createClone = function (
      this: any,
      cloneOption: string,
      target: VM.RenderedTarget
    ) {
      this.createClone({ CLONE_OPTION: cloneOption }, { target })
    }
}
