import json,os,re,collections,html
D=os.path.dirname(os.path.abspath(__file__))
d=json.load(open(os.path.join(D,'dump.json'),encoding='utf8'))
CIR='①②③④⑤⑥⑦⑧⑨'
def area(n):
    if not n: return ''
    first=re.split(r'[|,]',n)[0]  # multi-area names: use the first listed
    s=re.sub(r'\s+','',first)
    rules=[('국제인도법','국제인도법'),('국제적십자','국제적십자규약'),('규약','국제적십자규약'),('인사관리','인사관리시행규칙'),('보수','보수운영규정'),('감사','감사운영규정'),('재무','재무규정'),('여비','여비규정'),('운영규정','운영규정'),('직원','운영규정'),('조직법','조직법'),('정관','정관'),('유관법령','유관법령')]
    for k,v in rules:
        if k in s: return v
    return n
def esc(t):
    if not t: return ''
    return html.escape(t,quote=False).replace('\r\n','\n').replace('\n','<br>')
anoms=[];extra=collections.Counter();extrav=collections.defaultdict(list)
areamap=collections.Counter();areares={}
index=[];allitems=[];sizes=[]
os.makedirs(os.path.join(D,'site/data/quiz'),exist_ok=True)
groups=[('past',p,'past-%02d'%(i+1)) for i,p in enumerate(d['past'])]+[('senior',p,'sen-%03d'%(i+1)) for i,p in enumerate(d['senior'])]
KNOWN=('questionNumber','regulationName','questionType','questionTitle','answer','choices','explanation','questionContent')
for kind,p,gid in groups:
    items=[];seen=set()
    for i,q in enumerate(p['questions'],1):
        k={'multiple-choice':'mc','ox':'ox','short-answer':'sa'}[q['questionType']]
        for f in q:
            if f not in KNOWN:
                extra[f]+=1
                if len(extrav[f])<3: extrav[f].append(q[f])
        if q['questionNumber'] in seen: anoms.append('%s #%d: duplicate questionNumber %s'%(gid,i,q['questionNumber']))
        seen.add(q['questionNumber'])
        if not q['questionTitle'].strip(): anoms.append('%s #%d: empty title'%(gid,i))
        parts=[q['questionTitle']]
        if q.get('questionContent'): parts.append(q['questionContent'])
        ch=q.get('choices') or []
        if k=='mc':
            if not ch: anoms.append('%s #%d: mc without choices (answer "%s")'%(gid,i,q['answer']))
            if len(ch)>6: anoms.append('%s #%d: mc >6 choices'%(gid,i))
            for j,c in enumerate(ch): parts.append(CIR[j]+' '+c)
        qt='\n'.join(parts)
        raw=q['answer'].strip()
        if k=='mc':
            if re.fullmatch(r'\d+(\s*,\s*\d+)*',raw):
                ds=[int(x) for x in re.findall(r'\d+',raw)]
                if any(x<1 or x>9 for x in ds):
                    a=raw;anoms.append('%s #%d: mc answer digit out of 1-9 "%s" kept raw'%(gid,i,raw))
                else:
                    a=''.join(CIR[x-1] for x in ds)
                    if any(x>len(ch) for x in ds): anoms.append('%s #%d: mc answer "%s" exceeds choices count %d'%(gid,i,raw,len(ch)))
                    if len(set(ds))!=len(ds): anoms.append('%s #%d: mc answer "%s" repeated digits (kept, order preserved)'%(gid,i,raw))
            else:
                a=raw
                anoms.append('%s #%d: mc answer unparseable "%s" kept raw'%(gid,i,raw[:60]) if raw else '%s #%d: mc answer EMPTY'%(gid,i))
        elif k=='ox':
            a=raw
            if a not in('O','X'): anoms.append('%s #%d: ox answer "%s"'%(gid,i,a))
        else: a=q['answer']
        rn=q.get('regulationName','') or ''
        ar=area(rn);areamap[rn]+=1;areares[rn]=ar
        items.append({'id':'%s-%d'%(gid,i),'grp':gid,'no':i,'kind':k,'area':ar,'q':qt,'a':a,'ex':esc(q.get('explanation') or '')})
    fn='site/data/quiz/%s.json'%gid
    open(os.path.join(D,fn),'w',encoding='utf8').write(json.dumps({'id':gid,'name':p['packageName'],'kind':kind,'items':items},ensure_ascii=False,separators=(',',':')))
    sizes.append((fn,os.path.getsize(os.path.join(D,fn))))
    ty=collections.Counter(x['kind'] for x in items);ac=collections.Counter(x['area'] for x in items)
    index.append({'id':gid,'name':p['packageName'],'kind':kind,'count':len(items),'file':fn,'types':{x:ty.get(x,0) for x in('mc','ox','sa')},'areas':dict(ac)})
    allitems+=items
    if len(items)!=len(p['questions']): anoms.append('%s: count mismatch'%gid)
