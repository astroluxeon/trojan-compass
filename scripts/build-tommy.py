"""Build the simple Trojan map figure with Blender 4.3.
Run: blender --background --factory-startup --python scripts/build-tommy.py -- --render
The user-supplied Trojan cycling symbol guides the helmet silhouette.
"""
import bpy
import bmesh
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'apps/web/public/models/tommy-trojan.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def xyz(p):
    return (p[0],-p[2],p[1])

GOLD=(.92,.53,.045,1)
CARDINAL=(.32,.008,.018,1)
BRONZE=(.48,.265,.075,1)
material=bpy.data.materials.new('Trojan guide vertex colors')
material.use_nodes=True
material.use_backface_culling=True
shader=material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value=.58
color=material.node_tree.nodes.new('ShaderNodeVertexColor')
color.layer_name='Color'
material.node_tree.links.new(color.outputs['Color'],shader.inputs['Base Color'])
bronze=material.copy()
bronze.name='Brushed bronze helmet'
bronze.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.65
bronze.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.36

def finish(obj,name,color):
    obj.name=name
    obj.data.materials.append(bronze if color==BRONZE else material)
    for face in obj.data.polygons:face.use_smooth=True
    attribute=obj.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER')
    for corner in attribute.data:corner.color=color
    return obj

def mesh(name,vertices,faces,color):
    data=bpy.data.meshes.new(name)
    data.from_pydata([xyz(v) for v in vertices],[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    return finish(obj,name,color)

def ball(name,at,size,color=GOLD):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=xyz(at))
    obj=bpy.context.object
    obj.scale=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,color)

def capsule(name,start,end,radius):
    length=(Vector(end)-Vector(start)).length
    vertices=[]
    # Two hemispheres with separate equators form a smooth, straight capsule.
    rings=[]
    for step in range(5):
        angle=step*math.pi/8
        rings.append((radius*math.sin(angle),length/2+radius*math.cos(angle)))
    for step in range(5):
        angle=math.pi/2+step*math.pi/8
        rings.append((radius*math.sin(angle),-length/2+radius*math.cos(angle)))
    for r,y in rings:
        for i in range(16):
            a=i*math.tau/16
            vertices.append((r*math.sin(a),y,r*math.cos(a)))
    faces=[(j*16+i,j*16+(i+1)%16,(j+1)*16+(i+1)%16,(j+1)*16+i) for j in range(9) for i in range(16)]
    obj=mesh(name,vertices,faces,GOLD)
    obj.location=(Vector(xyz(start))+Vector(xyz(end)))/2
    obj.rotation_euler=(Vector(xyz(start))-Vector(xyz(end))).to_track_quat('Z','Y').to_euler()
    return obj

def pivot(name,at,parts):
    group=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(group)
    group.location=xyz(at)
    bpy.context.view_layer.update()
    for obj in parts:
        world=obj.matrix_world.copy()
        obj.parent=group
        obj.matrix_world=world
    return group

ball('Soft blob torso',(0,1.065,0),(.30,.53,.245))
for side in [-1,1]:
    # Bury the shoulder pivots inside the torso so swinging arms stay attached.
    arm=capsule('Soft arm',(side*.22,1.36,0),(side*.335,.91,.025),.105)
    pivot('ArmL' if side<0 else 'ArmR',(side*.22,1.36,0),[arm])
    leg=capsule('Soft leg',(side*.115,.67,0),(side*.135,.14,0),.10)
    foot=ball('Rounded foot',(side*.135,.075,.045),(.105,.074,.135))
    pivot('LegL' if side<0 else 'LegR',(side*.115,.67,0),[leg,foot])

before=set(bpy.data.objects)
ball('Faceless round head',(0,1.735,0),(.224,.247,.219))
# Corinthian shell: raised brow, lowered rear edge, and a flared nape skirt.
vertices=[]
for j in range(8):
    a=j*math.pi/14
    for i in range(24):
        angle=i*math.tau/24
        brow=.065*math.cos(angle)*math.cos(a)**2
        vertices.append((.25*math.cos(a)*math.sin(angle),1.78+.26*math.sin(a)+brow,.248*math.cos(a)*math.cos(angle)))
helmet=mesh('Bronze domed shell',vertices,[(j*24+i,j*24+(i+1)%24,(j+1)*24+(i+1)%24,(j+1)*24+i) for j in range(7) for i in range(24)],BRONZE)
solid=helmet.modifiers.new('Helmet shell','SOLIDIFY');solid.thickness=.012

def plate(name,vertices,faces):
    obj=mesh(name,vertices,faces,BRONZE)
    solid=obj.modifiers.new('Forged plate thickness','SOLIDIFY');solid.thickness=.012
    bevel=obj.modifiers.new('Rounded metal edges','BEVEL');bevel.width=.004;bevel.segments=2
    return obj

