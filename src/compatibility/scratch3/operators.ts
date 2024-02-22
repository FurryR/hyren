export default function scratch3Operators(packageObject: any) {
  packageObject._random = function (
    this: any,
    from: number,
    to: number
  ) {
    return this.random({ FROM: from, TO: to })
  }
}
