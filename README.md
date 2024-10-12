<div align="center">

# [👾 Hyren](https://furryr.github.io/hyren/hyren.release.user.js)

> A tampermonkey script to use Turbowarp features everywhere.
>
> (Hint) Click title to install!

[![Visitors](https://hits.dwyl.com/FurryR/hyren.svg?style=flat-square)](http://github.com/FurryR/hyren)
[![🛠️ Build](https://github.com/FurryR/hyren/actions/workflows/ci.yaml/badge.svg)](https://github.com/FurryR/hyren/actions/workflows/ci.yaml)

[🇺🇸](./README.md) | [🇨🇳](./README-zh_CN.md)

</div align="center">

## 🐱 Features

- ✅ Turbowarp features everywhere.
- ⭐ Always keep updated with Turbowarp.
- 🤖 Requires no extra configuration.
- 🛠️ Perfect compatibility with [`Eureka`](https://github.com/EurekaScratch/eureka-loader).

## 🔥 Supported platforms

- [x] Scratch
- [x] Codingclip
- [x] Aerfaying (阿儿法营)
- [x] Xiaomawang (小码王)
- [x] CodeLab
- [x] Xueersi (学而思)
- [x] Creaticode

❓ These platforms do have native compiler, so we are not willing to support them.

- [x] Cocrea
- [x] Co-Create World (共创世界)
- [x] Adacraft
- [x] 40code
- [x] Turbowarp
- [x] PenguinMod

## 🛠️ Compatibility

> If an error is occurred, it is Hyren's bug. If the error still presists after disabling Hyren, it is Turbowarp's bug. -- @garbomuffin

Usually you can use hyren to boost most projects, but there are always some exceptions.

1. When using Gandi IDE, I randomly get some error but the project works fine.
   > Just ignore these errors, your project is running fine. Hyren will fallback to interpreter when compilation fails, so it may affect performance.
2. I use Microsoft Edge. I used hyren but it didn't boost a lot.
   > Turn off Edge's "Enhanced security mode". It disables the browser's JIT so it is extremely slow.
3. Other errors.
   > Well, hyren is just an experimental project. Disable hyren may work, but you can't enjoy compiler anymore.

## 🤔 How to use

1. 🔽 Click hyren title or [here](https://furryr.github.io/hyren/hyren.release.user.js) to install the extension. You must have `Tampermonkey` / `ViolentMonkey` installed in your browser.

2. 🎉 Done!

**⚠️ WARNING:** make sure you have read [**Compatibility**](#🛠️-compatibility) section before you installed.

## 📄 Documentation

- `Hyren.compiler(flag?: boolean)`  
  Enable/Disable compiler. If flag is not specified, returns current status. Defaults to `true`.
- `Hyren.compiler.warp(flag?: boolean)`  
  Enable/Disable compiler warp timer. If flag is not specified, returns current status. If you are using editor, it is set to `true`, otherwise it is set to `false` at first.
- `Hyren.interpolation(flag?: boolean)`  
  Enable/Disable interpolation. If flag is not specified, returns current status. Defaults to `false`.
- `Hyren.hires(flag?: boolean)`  
  Enable/Disable high quality renderer (aka `HQPen` or `High quality pen`). If flag is not specified, returns current status. Defaults to `false`.
- `Hyren.fps(num?: number)`  
  Set framerate to `num`. The allowed framerate range is `[0,250]`. `0` is a special value which means **"matching device screen refresh rate"**. If num is not specified, returns current specified framerate. Defaults to `30`.
- `Hyren.maxClones(num?: number)`  
  Set max clone limit to `num`. If num is not specified, returns current specified limit. Defaults to `300`.
- `Hyren.fencing(flag?: boolean)`  
  Enable/Disable fencing check. If flag is not specified, returns current status. Defaults to `true`.
- `Hyren.miscLimit(flag?: boolean)`  
  Enable/Disable miscellaneous limits presented by original Scratch. If flag is not specified, returns current status. Defaults to `true`.
- `Hyren.size(width?: number, height?: number)`  
  Set stage size. If both width and height are not specified, returns current status. Otherwise, set stage width/height while keeping the unspecified one.
- `Hyren.save()`  
  Save settings to the project. Compatible with Turbowarp.

## ⚡ Performance

⚡ Benchmark using: https://scratch.mit.edu/projects/441947766/

Testing on: 12th Gen Intel(R) Core(TM) i7-12700F + Nvidia RTX 4060 (32 GiB RAM, 8 GiB VRAM), Edge 129.0.2792.89

| Platform  | Computation | Data | Pen  | Overall |
| --------- | ----------- | ---- | ---- | ------- |
| Turbowarp | 28087       | 4369 | 2229 | 7026    |
| Scratch   | 27091       | 4255 | 446  | 3621    |
| ClipCC    | 27690       | 4323 | 448  | 3668    |

Note: The injected renderer is very slow due to some issues.
