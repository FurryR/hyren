import { defineConfig } from 'tsup'
import { version } from './package.json'

export default defineConfig({
  name: 'hyren',
  target: ['esnext'],
  outDir: 'dist',
  banner: {
    js: `// ==UserScript==
// @name              Hyren
// @name:zh-cn        Hyren
// @description       Use Turbowarp features anywhere.
// @description:zh-cn 在任何地方使用 Turbowarp 特性。
// @version           ${version}
// @author            FurryR
// @copyright         2024, FurryR (https://github.com/FurryR)
// @license           AGPL-3.0
// @match             https://scratch.mit.edu/projects/*
// @match             https://aerfaying.com/Projects/*
// @match             https://gitblock.cn/Projects/*
// @match             https://world.xiaomawang.com/*
// @match             https://create.codelab.club/*
// @match             https://www.scratch-cn.cn/*
// @match             https://codingclip.com/*
// @match             https://play.creaticode.com/projects/*
// @match             https://code.xueersi.com/*
// @grant             none
// @namespace         Hyren
// @run-at            document-start
// @source            https://github.com/FurryR/hyren
// @downloadURL       https://furryr.github.io/hyren/hyren.release.user.js
// @updateURL         https://furryr.github.io/hyren/hyren.release.user.js
// ==/UserScript==
`
  },
  platform: 'browser',
  clean: true
})
