export default function scratch3Control(packageObject: any) {
  packageObject._createClone = function (
    this: any,
    cloneOption: string,
    target: VM.RenderedTarget
  ) {
    this.createClone({ CLONE_OPTION: cloneOption }, { target })
  }
}
