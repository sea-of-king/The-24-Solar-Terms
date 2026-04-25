(function (root) {
  var entries = [
    {
      id: "lichun-brocade",
      sourcePath: "assets/moudle/Start of Spring/Start of Spring.glb",
      sourceAliasPath: "assets/module/Start of Spring/Start of Spring.glb",
      outputPath: "assets/generated/costumes/lichun-brocade.glb",
      sizeBytes: 2575908,
      sizeLabel: "2.46 MB",
      runtimeAsset: {
        path: "/assets/generated/costumes/lichun-brocade.glb",
        scale: 0.72,
        rotationY: 0.12
      }
    },
    {
      id: "chunfen-breeze",
      sourcePath: "assets/moudle/Spring Equinox/Spring Equinox.glb",
      sourceAliasPath: "assets/module/Spring Equinox/Spring Equinox.glb",
      outputPath: "assets/generated/costumes/chunfen-breeze.glb",
      sizeBytes: 2044812,
      sizeLabel: "1.95 MB",
      runtimeAsset: {
        path: "/assets/generated/costumes/chunfen-breeze.glb",
        scale: 0.72,
        rotationY: 0.1
      }
    },
    {
      id: "qingming-mist",
      sourcePath: "assets/moudle/qingming/qingming.glb",
      sourceAliasPath: "assets/module/qingming/qingming.glb",
      outputPath: "assets/generated/costumes/qingming-mist.glb",
      sizeBytes: 965236,
      sizeLabel: "942.61 KB",
      runtimeAsset: {
        path: "/assets/generated/costumes/qingming-mist.glb",
        scale: 0.72,
        rotationY: 0.12
      }
    },
    {
      id: "lixia-radiance",
      sourcePath: "assets/moudle/Start of Summer/Start of Summer.glb",
      sourceAliasPath: "assets/module/Start of Summer/Start of Summer.glb",
      outputPath: "assets/generated/costumes/lixia-radiance.glb",
      sizeBytes: 2346408,
      sizeLabel: "2.24 MB",
      runtimeAsset: {
        path: "/assets/generated/costumes/lixia-radiance.glb",
        scale: 0.72,
        rotationY: 0.16
      }
    },
    {
      id: "mangzhong-harvest",
      sourcePath: "assets/moudle/Grain in Ear/Grain in Ear.glb",
      sourceAliasPath: "assets/module/Grain in Ear/Grain in Ear.glb",
      outputPath: "assets/generated/costumes/mangzhong-harvest.glb",
      sizeBytes: 1658160,
      sizeLabel: "1.58 MB",
      runtimeAsset: {
        path: "/assets/generated/costumes/mangzhong-harvest.glb",
        scale: 0.72,
        rotationY: 0.08
      }
    },
    {
      id: "dashu-golden",
      sourcePath: "assets/moudle/Beginning of Autumn/Beginning of Autumn.glb",
      sourceAliasPath: "assets/module/Beginning of Autumn/Beginning of Autumn.glb",
      outputPath: "assets/generated/costumes/dashu-golden.glb",
      sizeBytes: 1571668,
      sizeLabel: "1.50 MB",
      runtimeAsset: {
        path: "/assets/generated/costumes/dashu-golden.glb",
        scale: 0.72,
        rotationY: 0.1
      }
    },
    {
      id: "bailu-ink",
      sourcePath: "assets/moudle/White Dew/White Dew.glb",
      sourceAliasPath: "assets/module/White Dew/White Dew.glb",
      outputPath: "assets/generated/costumes/bailu-ink.glb",
      sizeBytes: 2097680,
      sizeLabel: "2.00 MB",
      runtimeAsset: {
        path: "/assets/generated/costumes/bailu-ink.glb",
        scale: 0.72,
        rotationY: -0.06
      }
    },
    {
      id: "winter-plum",
      sourcePath: "assets/moudle/Major Cold/Major Cold.glb",
      sourceAliasPath: "assets/module/Major Cold/Major Cold.glb",
      outputPath: "assets/generated/costumes/winter-plum.glb",
      sizeBytes: 1393784,
      sizeLabel: "1.33 MB",
      runtimeAsset: {
        path: "/assets/generated/costumes/winter-plum.glb",
        scale: 0.72,
        rotationY: 0.02
      }
    }
  ];

  var byId = Object.create(null);
  entries.forEach(function (entry) {
    byId[entry.id] = entry;
  });

  function normalizeSourcePath(value) {
    if (typeof value !== "string") return value;
    return value
      .replace(/^\/?assets\/module\//, "assets/moudle/")
      .replace(/^\/assets\/module\//, "/assets/moudle/");
  }

  root.CostumeModelManifest = {
    generatedAt: "2026-04-20T00:00:00.000Z",
    sizeLimitBytes: 10485760,
    entries: entries,
    byId: byId,
    modelPaths: entries.map(function (entry) {
      return entry.runtimeAsset.path;
    }),
    normalizeSourcePath: normalizeSourcePath
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
