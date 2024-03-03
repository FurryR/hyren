const l10n: Record<string, Record<string, string>> = {
  en: {
    'hyren.aboutme':
      'Copyright (c) 2024 FurryR. Visit my profile at https://github.com/FurryR',
    'hyren.abouttw':
      'Hyren is based on Turbowarp. Check https://turbowarp.org/editor for more details.',
    'hyren.ghrepo':
      'GitHub Repository: https://github.com/FurryR/hyren. Hyren is licensed under the AGPL-3.0 license.',
    'hyren.help':
      'You can use global object `Hyren` to adjust Hyren settings. For more information, please check https://github.com/FurryR/hyren/blob/main/README.md#-documentation.',
    'hyren.compiler.enabled': 'The compiler is enabled.',
    'hyren.compiler.disabled': 'The compiler is disabled.',
    'hyren.warp.enabled':
      'The warp timer is enabled. (⚠️ Performance might be affected)',
    'hyren.warp.disabled': 'The warp timer is disabled.',
    'hyren.hires.enabled':
      'High resolution (HQPen) optimization is enabled. (⚠️ Performance might be affected)',
    'hyren.hires.disabled': 'High resolution (HQPen) optimization is disabled.',
    'hyren.interpolation.enabled': 'Interpolation is enabled.',
    'hyren.interpolation.disabled': 'Interpolation is disabled.',
    'hyren.fps': 'The framerate is set to %o.',
    'hyren.fps.sync':
      'The framerate is set to matching device screen refresh rate.',
    'hyren.size': 'The stage size is set to %ox%2o.',
    'hyren.maxClones': 'The max clone count is set to %o.',
    'hyren.maxClones.default': 'The max clone count is set to %o by default.',
    'hyren.miscLimits.enabled': 'The miscellaneous limits are enabled.',
    'hyren.miscLimits.disabled': 'The miscellaneous limits are disabled.',
    'hyren.fencing.enabled': 'Sprite fencing check is enabled.',
    'hyren.fencing.disabled': 'Sprite fencing check is disabled.',
    'hyren.save': 'Options are saved into project.'
  },
  ja: {
    'hyren.aboutme':
      'Copyright (c) 2024 FurryR. https://github.com/FurryR は私のプロファイルです。',
    'hyren.abouttw':
      'Hyren は Turbowarp をもとにして作られたのです。詳しくは https://turbowarp.org/editor をご覧ください。',
    'hyren.ghrepo':
      'GitHub レポジトリー: https://github.com/FurryR/hyren。Hyren は AGPL-3.0 でライセンスされています。',
    'hyren.help':
      'グローバルオブジェクト `Hyren` で Hyren の色々な設定を調整できます。詳しくは https://github.com/FurryR/hyren/blob/main/README.md#-documentation をご覧ください。',
    'hyren.compiler.enabled': 'コンパイラーが有効になりました。',
    'hyren.compiler.disabled': 'コンパイラーが無効になりました。',
    'hyren.warp.enabled':
      'Warp タイマーが有効になりました。(⚠️ パフォーマンスに影響する可能性があります)',
    'hyren.warp.disabled': 'Warp タイマーが無効になりました。',
    'hyren.hires.enabled':
      '高解像度（ペンできれいに描画する）の最適化が有効になりました。(⚠️ パフォーマンスに影響する可能性があります)',
    'hyren.hires.disabled':
      '高解像度（ペンできれいに描画する）の最適化が無効になりました。',
    'hyren.interpolation.enabled': '補完機能が有効になりました。',
    'hyren.interpolation.disabled': '補完機能が無効になりました。',
    'hyren.fps': 'フレームレートが %o に設定されました。',
    'hyren.fps.sync':
      'フレームレートがお使いのデバイスのリフレッシュレートに設定されました。',
    'hyren.size': 'ステージの大きさが %ox%2o に設定されました。',
    'hyren.maxClones': '最大クローン制限が %o に設定されました。',
    'hyren.maxClones.default':
      '最大クローン制限がデフォルトの %o に設定されました。',
    'hyren.miscLimits.enabled': 'その他の制限が有効になりました。',
    'hyren.miscLimits.disabled': 'その他の制限が無効になりました。',
    'hyren.fencing.enabled': '動く範囲と大きさの制限が有効になりました。',
    'hyren.fencing.disabled': '動く範囲と大きさの制限が無効になりました。',
    'hyren.save': '設定がプロジェクトに保存されました。'
  },
  'zh-cn': {
    'hyren.aboutme':
      '版权所有 (c) 2024 FurryR。我的个人主页是 https://github.com/FurryR 。',
    'hyren.abouttw':
      'Hyren 基于 Turbowarp。请访问 https://turbowarp.org/editor 以获得更多信息。',
    'hyren.ghrepo':
      'GitHub 仓库: https://github.com/FurryR/hyren。Hyren 以 AGPL-3.0 开源协议授权。',
    'hyren.help':
      '您可以使用全局对象 `Hyren` 来调整 Hyren 的各种设定。欲知更多，请访问 https://github.com/FurryR/hyren/blob/main/README_zh-CN.md#-文档 。',
    'hyren.compiler.enabled': '已启用编译器。',
    'hyren.compiler.disabled': '已禁用编译器。',
    'hyren.warp.enabled': '已启用循环计时器。(⚠️ 可能会影响性能)',
    'hyren.warp.disabled': '已禁用循环计时器。',
    'hyren.hires.enabled':
      '已启用高清渲染（高清画笔）优化。(⚠️ 可能会影响性能)',
    'hyren.hires.disabled': '已禁用高清渲染（高清画笔）优化。',
    'hyren.interpolation.enabled': '已启用补帧。',
    'hyren.interpolation.disabled': '已禁用补帧。',
    'hyren.fps': '帧率已被设置为 %o。',
    'hyren.fps.sync': '帧率已被设置为和设备屏幕刷新率同步。',
    'hyren.size': '舞台大小已被设置为 %ox%2o。',
    'hyren.maxClones': '最大克隆体数已被设置为 %o。',
    'hyren.maxClones.default': '最大克隆体数已被设置为默认的 %o。',
    'hyren.miscLimits.enabled': '已启用其它限制。',
    'hyren.miscLimits.disabled': '已禁用其它限制。',
    'hyren.fencing.enabled': '已启用角色边缘检测。',
    'hyren.fencing.disabled': '已禁用角色边缘检测。',
    'hyren.save': '已在作品中保存设置。'
  }
}
export let locale = {
  value: 'en'
}
export const formatMessage = (id: string) => {
  return l10n[locale.value]?.[id] ?? l10n['en']?.[id] ?? id
}
