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
// @match             https://www.ccw.site/*
// @match             https://gitblock.cn/Projects/*
// @match             https://world.xiaomawang.com/*
// @match             https://cocrea.world/*
// @match             https://create.codelab.club/*
// @match             https://www.scratch-cn.cn/*
// @match             https://www.40code.com/*
// @match             https://turbowarp.org/*
// @match             https://codingclip.com/*
// @match             https://editor.turbowarp.cn/*
// @match             https://0832.ink/rc/*
// @match             https://code.xueersi.com/scratch3/*
// @match             https://play.creaticode.com/projects/*
// @match             https://www.adacraft.org/*
// @match             https://studio.penguinmod.com/*
// @match             https://code.xueersi.com/*
// @grant             none
// @namespace         hyren
// @run-at            document-start
// @source            https://github.com/FurryR/hyren
// ==/UserScript==
`
  },
  platform: 'browser',
  clean: true
})
