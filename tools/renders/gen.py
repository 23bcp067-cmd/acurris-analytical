import json
G='#0B6E4F'
S={}
def item(name, items, w=800, h=600, **kw): S[name]=dict(items=items,w=w,h=h,**kw)
def kit(title, code, cas, sub='Rapid test kit', tests='96 tests'):
    return [{"type":"kitBox","opts":{"title":title,"code":code,"sub":sub,"tests":tests},"rot":[0,-16,0]},
            {"type":"cassette","opts":{"code":cas,"title":title},"pos":[3.6,0.21,3.0],"rot":[0,-32,0]}]
# QuEChERS
qt=lambda cap,t,sub,code,fill=1.9,pos=[0,0,0],rot=[0,-8,0]: {"type":"tube50","opts":{"cap":cap,"fill":fill,"label":{"title":"QuEChERS","sub":sub,"code":code}},"pos":pos,"rot":rot}
item('quechers-original',[qt('#F2F2EE','QuEChERS',['Original, unbuffered','4 g MgSO4 · 1 g NaCl'],'AA-QC-OR-50')])
item('quechers-aoac',[qt('#2C6DB5','QuEChERS',['AOAC 2007.01','6 g MgSO4 · 1.5 g NaOAc'],'AA-QC-AO-50',2.3)])
item('quechers-en',[qt('#E2702B','QuEChERS',['EN 15662, citrate','4 g MgSO4 · 1 g NaCl'],'AA-QC-EN-50')])
item('quechers-pouch',[{"type":"pouch","opts":{"title":"EN 15662"},"pos":[-1.8,2.5,0],"rot":[0,14,0]},qt('#E2702B','',['EN 15662, citrate','Pre-filled tube'],'AA-QC-EN-50',1.9,[2.6,0,0.8],[0,-14,0])])
item('cat-quechers',[qt('#F2F2EE','',['Original, unbuffered','4 g MgSO4 · 1 g NaCl'],'AA-QC-OR-50',1.6,[-3.6,0,-0.6],[0,-14,0]),qt('#2C6DB5','',['AOAC 2007.01','6 g MgSO4 · 1.5 g NaOAc'],'AA-QC-AO-50',2.3,[0,0,0.4],[0,-4,0]),qt('#E2702B','',['EN 15662, citrate','4 g MgSO4 · 1 g NaCl'],'AA-QC-EN-50',1.9,[3.6,0,-0.4],[0,10,0])],1200,900)
# dSPE
mt=lambda lab,cap='#F2F2EE',fc=0xf3f3f0,f2=None,pos=[0,0,0]: {"type":"microtube","opts":{"labelText":lab,"cap":cap,"fillColor":fc,"fill2":f2},"pos":pos}
item('dspe-psa',[mt('PSA'),],elev=12)
item('dspe-c18',[mt('PSA/C18','#F2F2EE',0xf3f3f0,{"h":0.25,"color":0xe8e2cf})],elev=12)
item('dspe-gcb',[mt('PSA/GCB','#F2F2EE',0xf3f3f0,{"h":0.22,"color":0x2b2b2b})],elev=12)
item('dspe-other',[{"type":"tube15","opts":{"cap":"#F2F2EE","fill":1.2,"label":{"title":"dSPE","sub":["15 mL cleanup","Custom blend"],"code":"AA-DS-CU-15","ml":15}}}])
item('cat-dspe',[mt('PSA',pos=[-1.6,0,0]),mt('PSA/C18','#F2F2EE',0xf3f3f0,{"h":0.25,"color":0xe8e2cf},[0,0,0.4]),mt('PSA/GCB','#F2F2EE',0xf3f3f0,{"h":0.22,"color":0x2b2b2b},[1.6,0,0]),{"type":"tube15","opts":{"cap":"#F2F2EE","fill":1.2,"label":{"title":"dSPE","sub":["15 mL cleanup"],"code":"AA-DS-CU-15","ml":15}},"pos":[3.6,0,-1.2]}],1200,900,elev=14)
# SPE
sp=lambda lab,sub,bed=0xf4f4f0,pos=[0,0.9,0],rot=[0,0,0]: {"type":"speCartridge","opts":{"label":lab,"sub":sub,"bed":bed},"pos":pos,"rot":rot}
item('spe-c18',[sp('C18','500 mg / 3 mL')])
item('spe-ion',[sp('SCX','500 mg / 3 mL',0xe9e2c4)])
item('spe-poly',[sp('HLB-type','200 mg / 6 mL',0xeee8dc)])
item('spe-other',[sp('C18','500 mg / 3 mL',pos=[-0.8,0.9,0]),sp('SAX','500 mg / 3 mL',0xe2e6ea,[0.8,0.9,0.3])])
item('cat-spe',[sp('C18','500 mg / 3 mL',pos=[-1.7,0.9,0]),sp('SCX','500 mg / 3 mL',0xe9e2c4,[0,0.9,0.5]),sp('HLB-type','200 mg / 6 mL',0xeee8dc,[1.7,0.9,0])],1200,900)
# Filtration
sf=lambda tint,code,pos=[0,1.05,0],rot=[18,0,0]: {"type":"syringeFilter","opts":{"tint":tint,"code":code},"pos":pos,"rot":rot}
item('filt-ptfe',[sf('#FFFFFF','PTFE 0.22 µm')],elev=34)
item('filt-nylon',[sf('#CDEFD9','Nylon 0.45 µm')],elev=34)
item('filt-pvdf',[sf('#CFE6FA','PVDF 0.22 µm')],elev=34)
item('filt-pes',[sf('#F8D9E3','PES 0.45 µm')],elev=34)
item('filt-disc',[sf('#FFFFFF','PTFE 0.22 µm',[-1.5,1.05,0]),sf('#CFE6FA','PVDF 0.45 µm',[1.5,1.05,0.4])],elev=34)
item('cat-filtration',[sf('#FFFFFF','PTFE 0.22 µm',[-3,1.05,0]),sf('#CDEFD9','Nylon 0.45 µm',[0,1.05,0.6]),sf('#CFE6FA','PVDF 0.22 µm',[3,1.05,0]),sf('#F8D9E3','PES 0.45 µm',[1.5,1.05,-2.6])],1200,900,elev=26)
# Sample handling
v=lambda amber=False,pos=[0,0,0],cap='#2453B5': {"type":"vial","opts":{"amber":amber,"cap":cap},"pos":pos}
item('sh-vials',[v(False,[-0.75,0,0]),v(True,[0.75,0,0.2])])
item('sh-caps',[v(False,[0,0,0],'#B42318')])
item('sh-tubes',[{"type":"tube50","opts":{"cap":"#2C6DB5","label":{"title":"50 mL","sub":["Centrifuge tube"],"code":"AA-SH-CT-50"}},"pos":[-1.4,0,0]},{"type":"tube15","opts":{"cap":"#2C6DB5","label":{"title":"15 mL","sub":["Centrifuge"],"code":"AA-SH-CT-15","ml":15}},"pos":[1.4,0,0.4]}])
item('sh-other',[v(False,[-0.75,0,0]),{"type":"microtube","opts":{"fill":0},"pos":[0.9,0,0.3]}])
item('cat-sample-handling',[{"type":"tube50","opts":{"cap":"#2C6DB5","label":{"title":"50 mL","sub":["Centrifuge tube"],"code":"AA-SH-CT-50"}},"pos":[-3.2,0,-0.6]},{"type":"tube15","opts":{"cap":"#2C6DB5","label":{"title":"15 mL","sub":["Centrifuge"],"code":"AA-SH-CT-15","ml":15}},"pos":[-0.6,0,0]},v(False,[1.4,0,0.8]),v(True,[2.9,0,0.4]),v(False,[4.3,0,0],'#B42318')],1200,900)
# Kits
item('my-afb1',kit('Aflatoxin B1','AA-MY-AFB1','AFB1'))
item('my-ota',kit('Ochratoxin A','AA-MY-OTA','OTA'))
item('my-don',kit('Deoxynivalenol','AA-MY-DON','DON'))
item('my-zen',kit('Zearalenone','AA-MY-ZEN','ZEN'))
item('my-fum',kit('Fumonisins','AA-MY-FUM','FUM'))
item('cat-mycotoxins',[{"type":"kitBox","opts":{"title":"Aflatoxin B1","code":"AA-MY-AFB1"},"pos":[-4.2,0,-2.6],"rot":[0,-12,0]},{"type":"kitBox","opts":{"title":"Deoxynivalenol","code":"AA-MY-DON"},"pos":[3.4,0,-3.2],"rot":[0,-24,0]},{"type":"cassette","opts":{"code":"AFB1","title":"Aflatoxin B1"},"pos":[-1.4,0.21,2.4],"rot":[0,-20,0]},{"type":"cassette","opts":{"code":"DON","title":"Deoxynivalenol"},"pos":[1.6,0.21,2.2],"rot":[0,-34,0]}],1200,900,elev=22)
item('ab-blac',kit('Beta-lactams','AA-AB-BL','β-LAC'))
item('ab-tet',kit('Tetracyclines','AA-AB-TC','TC'))
item('ab-sul',kit('Sulfonamides','AA-AB-SU','SUL'))
item('ab-fq',kit('Fluoroquinolones','AA-AB-FQ','FQ'))
item('ab-mac',kit('Macrolides','AA-AB-MA','MAC'))
item('ab-other',kit('Veterinary drugs','AA-AB-VD','VD','Custom panel'))
item('cat-antibiotic-residues',[{"type":"kitBox","opts":{"title":"Beta-lactams","code":"AA-AB-BL"},"pos":[-4,0,-2.6],"rot":[0,-12,0]},{"type":"kitBox","opts":{"title":"Tetracyclines","code":"AA-AB-TC"},"pos":[3.6,0,-3.2],"rot":[0,-24,0]},{"type":"cassette","opts":{"code":"β-LAC","title":"Beta-lactams"},"pos":[-1.2,0.21,2.4],"rot":[0,-20,0]},{"type":"cassette","opts":{"code":"TC","title":"Tetracyclines"},"pos":[1.8,0.21,2.2],"rot":[0,-34,0]}],1200,900,elev=22)
dr=lambda cap,t,pos: {"type":"dropper","opts":{"cap":cap,"text":t},"pos":pos}
item('ad-synth',[{"type":"kitBox","opts":{"title":"Synthetic milk","code":"AA-AD-SM"},"rot":[0,-16,0]},dr('#2C6DB5','SM',[4.4,0,2.0])])
item('ad-urea',[{"type":"kitBox","opts":{"title":"Urea in milk","code":"AA-AD-UR"},"rot":[0,-16,0]},dr('#C62828','U',[4.4,0,2.0])])
item('ad-starch',[{"type":"kitBox","opts":{"title":"Starch","code":"AA-AD-ST"},"rot":[0,-16,0]},dr('#E0A800','S',[4.4,0,2.0])])
item('ad-det',[{"type":"kitBox","opts":{"title":"Detergent","code":"AA-AD-DT"},"rot":[0,-16,0]},dr('#7B3FA0','D',[4.4,0,2.0])])
item('ad-colors',[{"type":"kitBox","opts":{"title":"Non-permitted colors","code":"AA-AD-NC"},"rot":[0,-16,0]},dr('#E2702B','NC',[4.4,0,2.0])])
item('ad-other',[dr('#C62828','U',[-2,0,0]),dr('#E0A800','S',[0,0,0.5]),dr('#7B3FA0','D',[2,0,0])])
item('cat-food-adulteration',[{"type":"kitBox","opts":{"title":"Milk adulterants","code":"AA-AD-PNL","sub":"Rapid test panel","tests":"4 x 25 tests"},"pos":[-2.4,0,-2],"rot":[0,-14,0]},dr('#C62828','U',[2.6,0,1.6]),dr('#E0A800','S',[4.6,0,1.0]),dr('#7B3FA0','D',[6.4,0,0.2]),dr('#2C6DB5','SM',[3.6,0,3.6])],1200,900,elev=18)
item('pe-multi',kit('Pesticide residues','AA-PE-MR','PEST','Multi-residue screening'))
item('pe-target',kit('OP & carbamates','AA-PE-OC','OP/C','Targeted screening'))
item('cat-pesticide-residues',kit('Pesticide residues','AA-PE-MR','PEST','Multi-residue screening'),1200,900,elev=22)
for k,t,c in [('pa-sal','Salmonella','SAL'),('pa-ecoli','E. coli','E.COLI'),('pa-lis','Listeria','LIS'),('pa-sa','S. aureus','S.AUR'),('pa-other','Pathogen panel','PATH')]:
    item(k,kit(t,'AA-PA-'+c.replace('.','')[:4],c,'Rapid test kit','25 tests'))