open(os.path.join(D,'site/quizindex.json'),'w',encoding='utf8').write(json.dumps(index,ensure_ascii=False,separators=(',',':')))
pres=sum(len(re.sub(r'(?m)^[①-⑨] ','',x['q']).replace('\n','')) for x in allitems)
srcn=0
for kind,p,gid in groups:
    for q in p['questions']:
        srcn+=len(q['questionTitle'].replace('\n',''))+len((q.get('questionContent') or '').replace('\n',''))
        if q['questionType']=='multiple-choice': srcn+=sum(len(c.replace('\n','')) for c in (q.get('choices') or []))
ids=[x['id'] for x in allitems]
kc=collections.Counter(x['kind'] for x in allitems)
qc=collections.Counter(x['q'] for x in allitems)
dupq=sum(v for v in qc.values() if v>1)
dupgrp={}
for g in set(x['grp'] for x in allitems):
    c=collections.Counter(x['q'] for x in allitems if x['grp']==g)
    n=sum(v for v in c.values() if v>1)
    if n: dupgrp[g]=n
contra=[]
for x in allitems:
    if x['kind']=='mc':
        m=re.search(r'정답은?\s*([①-⑨])',x['ex'])
        if m and m.group(1) not in x['a']: contra.append(x['id'])
L=[];A=L.append
A('# Quiz conversion report\n')
A('- senior: %d questions in %d packages; past: %d in %d'%(sum(len(p['questions']) for p in d['senior']),len(d['senior']),sum(len(p['questions']) for p in d['past']),len(d['past'])))
A('- per-package counts match source (no mismatch anomalies listed below if OK)')
A('- converted items: %d; unique ids: %d (all unique: %s)'%(len(allitems),len(set(ids)),len(set(ids))==len(ids)))
A('- kinds: %s'%dict(kc))
A('- answer encoding (source): mc = digit string "3" or "1, 3" (1-based), converted to circled digits in the given order (not sorted); ox = already exactly "O"/"X"; sa unchanged. Unparseable mc answers (empty / letter-labelled) are kept raw.')
A('- text preservation: source chars (title+content+choices, newlines removed) = %d; converted q chars after removing circled markers/newlines = %d; equal: %s'%(srcn,pres,srcn==pres))
A('- extra fields: %s; examples: %s'%(dict(extra),json.dumps(extrav,ensure_ascii=False)))
A('- questions whose q equals another question q: %d (distinct duplicated texts: %d); within-group dup counts: %s'%(dupq,sum(1 for v in qc.values() if v>1),json.dumps(dupgrp,ensure_ascii=False)))
A('- mc explanations stating "정답 N" that disagree with answer: %s (%d)'%(contra[:30],len(contra)))
A('\n## Anomalies (%d)\n'%len(anoms))
for a in anoms: A('- '+a)
A('\n## regulationName -> area\n\n| raw | count | area |\n|---|---|---|')
for n,c in areamap.most_common(): A('| %r | %d | %r |'%(n,c,areares[n]))
A('\n## File sizes (KB)\n')
tot=sum(s for _,s in sizes)
for f,s in sizes: A('- %s: %.1f'%(f,s/1024))
A('- site/quizindex.json: %.1f'%(os.path.getsize(os.path.join(D,'site/quizindex.json'))/1024))
A('\nTotal group data: %.1f KB. Largest 5: '%(tot/1024)+', '.join('%s %.1fKB'%(f.split('/')[-1],s/1024) for f,s in sorted(sizes,key=lambda x:-x[1])[:5]))
A('\n## Samples\n')
for k in('mc','ox','sa'):
    for x in [y for y in allitems if y['kind']==k][100:103]:
        A('```json\n'+json.dumps(x,ensure_ascii=False)+'\n```')
open(os.path.join(D,'REPORT.md'),'w',encoding='utf8').write('\n'.join(L))
