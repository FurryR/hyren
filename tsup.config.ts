import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'hyren',
  entry: ['src/index.ts'],
  target: ['esnext'],
  format: ['iife'],
  outDir: 'dist',
  banner: {
    js: `// ==UserScript==
// @name        Hyren
// @description Run compiler anywhere.
// @version     1
// @author      FurryR
// @match       https://scratch.mit.edu/projects/*
// @match       https://aerfaying.com/Projects/*
// @match       https://www.ccw.site/*
// @match       https://gitblock.cn/Projects/*
// @match       https://world.xiaomawang.com/*
// @match       https://cocrea.world/*
// @match       https://create.codelab.club/*
// @match       https://www.scratch-cn.cn/*
// @match       https://www.40code.com/*
// @match       https://turbowarp.org/*
// @match       https://codingclip.com/*
// @match       https://editor.turbowarp.cn/*
// @match       https://0832.ink/rc/*
// @match       https://code.xueersi.com/scratch3/*
// @match       https://play.creaticode.com/projects/*
// @match       https://www.adacraft.org/*
// @match       https://studio.penguinmod.com/*
// @match       https://code.xueersi.com/*
// @grant       none
// @license     MIT
// @namespace   hyren
// @run-at      document-start
// @source      https://github.com/FurryR/hyren
// ==/UserScript==
`
  },
  platform: 'browser',
  clean: true
})
