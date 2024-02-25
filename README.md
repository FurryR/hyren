<div align="center">

# 👾 Hyren

> A tampermonkey script to use Turbowarp compiler anywhere.

[![Visitors](https://hits.dwyl.com/FurryR/hyren.svg?style=flat-square)](http://github.com/FurryR/hyren)
[![🛠️ Build](https://github.com/FurryR/hyren/actions/workflows/ci.yaml/badge.svg)](https://github.com/FurryR/hyren/actions/workflows/ci.yaml)

</div align="center">

## 🐱 Features

- ✅ Turbowarp compiler anywhere.
- ⭐ Always keep updated with Turbowarp compiler.
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

❓ Although these platforms do have native compiler, we still support them but it may lead to some problems.

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

1. 🔽 Download hyren daily build from [`Github Actions`](https://github.com/FurryR/hyren/actions/workflows/ci.yaml) (**requires login**). Please always download latest commit. You can download either `hyren-debug` or `hyren-release`. Decompress the artifact into a folder.

2. 🐺 Open the artifact in browser and your `Tampermonkey` / `ViolentMonkey` will automatically detect it as an userscript. Click `Install`.

3. 🎉 Done!

**⚠️ WARNING:** make sure you have read [**Compatibility**](#🛠️-compatibility) section before you installed.

## ⚡ Performance

⚡ Benchmark using: https://scratch.mit.edu/projects/441947766/

Testing on: 12th Gen Intel(R) Core(TM) i7-12700F + Nvidia RTX 4060 (32 GiB RAM, 8 GiB VRAM)

| Platform  | Computation | Data | Pen  | Overall |
| --------- | ----------- | ---- | ---- | ------- |
| Turbowarp | 27929       | 4120 | 1711 | 6234    |
| Scratch   | 28592       | 4054 | 411  | 3544    |
| ClipCC    | 27929       | 4094 | 447  | 3640    |

Tips: Hyren does not provide renderer optimizations.
