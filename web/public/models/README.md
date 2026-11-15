# Building models

Put building `.glb` or `.gltf` assets here, grouped by building ID. Public paths
start with `/models/`. Use licensed or team-created assets and record their source.
No real building models are included in this scaffold.

Keep mesh names, floor IDs, and coordinates aligned with `data/buildings/`.
Do not import React Three Fiber into a Server Component. The eventual viewer
should be a client component; keep browser-only model loading inside it.

## Trojan map guide

`tommy-trojan.glb` now contains the simple, faceless Trojan guide: a gold map figure
with a bronze helmet and cardinal crest, based on the user's pavement-symbol reference.
The rounded body meets the head directly, with thick arms rooted inside the shoulders.
The existing asset path is retained for the map integration.

The rounded shell, nose guard, shaped cheek plates, and flared nape take inspiration
from [the Met's Corinthian helmet](https://www.metmuseum.org/art/collection/search/250922).
The curved horsehair crest uses [Greek Phalanx reconstructions](https://www.thegreekphalanx.org/helmets)
as visual references. All geometry is authored locally; no reference images or meshes
are included in the asset.

Rebuild with Blender 4.3; no downloaded meshes or authoring packages are required:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.3/blender.exe' --background --factory-startup --python scripts/build-tommy.py -- --render
```

The script checks finite vertices, model height, five animation pivots, fewer than
6,000 triangles, seven draw calls, and an asset below 200 KB. Two vertex-colored
materials separate brushed bronze from the matte figure and crest; there are no
texture downloads. The optional render
is written next to the GLB.

Coordinates export as Y-up, with feet at zero. The viewer scales the roughly
2.4-unit figure to a 4.1-metre marker for visibility. Set the model URL revision to
the first 12 lowercase characters of the finished GLB's SHA-256 hash in
`TommyTrojanModel.tsx` after replacing the file so existing tabs load the new model.

Carrying uses the local `mascot-motion.ts` clip: seven poses across the head and
four limbs (700 bytes of keyframe buffers). The head droops on a neck hinge while a
bounded two-axis spring swings the body around the nape. No physics engine, server
updates, or additional animation downloads are needed.
