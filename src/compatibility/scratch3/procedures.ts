export default function scratch3Procedure(packageObject: any) {
  const _argumentReporterStringNumber =
    packageObject.argumentReporterStringNumber
  const _argumentReporterBoolean = packageObject.argumentReporterBoolean
  packageObject.argumentReporterStringNumber = function (
    this: any,
    args: any,
    util: VM.BlockUtility
  ) {
    const value = util.getParam(args.VALUE)
    if (value === null) {
      // tw: support legacy block
      if (String(args.VALUE).toLowerCase() === 'last key pressed') {
        return (util.ioQuery as any)('keyboard', 'getLastKeyPressed')
      }
      // When the parameter is not found in the most recent procedure
      // call, the default is always 0.
      return _argumentReporterStringNumber.call(this, args, util)
    }
    return value
  }
  packageObject.argumentReporterStringNumber = function (
    this: any,
    args: any,
    util: VM.BlockUtility
  ) {
    const value = util.getParam(args.VALUE)
    if (value === null) {
      // tw: support legacy block
      if (String(args.VALUE).toLowerCase() === 'last key pressed') {
        return (util.ioQuery as any)('keyboard', 'getLastKeyPressed')
      }
      // When the parameter is not found in the most recent procedure
      // call, the default is always 0.
      return _argumentReporterStringNumber.call(this, args, util)
    }
    return value
  }
  packageObject.argumentReporterBoolean = function (
    this: any,
    args: any,
    util: VM.BlockUtility
  ) {
    const value = util.getParam(args.VALUE)
    if (value === null) {
      // tw: implement is compiled? and is turbowarp?
      const lowercaseValue = String(args.VALUE).toLowerCase()
      if (
        (util.target.runtime as any).compilerOptions.enabled &&
        lowercaseValue === 'is compiled?'
      ) {
        return true
      }
      if (lowercaseValue === 'is turbowarp?') {
        return true
      }
      // When the parameter is not found in the most recent procedure
      // call, the default is always 0.
      return _argumentReporterBoolean.call(this, args, util)
    }
    return value
  }
}
