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
    lead: "以早春新生的轻盈气息为灵感，呈现更柔和的轮廓关系与上身结构。",
    concept:
      "该服装代表春季初始阶段的节气意象，保留清明主题模型的高质量材质处理，并以更适合观察整体比例的机位呈现。",
    highlights: [
      "适合观察服装整体轮廓与肩袖展开",
      "春季色调更轻柔，纹样层次更温和",
      "可拖拽查看正面与侧面的结构变化"
    ],
    palette: "以浅绿、米白与淡金色为主，强调春意初生时的清润与柔和。",
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
    lead: "突出胸肩与面料衔接关系，更适合观察服装上身细节与纹理响应。",
    concept:
      "这一条目延续旧版服装索引结构，但继续使用当前的 GLB 与材质校正链路，使亮部更克制、细节更稳定。",
    highlights: [
      "更适合查看胸肩与领口结构",
      "中近景下纹样细节更清楚",
      "高光压制后，白色衣料不再发灰发白"
    ],
    palette: "以清浅春色为主，局部暖色补光用于强化衣料褶皱与层次。",
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
    lead: "以轻雾、垂丝与水气为意象，完整呈现清明主题服饰的主体比例与层次关系。",
    concept:
      "这是当前页面的核心服装条目，保留高质量 GLB 模型、暗环境贴图与材质校正，让衣料高光与中灰过渡更自然。",
    highlights: [
      "完整观察服装轮廓、袖摆与裙摆关系",
      "清明主题纹样与色彩层次更完整",
      "适合用作当前页面的主展示视图"
    ],
    palette: "主色为清雾白、浅青绿与柔和米金，强调雨后微光下的轻盈层次。",
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
    lead: "从偏侧方向观察服装体量与外轮廓，适合判断整体造型节奏与重心。",
    concept:
      "条目名称恢复为原有节气代表服装样式，右侧则继续使用现代 Three 渲染链与稳定的轮廓补光。",
    highlights: [
      "更容易判断服装的整体比例",
      "适合观察外轮廓和体量变化",
      "侧向视角下裙摆与袖型关系更清楚"
    ],
    palette: "偏暖的夏初色调与柔和轮廓光搭配，让服装边缘更加清晰。",
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
    lead: "强调服装中段与下摆过渡，适合查看体积变化和垂坠感。",
    concept:
      "保留当前模型与材质处理，通过略下移的视角把更多注意力放在中下区域，提升下摆部分的观感。",
    highlights: [
      "中下区域细节更值得观看",
      "下摆轮廓与阴影关系更明确",
      "放大后主体依然完整"
    ],
    palette: "以更沉稳的暖灰地面衬托绿色主料，让纹样与褶皱更容易被识别。",
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
    lead: "以更明快的观赏角度呈现衣料纹样和袖部展开，突出装饰细节。",
    concept:
      "在不改变模型渲染管线的前提下，通过更开阔的机位恢复旧版“代表服装”浏览的节奏感。",
    highlights: [
      "袖部与肩部展开更充分",
      "适合观察衣料上的局部纹样",
      "整体观感更偏展示型"
    ],
    palette: "暖金与灰绿相互平衡，让浅色区域不失层次，同时保留柔和反光。",
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
    lead: "镜头进一步下压，突出裙摆、底边和下半部分的结构层次。",
    concept:
      "这一路径保留你刚确认过的材质校正，同时将旧版索引中偏秋季的代表服装命名和气质放回界面。",
    highlights: [
      "更适合观察下摆起伏",
      "减少顶部留白，画面更紧凑",
      "底部投影与空间关系更自然"
    ],
    palette: "更克制的灰绿与米褐组合，强化秋季服装的沉静观感。",
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
    lead: "以较稳定的正视角回看整体造型，在克制光照下观察服装完整比例。",
    concept:
      "左侧索引恢复为原本的节气代表服装风格，冬季条目则对应一个更平稳、便于总览的展示机位。",
    highlights: [
      "适合总览整套服装比例",
      "亮白区域更柔和，不会刺眼",
      "方便作为页面结束时的整体回看视角"
    ],
    palette: "以清冷的浅灰绿为主，借由压低后的反射表现出更安静的冬季气质。",
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
