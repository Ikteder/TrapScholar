#!/usr/bin/env python3
"""Optional curated Pixel Art Atlas to TrapScholar SVG importer.

Reads only the validation split from Angais/pixel-art-atlas-1.4m. Replaces
matched 32x32 atlas slots via embedded PNG images, preserves unmatched originals,
saves a reviewable preview and provenance. Default does NOT alter game assets.
Requires: python -m pip install datasets pillow
"""
import argparse
import base64
import copy
import io
import json
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'world'
SRC='https://huggingface.co/datasets/Angais/pixel-art-atlas-1.4m'
NAMES=['relic','torch','skull','chest','crystal','mossRock','banner','book',
       'barrel','mushrooms','rune','brazier','vines','obelisk','coins','ruins']
KEYWORDS=['amethyst|magical crystal|purple crystal','torch','skull','chest',
          'crystal shard|ice crystal','mossy rock|stone','banner|flag',
          'spellbook|open book','barrel','mushroom','rune|sigil','brazier',
          'ivy|vine','obelisk|altar','coins','masonry|ruins|broken stone']
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--install',action='store_true',help='Apply reviewed preview and back up original')
    parser.add_argument('--min-matches',type=int,default=4)
    args=parser.parse_args()
    from datasets import load_dataset
    from PIL import Image
    rows=load_dataset('Angais/pixel-art-atlas-1.4m',split='validation',streaming=True)
    selected={}
    for row in rows:
        label=' '.join(str(row.get(k) or '') for k in ['caption','subject']).lower()
        for i,pattern in enumerate(KEYWORDS):
            if i in selected:continue
            if any(term in label for term in pattern.split('|')):
                img=row.get('image')
                if not isinstance(img,Image.Image) or img.size!=(16,16):continue
                if sum(a>0 for a in img.convert('RGBA').getchannel('A').getdata())<30:continue
                selected[i]=(img.convert('RGBA'),{'slot':i,'name':NAMES[i],
                  'row_id':row.get('row_id'),'caption':row.get('caption'),
                  'subject':row.get('subject')})
    source=OUT/'prop-atlas.svg'
    original=ET.parse(source)
    root=original.getroot()
    # Replace individual original icon groups, preserving all unmatched groups.
    groups=[x for x in root if x.tag==f'{{{NS}}}g']
    if len(groups)!=16:raise RuntimeError('Expected 16 original icon groups')
    for idx,(img,meta) in selected.items():
        index=list(root).index(groups[idx])
        root.remove(groups[idx])
        bio=io.BytesIO()
        img.resize((32,32),Image.Resampling.NEAREST).save(bio,format='PNG')
        node=ET.Element(f'{{{NS}}}image',{
          'x':str((idx%4)*32),'y':str((idx//4)*32),'width':'32','height':'32',
          'href':'data:image/png;base64,'+base64.b64encode(bio.getvalue()).decode('ascii')})
        root.insert(index,node)
    preview=OUT/'atlas-candidate-preview.svg'
    original.write(preview,encoding='utf-8',xml_declaration=True)
    provenance={'dataset':SRC,'split':'validation','AI_generated':True,
      'license_note':'CC0 to Angais rights only; Krea and other terms still apply',
      'selected':[meta for _,meta in selected.values()]}
    (OUT/'atlas-candidate-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    print('Preview:',preview,'matches:',len(selected),'— review visually and legally before publishing')
    if args.install:
        if len(selected)<args.min_matches:raise RuntimeError('Insufficient semantic matches')
        backup=OUT/'original-prop-atlas.svg'
        if not backup.exists():backup.write_bytes(source.read_bytes())
        source.write_bytes(preview.read_bytes())
        print('Installed reviewed selections; original backed up at',backup)

if __name__=='__main__':main()
