(function () {
  var appData = window.SolarTermsAppData = window.SolarTermsAppData || {};
  var manifest = window.CostumeModelManifest || { byId: {} };

  function getModelAsset(id) {
    return manifest.byId[id] ? manifest.byId[id].runtimeAsset : null;
  }

  appData.costumeExhibits = [
    {
      id: "lichun-brocade",
      title: "立春新绣",
      representedTermIds: ["lichun", "yushui", "jingzhe"],
      seasonGroup: "春启",
      designConcept: "以柔线写萌动，让初春的苏醒落在肩袖之间。",
      paletteDescription: "柳绿、米白与微金相映，清润而含光。",
      posterImage: "assets/images/costumes/lichun-brocade.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("lichun-brocade"),
      fallbackDescription: "海报留住春醒一瞬。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "chunfen-breeze",
      title: "春分风纹",
      representedTermIds: ["chunfen"],
      seasonGroup: "春衡",
      designConcept: "取花枝与纸鸢之势，写一段平和春声。",
      paletteDescription: "海棠粉与淡青绿相和，轻盈而匀净。",
      posterImage: "assets/images/costumes/chunfen-breeze.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("chunfen-breeze"),
      fallbackDescription: "海报自有风色轻匀。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "qingming-mist",
      title: "清明烟岚",
      representedTermIds: ["qingming", "guyu"],
      seasonGroup: "春深",
      designConcept: "以薄纱宽袖写清明明净，亦留谷雨丰意。",
      paletteDescription: "雾白、柳青与淡金相叠，温柔如雨后天光。",
      posterImage: "assets/images/costumes/qingming-mist.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("qingming-mist"),
      fallbackDescription: "烟雨一章，可静静细看。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "lixia-radiance",
      title: "立夏晴纱",
      representedTermIds: ["lixia", "xiaoman"],
      seasonGroup: "夏启",
      designConcept: "以轻层与阔摆写初夏，将明朗藏于从容。",
      paletteDescription: "荷绿、杏黄与水白相映，清亮而通透。",
      posterImage: "assets/images/costumes/lixia-radiance.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("lixia-radiance"),
      fallbackDescription: "清夏初成，已见明朗。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "mangzhong-harvest",
      title: "芒种稼穑",
      representedTermIds: ["mangzhong", "xiazhi", "xiaoshu"],
      seasonGroup: "盛夏",
      designConcept: "取田畴纹与麦浪意，写盛夏将熟的节律。",
      paletteDescription: "稻青、土黄与微金交映，温厚而有张力。",
      posterImage: "assets/images/costumes/mangzhong-harvest.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("mangzhong-harvest"),
      fallbackDescription: "稼穑气象，尽在衣势之间。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "dashu-golden",
      title: "大暑金曜",
      representedTermIds: ["dashu", "liqiu", "chushu"],
      seasonGroup: "暑退秋生",
      designConcept: "以宽摆与重褶收住盛热，将秋声暗伏其中。",
      paletteDescription: "暖金、荷绿与谷色并陈，浓丽而不躁。",
      posterImage: "assets/images/costumes/dashu-golden.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("dashu-golden"),
      fallbackDescription: "盛热将歇，华光未尽。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "bailu-ink",
      title: "白露染墨",
      representedTermIds: ["bailu", "qiufen", "hanlu", "shuangjiang"],
      seasonGroup: "秋深",
      designConcept: "披帛与束摆相应，写露白、霜影与秋深。",
      paletteDescription: "银白、黛青与微枫相衬，清冷而雅致。",
      posterImage: "assets/images/costumes/bailu-ink.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("bailu-ink"),
      fallbackDescription: "露白霜清，秋意自深。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "winter-plum",
      title: "寒梅藏雪",
      representedTermIds: ["lidong", "xiaoxue", "daxue", "dongzhi", "xiaohan", "dahan"],
      seasonGroup: "冬藏",
      designConcept: "以厚袍与暖里相映，写冬藏与年近的消息。",
      paletteDescription: "冰白、藏青与梅红交织，清冽而含暖。",
      posterImage: "assets/images/costumes/winter-plum.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("winter-plum"),
      fallbackDescription: "寒梅一点，收尽冬声。",
      assetPolicy: "hide-on-missing"
    }
  ];

  appData.getCostumeById = function (costumeId) {
    return (appData.costumeExhibits || []).find(function (item) {
      return item.id === costumeId;
    }) || null;
  };
})();
