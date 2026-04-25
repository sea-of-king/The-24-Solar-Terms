# Costume Model Outputs

Size limit: 10.00 MB

Canonical runtime assets are the compressed GLB files in this directory. Original high-resolution source models remain under `assets/moudle/`, while `assets/module/` is treated only as a naming alias in manifest normalization.

| Costume ID | Source Model | Compressed Output | Size |
| --- | --- | --- | --- |
| lichun-brocade | assets/moudle/Start of Spring/Start of Spring.glb | assets/generated/costumes/lichun-brocade.glb | 2.46 MB |
| chunfen-breeze | assets/moudle/Spring Equinox/Spring Equinox.glb | assets/generated/costumes/chunfen-breeze.glb | 1.95 MB |
| qingming-mist | assets/moudle/qingming/qingming.glb | assets/generated/costumes/qingming-mist.glb | 942.61 KB |
| lixia-radiance | assets/moudle/Start of Summer/Start of Summer.glb | assets/generated/costumes/lixia-radiance.glb | 2.24 MB |
| mangzhong-harvest | assets/moudle/Grain in Ear/Grain in Ear.glb | assets/generated/costumes/mangzhong-harvest.glb | 1.58 MB |
| dashu-golden | assets/moudle/Beginning of Autumn/Beginning of Autumn.glb | assets/generated/costumes/dashu-golden.glb | 1.50 MB |
| bailu-ink | assets/moudle/White Dew/White Dew.glb | assets/generated/costumes/bailu-ink.glb | 2.00 MB |
| winter-plum | assets/moudle/Major Cold/Major Cold.glb | assets/generated/costumes/winter-plum.glb | 1.33 MB |

Repeatable compression command pattern:

```powershell
node node_modules\@gltf-transform\cli\bin\cli.js optimize "<source>" "<output>" --compress draco --texture-compress webp --texture-size 1024
```