vertices=[]
for j in range(3):
    for i in range(17):
        a=math.pi/3+i*math.pi/12
        r=.25+(.035 if j==2 else 0)
        vertices.append((r*math.sin(a),1.78+.065*math.cos(a)-j*.065,r*math.cos(a)))
plate('Flared neck guard',vertices,[(j*17+i,j*17+i+1,(j+1)*17+i+1,(j+1)*17+i) for j in range(2) for i in range(16)])
for side in [-1,1]:
    # Curved plates follow the cheeks and taper toward the open mouth.
    outline=[(.245,1.80,.045),(.202,1.754,.152),(.08,1.728,.231),(.105,1.552,.20),(.184,1.525,.128),(.253,1.65,-.02)]
    vertices=[(side*x,y,z) for x,y,z in outline]+[(side*.218,1.675,.134)]
    plate('Shaped cheek plate',vertices,[(i,(i+1)%6,6) for i in range(6)])
plate('Tapered nasal guard',[(-.039,1.852,.245),(.039,1.852,.245),(.023,1.696,.258),(0,1.68,.265),(-.023,1.696,.258)],[(0,1,2,3,4)])

# Radial ridges suggest horsehair without alpha textures or individual strands.
def crest_band(name,inner,outer,width,color):
    vertices=[]
    steps=32
    for i in range(steps+1):
        a=-.08+i*2.95/steps
        for r,x in [(inner,-width),(outer,-width*.72),(outer,width*.72),(inner,width)]:
            ridge=.004*(i%2) if r==outer else 0
            vertices.append((x,1.955+(r+ridge)*math.sin(a),-.035+(r+ridge)*math.cos(a)))
    faces=[(i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j) for i in range(steps) for j in range(4)]
    faces.extend([(3,2,1,0),tuple(range(steps*4,steps*4+4))])
    obj=mesh(name,vertices,faces,color)
    if color==CARDINAL:
        attribute=obj.data.color_attributes['Color']
        for face in obj.data.polygons:
            tint=.76 if (face.index//4)%2 else 1.12
            for loop in face.loop_indices:attribute.data[loop].color=tuple(c*tint for c in CARDINAL[:3])+(1,)
    return obj
crest_band('Bronze crest holder',.12,.205,.039,BRONZE)
crest_band('Swept cardinal horsehair',.196,.434,.046,CARDINAL)
pivot('Head',(0,1.48,.025),set(bpy.data.objects)-before)

# Weld the capsule poles and bake modifiers; one colored mesh per animated part.
groups={}
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':continue
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=bm.verts[:],dist=.00001)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:])
    bm.to_mesh(obj.data);bm.free()
    assert all(math.isfinite(v) for vertex in obj.data.vertices for v in vertex.co)
    groups.setdefault(obj.parent,[]).append(obj)
for parent,parts in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    if len(parts)>1:bpy.ops.object.join()
    obj=bpy.context.object
    obj.name=parent.name+' mesh' if parent else 'Trojan guide body'
    # Joining keeps the bronze finish separate from the matte figure and plume.

objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.context.view_layer.update()
bounds=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
height=max(p.z for p in bounds)-min(p.z for p in bounds)
triangles=sum(len(p.vertices)-2 for o in objects for p in o.data.polygons)
assert len(objects)==6
assert sum(len(set(p.material_index for p in o.data.polygons)) for o in objects)==7
assert triangles<6000,triangles
assert 2.35<height<2.45,height
assert all(bpy.data.objects.get(n) for n in ['Head','ArmL','ArmR','LegL','LegR'])
OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_yup=True)
assert OUT.stat().st_size<200000
print(f'Trojan guide: {triangles:,} triangles, {len(objects)} meshes, {height:.3f} units, {OUT.stat().st_size:,} bytes',flush=True)

if '--render' in sys.argv:
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.world.color=(.3,.3,.3)
    scene.view_settings.view_transform='AgX'
    for location,energy,size in [((3,-4,6),450,4),((-3,-2,3),220,3),((1,3,4),450,3)]:
        bpy.ops.object.light_add(type='AREA',location=location)
        light=bpy.context.object;light.data.energy=energy;light.data.shape='DISK';light.data.size=size
        light.rotation_euler=(Vector((0,0,1.2))-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(3,-6,2.8))
    camera=bpy.context.object
    camera.rotation_euler=(Vector((0,0,1.2))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=2.85
    scene.camera=camera
    scene.render.resolution_x=700;scene.render.resolution_y=850;scene.render.resolution_percentage=100
    scene.render.film_transparent=True
    scene.render.filepath=str(OUT.with_suffix('.png'))
    bpy.ops.render.render(write_still=True)
