import patchMouse from './mouse'
import patchKeyboard from './keyboard'

export default function patchIO(vm: VM) {
  patchMouse(vm)
  patchKeyboard(vm)
}
