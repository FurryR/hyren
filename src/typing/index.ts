export interface ExtendedRuntime extends VM.Runtime {
  compilerOptions?: {
    enabled?: boolean
    warpTimer?: boolean
  }
  _registerBlockPackages(): void
}
export interface ExtendedThread extends VM.Thread {
  tryCompile(): void
  triedToCompile?: boolean
  isCompiled?: boolean
}
export interface ExtendedThreadConstructor {
  new (warpMode: boolean): ExtendedThread
  prototype: {
    tryCompile?(): void
    getId?(): string
  }
}
export interface ExtendedBlockContainerConstructor {
  new (runtime: VM.Runtime, optNoGlow?: boolean): VM.Blocks
  prototype: {
    getProcedureDefinition?(name: string): string | null
    _getCustomBlockInternal?(defineBlock: object): object
    populateProcedureCache?(): void
    getCachedCompileResult?(blockId: string): any
    cacheCompileResult?(blockId: string, value: any): void
    cacheCompileError?(blockId: string, error: any): void
  }
}
