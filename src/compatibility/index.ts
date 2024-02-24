import scratch3Control from './scratch3/control'
import scratch3Looks from './scratch3/looks'
import scratch3Operators from './scratch3/operators'
import scratch3Motion from './scratch3/motion'
import extensionPen from './extension/pen'
export default {
  scratch3_control: scratch3Control,
  scratch3_looks: scratch3Looks,
  scratch3_motion: scratch3Motion,
  scratch3_operators: scratch3Operators,
  pen: extensionPen
} as Record<string, (extensionObject: any) => void>