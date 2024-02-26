export default function extensionMusic(packageObject: any) {
  const Scratch3MusicBlocks = packageObject.constructor
  const _isConcurrencyLimited =
    Scratch3MusicBlocks.prototype._isConcurrencyLimited
  Scratch3MusicBlocks.prototype._isConcurrencyLimited = function (
    requestedSize: number
  ) {
    return (
      this.runtime.runtimeOptions.miscLimits &&
      _isConcurrencyLimited.call(requestedSize)
    )
  }
}
