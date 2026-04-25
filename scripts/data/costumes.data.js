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
      designConcept: "以抽芽藤蔓与舒展衣摆象征万物初醒，轮廓轻扬、线条柔和，强调春季从沉静到舒展的过渡。",
      paletteDescription: "以柳芽绿、杏花米与晨光金为主，层层叠加出温润的早春亮度。",
      posterImage: "assets/images/costumes/lichun-brocade.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("lichun-brocade"),
      fallbackDescription: "当前条目使用本地海报与设计说明呈现立春意象，不再生成程序化模型。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "chunfen-breeze",
      title: "春分风纹",
      representedTermIds: ["chunfen"],
      seasonGroup: "春衡",
      designConcept: "借风筝尾线与花枝弧线构成对称衣纹，表现春分昼夜均衡与风色俱佳的状态。",
      paletteDescription: "海棠粉、淡青绿与柔白并置，突出均衡、清雅、轻透的节气调性。",
      posterImage: "assets/images/costumes/chunfen-breeze.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("chunfen-breeze"),
      fallbackDescription: "若本地模型无法载入，则自动回退为春分主题海报与文字说明。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "qingming-mist",
      title: "清明烟岚",
      representedTermIds: ["qingming", "guyu"],
      seasonGroup: "春深",
      designConcept: "以薄纱与宽袖表达烟雨踏青的层叠感，强调清明的明净与谷雨的丰润之间的转换。",
      paletteDescription: "柳青、雾灰与细金勾边结合，形成既清朗又柔和的雨后质地。",
      posterImage: "assets/images/costumes/qingming-mist.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("qingming-mist"),
      fallbackDescription: "若本地 3D 模型无法载入，则保留清明烟雨主题的静态图文层。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "lixia-radiance",
      title: "立夏晴纱",
      representedTermIds: ["lixia", "xiaoman"],
      seasonGroup: "夏启",
      designConcept: "用更开阔的下摆与轻薄罩层表现夏意初立的通透感，既明亮又不失柔顺。",
      paletteDescription: "荷叶绿、杏黄与水白形成通风感极强的夏季配色。",
      posterImage: "assets/images/costumes/lixia-radiance.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("lixia-radiance"),
      fallbackDescription: "当前条目仅展示本地海报与说明，保留立夏、小满的清亮配色与面料想象。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "mangzhong-harvest",
      title: "芒种稼穑",
      representedTermIds: ["mangzhong", "xiazhi", "xiaoshu"],
      seasonGroup: "盛夏",
      designConcept: "强调劳作与丰收前奏的节奏感，肩线更利落，衣摆的折线模拟田畴纹理。",
      paletteDescription: "稻青、土黄与日晖金相互叠映，表达忙收忙种与日照渐盛的气候张力。",
      posterImage: "assets/images/costumes/mangzhong-harvest.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("mangzhong-harvest"),
      fallbackDescription: "当前条目仅展示本地海报与文字，呈现芒种到小暑之间的农事节奏。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "dashu-golden",
      title: "大暑金曜",
      representedTermIds: ["dashu", "liqiu", "chushu"],
      seasonGroup: "暑退秋生",
      designConcept: "用更饱满的褶量与宽阔衣摆表现高热与丰收同时逼近的饱满感，衣身线条更有重量。",
      paletteDescription: "烈阳橙、谷穗金与深荷绿形成浓烈的夏末秋初对照。",
      posterImage: "assets/images/costumes/dashu-golden.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("dashu-golden"),
      fallbackDescription: "当前条目仅展示本地海报与说明，继续保留大暑至处暑的盛热与丰收氛围。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "bailu-ink",
      title: "白露染墨",
      representedTermIds: ["bailu", "qiufen", "hanlu", "shuangjiang"],
      seasonGroup: "秋深",
      designConcept: "收束衣摆并增加外层披帛，表现秋露、红叶与霜色叠加后的沉静层次。",
      paletteDescription: "银白、黛蓝与枫红点缀，形成清冷但不失温度的秋季组合。",
      posterImage: "assets/images/costumes/bailu-ink.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("bailu-ink"),
      fallbackDescription: "当前条目仅展示本地海报与节气信息，不再使用程序生成的三维造型。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "winter-plum",
      title: "寒梅藏雪",
      representedTermIds: ["lidong", "xiaoxue", "daxue", "dongzhi", "xiaohan", "dahan"],
      seasonGroup: "冬藏",
      designConcept: "采用厚实外袍与内层暖色里襟，表现冬季收藏、炉火与年味渐近的双重感受。",
      paletteDescription: "冰白、藏青与梅枝红共同构成冬季最清冽又最温暖的色彩层次。",
      posterImage: "assets/images/costumes/winter-plum.svg",
      modelSourceType: "packaged-model",
      modelAsset: getModelAsset("winter-plum"),
      fallbackDescription: "当前条目仅展示本地海报与说明，保留冬季厚袍的结构、寒色与暖光对比。",
      assetPolicy: "hide-on-missing"
    }
  ];

  appData.getCostumeById = function (costumeId) {
    return (appData.costumeExhibits || []).find(function (item) {
      return item.id === costumeId;
    }) || null;
  };
})();
