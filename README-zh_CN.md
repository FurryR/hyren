<div align="center">

# 👾 Hyren

> 在任何地方使用 Turbowarp 特性。

[![Visitors](https://hits.dwyl.com/FurryR/hyren.svg?style=flat-square)](http://github.com/FurryR/hyren)
[![🛠️ Build](https://github.com/FurryR/hyren/actions/workflows/ci.yaml/badge.svg)](https://github.com/FurryR/hyren/actions/workflows/ci.yaml)

[🇺🇸](./README.md) | [🇨🇳](./README-zh_CN.md)

</div align="center">

## 🐱 功能

- ✅ 在任何地方使用 Turbowarp 特性。
- ⭐ 永远和 Turbowarp 保持更新。
- 🤖 无需任何额外配置。
- 🛠️ 和 [`Eureka`](https://github.com/EurekaScratch/eureka-loader) 有着完美的兼容性。

## 🔥 支持的平台

- [x] Scratch
- [x] Codingclip
- [x] Aerfaying (阿儿法营)
- [x] Xiaomawang (小码王)
- [x] CodeLab
- [x] Xueersi (学而思)
- [x] Creaticode

❓ 虽然这些平台有自己的原生编译器，我们仍然支持它们但这可能导致一些问题。

- [x] Cocrea
- [x] Co-Create World (共创世界)
- [x] Adacraft
- [x] 40code
- [x] Turbowarp
- [x] PenguinMod

## 🛠️ 兼容性

> 如果出了个 bug，它是 Hyren 导致的。如果关了 Hyren 还有这个 bug，那它就是 Turbowarp 导致的。 -- @garbomuffin，Turbowarp 主要开发者

通常你可以使用 Hyren 来加速大多数作品，但凡事都有例外。

1. 在用 Gandi IDE 时，我看到一些随机的错误但作品跑得好好的。
   > 请无视这些错误，你的作品一切正常。Hyren 将在编译失败时自动转为使用解释，所以它可能会影响性能。
2. 我在用 Microsoft Edge。我用了 Hyren 但是我不感觉快了多少。
   > 请关闭 Edge 的增强安全性保护。这玩意会禁用浏览器的 JIT 所以特别慢。
3. 其它错误。
   > 好吧，Hyren 只是一个实验性的项目。虽然禁用 Hyren 可能有效，但你就不能再享受编译器了。

## 🤔 如何使用

1. 🔽 从 [`Github Actions`](https://github.com/FurryR/hyren/actions/workflows/ci.yaml) 下载 Hyren 的每日构建 (**需要登录**)。请永远下载最后一个提交的构建。你可以下载 `hyren-debug` 或者 `hyren-release` 二者之一。解压构建产物（就是刚刚下载的）到一个文件夹里。

2. 🐺 在浏览器中打开构建产物（就是压缩包里面的内容），你的 `Tampermonkey` / `ViolentMonkey` 将会自动检测它为一个用户脚本。点击 `安装`。

3. 🎉 完成！

**⚠️ 警告：** 在安装前请确保你已经读了 [**兼容性**](#🛠️-兼容性) 这一段。

## 📄 文档

- `Hyren.compiler(flag?: boolean)`  
  启用/禁用编译器。如果 flag 未被指定，返回当前的状态。默认为 `true`。
- `Hyren.compiler.warp(flag?: boolean)`  
  启用/禁用编译器的循环检测器。如果 flag 未被指定，返回当前的状态。如果你在使用编辑器，它将默认设定为 `true`，否则它将设定为 `false`。
- `Hyren.interpolation(flag?: boolean)`  
  启用/禁用补帧。如果 flag 未被指定，返回当前的状态。默认为 `false`。
- `Hyren.hires(flag?: boolean)`  
  启用/禁用高质量渲染器 (又称 `HQPen` 或高清画笔). 如果 flag 未被指定，返回当前的状态。默认为 `false`。
- `Hyren.fps(num?: number)`  
  设置帧率为 `num`。允许的帧率区间为 `[0,250]`。`0` 是一个特殊值，意味着帧率将匹配设备刷新率。如果 num 未被指定，返回当前的帧率。默认为 `30`.
- `Hyren.maxClones(num?: number)`  
  设置最大克隆体限制为 `num`。如果 num 未被指定，返回当前的最大限制。默认为 `300`.
- `Hyren.fencing(flag?: boolean)`  
  启用/禁用角色边缘检测。如果 flag 未被指定，返回当前的状态。默认为 `true`。
- `Hyren.miscLimit(flag?: boolean)`  
  启用/禁用原版 Scratch 的其它限制。如果 flag 未被指定，返回当前的状态。默认为 `true`。
- `Hyren.size(width?: number, height?: number)`  
  设置舞台大小。如果 width 和 height 都未被指定，返回当前状态。否则，将设置舞台的宽/高并对未指定的那部分保持原来的值。
- `Hyren.save()`  
  保存设置到项目。兼容 Turbowarp。

## ⚡ 性能

⚡ 性能测试使用的作品：https://scratch.mit.edu/projects/441947766/

设备：12th Gen Intel(R) Core(TM) i7-12700F + Nvidia RTX 4060 (32 GiB RAM, 8 GiB VRAM)

| 设备      | 计算性能 | 数据处理性能 | 画笔性能 | 总分 |
| --------- | -------- | ------------ | -------- | ---- |
| Turbowarp | 27929    | 4120         | 1711     | 6234 |
| Scratch   | 28592    | 4054         | 411      | 3544 |
| ClipCC    | 27929    | 4094         | 447      | 3640 |

~~提示：Hyren 不提供渲染器优化。~~

注意：这段的内容已经过时了。我的显卡寄了，有人吗帮忙测试一下子