item('cat-foodborne-pathogens',[{"type":"kitBox","opts":{"title":"Salmonella","code":"AA-PA-SAL","tests":"25 tests"},"pos":[-4,0,-2.6],"rot":[0,-12,0]},{"type":"kitBox","opts":{"title":"Listeria","code":"AA-PA-LIS","tests":"25 tests"},"pos":[3.6,0,-3.2],"rot":[0,-24,0]},{"type":"cassette","opts":{"code":"SAL","title":"Salmonella"},"pos":[-1.2,0.21,2.4],"rot":[0,-20,0]},{"type":"cassette","opts":{"code":"LIS","title":"Listeria"},"pos":[1.8,0.21,2.2],"rot":[0,-34,0]}],1200,900,elev=22)
for k,t,c in [('al-peanut','Peanut','PNT'),('al-gluten','Gluten','GLU'),('al-milk','Milk allergen','MILK'),('al-soy','Soy','SOY'),('al-egg','Egg','EGG'),('al-other','Allergen panel','ALG')]:
    item(k,kit(t,'AA-AL-'+c,c,'Rapid test kit','20 tests'))
item('cat-food-allergens',[{"type":"kitBox","opts":{"title":"Gluten","code":"AA-AL-GLU","tests":"20 tests"},"pos":[-4,0,-2.6],"rot":[0,-12,0]},{"type":"kitBox","opts":{"title":"Peanut","code":"AA-AL-PNT","tests":"20 tests"},"pos":[3.6,0,-3.2],"rot":[0,-24,0]},{"type":"cassette","opts":{"code":"GLU","title":"Gluten"},"pos":[-1.2,0.21,2.4],"rot":[0,-20,0]},{"type":"cassette","opts":{"code":"PNT","title":"Peanut"},"pos":[1.8,0.21,2.2],"rot":[0,-34,0]}],1200,900,elev=22)
# Home hero
S['hero']=dict(w=1600,h=1100,elev=15,pad=1.12,items=[
 {"type":"kitBox","opts":{"title":"Aflatoxin B1","code":"AA-MY-AFB1"},"pos":[-3.2,0,-2.0],"rot":[0,-14,0],"scale":1.15},
 qt('#E2702B','',['EN 15662, citrate','4 g MgSO4 · 1 g NaCl'],'AA-QC-EN-50',1.9,[3.6,0,-2.8],[0,-6,0]),
 qt('#2C6DB5','',['AOAC 2007.01','6 g MgSO4 · 1.5 g NaOAc'],'AA-QC-AO-50',2.3,[6.9,0,-3.4],[0,6,0]),
 {"type":"cassette","opts":{"code":"AFB1","title":"Aflatoxin B1"},"pos":[-1.0,0.21,3.4],"rot":[0,-26,0]},
 mt('PSA',pos=[2.8,0,2.6]), mt('PSA/GCB','#F2F2EE',0xf3f3f0,{"h":0.22,"color":0x2b2b2b},[4.3,0,3.0]),
 v(False,[6.0,0,2.4]), v(True,[7.5,0,1.8])])
json.dump(S,open('all.json','w'))
print(len(S))
