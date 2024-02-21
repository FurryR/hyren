import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'lpp',
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
// @include     https://scratch.mit.edu/projects/*
// @include     https://aerfaying.com/Projects/*
// @include     https://www.ccw.site/*
// @include     https://gitblock.cn/Projects/*
// @include     https://world.xiaomawang.com/*
// @include     https://cocrea.world/*
// @include     https://create.codelab.club/*
// @include     https://www.scratch-cn.cn/*
// @include     https://www.40code.com/*
// @include     https://turbowarp.org/*
// @include     https://codingclip.com/*
// @include     https://editor.turbowarp.cn/*
// @include     https://0832.ink/rc/*
// @include     https://code.xueersi.com/scratch3/*
// @include     https://play.creaticode.com/projects/*
// @include     https://www.adacraft.org/*
// @include     https://studio.penguinmod.com/*
// @include     https://code.xueersi.com/*
// @include     http://localhost:8601/*
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
