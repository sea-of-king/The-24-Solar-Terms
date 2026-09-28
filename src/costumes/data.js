function getCostumeManifestEntry(presetId) {
  if (typeof window === "undefined") return null;
  return window.CostumeModelManifest?.byId?.[presetId] ?? null;
}

function resolveRuntimeAssetPath(assetPath) {
  if (typeof assetPath !== "string" || !assetPath) return assetPath;
  if (!assetPath.startsWith("/")) return assetPath;
  if (typeof window === "undefined") return assetPath;

  const normalizedPath = assetPath.replace(/^\//, "");
  const basePrefix = window.location.pathname.includes("/pages/") ? "../" : "./";
  const resolvedPath = basePrefix + normalizedPath;
  return window.SiteAssetVersion?.append ? window.SiteAssetVersion.append(resolvedPath) : resolvedPath;
}

const rawViewPresets = [
  {
    id: "lichun-brocade",
    navTitle: "立春锦裳",
    navSubtitle: "立春 / 雨水 / 惊蛰",
    posterImage: "/assets/images/costumes/lichun-brocade.svg",
    badge: "代表服装",
    headline: "立春锦裳",
    lead: "春气初生，衣褶轻展，如新柳拂晨。",
    concept:
      "以柔线写萌动，让初春的苏醒落在肩袖之间。",
    highlights: [
      "衣势轻扬",
      "纹样含新绿",
      "转看更见春醒"
    ],
    palette: "柳绿、米白与微金相映，清润而含光。",
    camera: {
      azimuth: 0.48,
      elevation: 0.2,
      distanceMultiplier: 1.52,
      targetY: 0.42,
      fov: 28
    }
  },
  {
    id: "chunfen-breeze",
    navTitle: "春分轻岚",
    navSubtitle: "春分",
    posterImage: "/assets/images/costumes/chunfen-breeze.svg",
    badge: "代表服装",
    headline: "春分轻岚",
    lead: "风意停在肩领之间，轻匀如昼夜。",
    concept:
      "取花枝与纸鸢之势，写一段平和春声。",
    highlights: [
      "领肩线条清雅",
      "近看纹样更细",
      "白衣含光不炫"
    ],
    palette: "海棠粉与淡青绿相和，轻盈而匀净。",
    camera: {
      azimuth: 0.22,
      elevation: 0.16,
      distanceMultiplier: 1.02,
      targetY: 0.6,
      fov: 24
    }
  },
  {
    id: "qingming-mist",
    navTitle: "清明烟岚",
    navSubtitle: "清明 / 谷雨",
    posterImage: "/assets/images/costumes/qingming-mist.svg",
    badge: "当前主展",
    headline: "清明烟岚",
    lead: "烟雨在衣间流转，清润自成一章。",
    concept:
      "以薄纱宽袖写清明明净，亦留谷雨丰意。",
    highlights: [
      "袖摆层次舒展",
      "色韵清而不冷",
      "最宜静观全貌"
    ],
    palette: "雾白、柳青与淡金相叠，温柔如雨后天光。",
    camera: {
      azimuth: 0.48,
      elevation: 0.2,
      distanceMultiplier: 1.52,
      targetY: 0.42,
      fov: 28
    }
  },
  {
    id: "lixia-radiance",
    navTitle: "立夏映辉",
    navSubtitle: "立夏 / 小满",
    posterImage: "/assets/images/costumes/lixia-radiance.svg",
    badge: "代表服装",
    headline: "立夏映辉",
    lead: "夏意初明，纱影舒朗，风从衣边过。",
    concept:
      "以轻层与阔摆写初夏，将明朗藏于从容。",
    highlights: [
      "轮廓开阔",
      "侧观更见体势",
      "衣摆起落分明"
    ],
    palette: "荷绿、杏黄与水白相映，清亮而通透。",
    camera: {
      azimuth: 1.38,
      elevation: 0.18,
      distanceMultiplier: 1.22,
      targetY: 0.43,
      fov: 27
    }
  },
  {
    id: "mangzhong-harvest",
    navTitle: "芒种盈穗",
    navSubtitle: "芒种 / 夏至 / 小暑",
    posterImage: "/assets/images/costumes/mangzhong-harvest.svg",
    badge: "代表服装",
    headline: "芒种盈穗",
    lead: "稼穑将忙，衣势便多了几分劲拔。",
    concept:
      "取田畴纹与麦浪意，写盛夏将熟的节律。",
    highlights: [
      "中段线条沉稳",
      "下摆垂势分明",
      "静中有劳作之力"
    ],
    palette: "稻青、土黄与微金交映，温厚而有张力。",
    camera: {
      azimuth: -0.12,
      elevation: 0.12,
      distanceMultiplier: 1.08,
      targetY: 0.36,
      fov: 25
    }
  },
  {
    id: "dashu-golden",
    navTitle: "大暑鎏金",
    navSubtitle: "大暑 / 立秋 / 处暑",
    posterImage: "/assets/images/costumes/dashu-golden.svg",
    badge: "代表服装",
    headline: "大暑鎏金",
    lead: "暑色正浓，衣章也添一分丰盛华光。",
    concept:
      "以宽摆与重褶收住盛热，将秋声暗伏其中。",
    highlights: [
      "袖形舒展",
      "纹样明朗",
      "通身气势饱满"
    ],
    palette: "暖金、荷绿与谷色并陈，浓丽而不躁。",
    camera: {
      azimuth: 0.84,
      elevation: 0.18,
      distanceMultiplier: 1.32,
      targetY: 0.45,
      fov: 26
    }
  },
  {
    id: "bailu-ink",
    navTitle: "白露墨韵",
    navSubtitle: "白露 / 秋分 / 寒露 / 霜降",
    posterImage: "/assets/images/costumes/bailu-ink.svg",
    badge: "代表服装",
    headline: "白露墨韵",
    lead: "露气初凝，衣色收敛，自有静秋之韵。",
    concept:
      "披帛与束摆相应，写露白、霜影与秋深。",
    highlights: [
      "下摆起伏含蓄",
      "画面更见凝练",
      "冷色里藏余温"
    ],
    palette: "银白、黛青与微枫相衬，清冷而雅致。",
    camera: {
      azimuth: -0.3,
      elevation: 0.1,
      distanceMultiplier: 1.04,
      targetY: 0.28,
      fov: 25
    }
  },
  {
    id: "winter-plum",
    navTitle: "冬梅映雪",
    navSubtitle: "立冬 / 小雪 / 大雪 / 冬至 / 小寒 / 大寒",
    posterImage: "/assets/images/costumes/winter-plum.svg",
    badge: "代表服装",
    headline: "冬梅映雪",
    lead: "梅影映雪，衣章沉静，寒中自有温意。",
    concept:
      "以厚袍与暖里相映，写冬藏与年近的消息。",
    highlights: [
      "比例端稳",
      "亮色柔和",
      "最宜收束全篇"
    ],
    palette: "冰白、藏青与梅红交织，清冽而含暖。",
    camera: {
      azimuth: 0.08,
      elevation: 0.18,
      distanceMultiplier: 1.4,
      targetY: 0.44,
      fov: 27
    }
  }
];

export const VIEW_PRESETS = rawViewPresets.map((preset) => ({
  ...preset,
  posterImage: resolveRuntimeAssetPath(preset.posterImage),
  modelAsset: getCostumeManifestEntry(preset.id)?.runtimeAsset ?? null
}));

export const MODEL_ASSET = VIEW_PRESETS[0]?.modelAsset ?? null;
