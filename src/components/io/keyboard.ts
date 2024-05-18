import Keyboard = require('scratch-vm/src/io/keyboard')

export default function patchKeyboard(vm: VM) {
  // More keys
  vm.runtime.ioDevices.keyboard = new Keyboard(vm.runtime)
}
