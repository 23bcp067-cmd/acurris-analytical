from PIL import Image
import glob,os
out='/home/claude/site/src/assets/img/products/'
for f in sorted(glob.glob('*.png')):
    n=f[:-4]
    if n.startswith('t-'): continue
    im=Image.open(f).convert('RGBA')
    bb=im.split()[3].point(lambda v:255 if v>6 else 0).getbbox()
    crop=im.crop(bb)
    ratio=(1600/1100) if n=='hero' else 4/3
    pad=0.04 if n=='hero' else 0.07
    cw,ch=crop.size
    W=int(max(cw*(1+2*pad), ch*(1+2*pad)*ratio)); H=int(W/ratio)
    canvas=Image.new('RGBA',(W,H),(0,0,0,0)); canvas.paste(crop,((W-cw)//2,(H-ch)//2))
    sizes={'hero':[('l',1600),('m',800)]}.get(n, [('l',1200),('m',600),('s',128)] if n.startswith('cat-') else [('m',600),('s',128)])
    for suf,w in sizes:
        h=round(H*w/W); canvas.resize((w,h),Image.LANCZOS).save(f'{out}{n}-{suf}.webp','WEBP',quality=80,method=3)
    print(n,flush=True)
print('done')
