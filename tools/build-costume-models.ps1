$ErrorActionPreference = "Stop"

$entries = @(
  @{ Id = "lichun-brocade"; Source = "assets\moudle\RainWater\RainWater.glb"; Output = "assets\generated\costumes\lichun-brocade.glb" },
  @{ Id = "chunfen-breeze"; Source = "assets\moudle\Spring Equinox\Spring Equinox.glb"; Output = "assets\generated\costumes\chunfen-breeze.glb" },
  @{ Id = "qingming-mist"; Source = "assets\moudle\qingming\qingming.glb"; Output = "assets\generated\costumes\qingming-mist.glb" },
  @{ Id = "lixia-radiance"; Source = "assets\moudle\Start of Summer\Start of Summer.glb"; Output = "assets\generated\costumes\lixia-radiance.glb" },
  @{ Id = "mangzhong-harvest"; Source = "assets\moudle\Grain in Ear\Grain in Ear.glb"; Output = "assets\generated\costumes\mangzhong-harvest.glb" },
  @{ Id = "dashu-golden"; Source = "assets\moudle\Beginning of Autumn\Beginning of Autumn.glb"; Output = "assets\generated\costumes\dashu-golden.glb" },
  @{ Id = "bailu-ink"; Source = "assets\moudle\White Dew\White Dew.glb"; Output = "assets\generated\costumes\bailu-ink.glb" },
  @{ Id = "winter-plum"; Source = "assets\moudle\Major Cold\Major Cold.glb"; Output = "assets\generated\costumes\winter-plum.glb" }
)

New-Item -ItemType Directory -Force "assets\generated\costumes" | Out-Null

foreach ($entry in $entries) {
  node node_modules\@gltf-transform\cli\bin\cli.js optimize $entry.Source $entry.Output --compress draco --texture-compress webp --texture-size 1024
}

node tools\validate-costume-models.js
