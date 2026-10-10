# Export assets/midtown-auditorium.glb for the web viewer: scene.json (glTF JSON, no buffer URI),
# geometry.txt (the binary buffer as base64) and tex/*.jpg. Artifact pages cannot fetch .glb, .bin
# or data: URLs, so the viewer rebuilds a GLB in memory from these.
# Usage: powershell -File tools/blender/midtown_web_export.ps1 -Out <dir>
param([Parameter(Mandatory)][string]$Out)
$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$blender = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
if (Test-Path $Out) { Get-ChildItem -LiteralPath $Out -Recurse -File | Remove-Item -Force }
New-Item -ItemType Directory -Force $Out | Out-Null
$glb = Join-Path $repo 'assets\midtown-auditorium.glb'
$gltf = Join-Path $Out 'scene.gltf'
$py = "import bpy; bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=r'$glb'); bpy.ops.export_scene.gltf(filepath=r'$gltf', export_format='GLTF_SEPARATE', export_image_format='JPEG', export_jpeg_quality=88, export_texture_dir='tex')"
& $blender -b --factory-startup --python-expr $py | Out-Null
$j = Get-Content $gltf -Raw | ConvertFrom-Json
$bin = [IO.File]::ReadAllBytes((Join-Path $Out 'scene.bin'))
$j.buffers[0].PSObject.Properties.Remove('uri')
$utf8 = New-Object Text.UTF8Encoding $false
[IO.File]::WriteAllText((Join-Path $Out 'scene.json'), ($j | ConvertTo-Json -Depth 30 -Compress), $utf8)
[IO.File]::WriteAllText((Join-Path $Out 'geometry.txt'), [Convert]::ToBase64String($bin), $utf8)
Remove-Item -LiteralPath $gltf, (Join-Path $Out 'scene.bin') -Force
$j.images | ForEach-Object { $_.uri }
