import patchMouse from './mouse'

export default function patchIO(vm: VM) {
  patchMouse(vm)
}
