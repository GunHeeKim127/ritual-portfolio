import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export const hash = value => createHash('sha256').update(value).digest('hex');
export function normalize(input) {
 if(input.schemaVersion !== 1 || !Array.isArray(input.records)) throw Error('schemaVersion:1, records 배열이 필요합니다.');
 const ids=new Set();
 const records=input.records.map(r=>{
  const out={};
  for(const k of ['id','date','title','summary','category','source']) {
   if(typeof r[k]!=='string'||!r[k].trim()||r[k].length>3000) throw Error('잘못된 필드: '+k);
   out[k]=r[k].trim().normalize('NFC');
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(out.date)||!Number.isFinite(Date.parse(out.date))||new Date(out.date).toISOString().slice(0,10)!==out.date) throw Error('잘못된 날짜');
  if(ids.has(out.id)) throw Error('중복 id'); ids.add(out.id);
  if(!['자기조절력','대인관계력','자기동기력'].includes(out.category)) throw Error('허용되지 않은 분류');
  return out;
 }).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.id<b.id?-1:a.id>b.id?1:0);
 return JSON.stringify({schemaVersion:1,records},null,2)+'\n';
}
export function run(args,root=resolve(dirname(fileURLToPath(import.meta.url)),'..')) {
 const [command,file,...rest]=args;
 const data=resolve(root,'data/records.json'), pub=resolve(root,'public/documents/records.json'), dir=resolve(root,'updates');
 const current=()=>readFileSync(data,'utf8');
 const read=p=>JSON.parse(readFileSync(p,'utf8'));
 const atomic=(p,s)=>{writeFileSync(p+'.tmp',s);renameSync(p+'.tmp',p)};
 mkdirSync(dir,{recursive:true});
 if(command==='propose') {
  if(!file) throw Error('원본 JSON 경로가 필요합니다.');
  const raw=readFileSync(resolve(file),'utf8'), next=normalize(JSON.parse(raw));
  const proposal={version:1,baseHash:hash(current()),sourceHash:hash(raw),next};
  const id=hash(JSON.stringify(proposal)); const path=resolve(dir,id+'.json');
  atomic(path,JSON.stringify(proposal,null,2)+'\n');
  const before=read(data).records, after=JSON.parse(next).records;
  const removed=before.filter(r=>!after.some(n=>n.id===r.id)).map(r=>r.id);
  const added=after.filter(r=>!before.some(n=>n.id===r.id)).map(r=>r.id);
  const changed=after.filter(r=>before.some(n=>n.id===r.id&&JSON.stringify(n)!==JSON.stringify(r))).map(r=>r.id);
  atomic(resolve(dir,id+'.review.md'),`# 공개 기록 변경 검토\n\n제안 ID: ${id}\n\n추가: ${added.join(', ')||'없음'}\n변경: ${changed.join(', ')||'없음'}\n삭제: ${removed.join(', ')||'없음'}\n\n전체 교체 방식입니다. 모든 본문 및 개인정보를 검토한 다음에만 승인하세요.\n\n새 공개 데이터:\n\n\`\`\`json\n${next}\`\`\`\n`);
  console.log('제안 생성:',path,'\n검토 문서:',resolve(dir,id+'.review.md')); return;
 }
 if(!file) throw Error('제안 파일 경로가 필요합니다.');
 const proposalPath=resolve(file), proposal=read(proposalPath), id=hash(JSON.stringify(proposal));
 if(proposal.baseHash!==hash(current())) throw Error('기준 데이터가 변경되었습니다. 다시 제안하세요.');
 if(normalize(JSON.parse(proposal.next))!==proposal.next) throw Error('제안 데이터가 정규화되지 않았습니다.');
 const approval=resolve(dir,id+'.approval.json');
 if(command==='approve') {
  const at=rest.indexOf('--reviewer'), reviewer=rest[at+1];
  if(!rest.includes('--confirm-public')||at<0||!reviewer?.trim()) throw Error('--reviewer 이름 --confirm-public 필요. 전체 내용의 공개를 검토한 경우만 실행하세요.');
  atomic(approval,JSON.stringify({proposalHash:id,reviewer,approvedAt:new Date().toISOString()},null,2)+'\n'); console.log('승인 저장:',approval);return;
 }
 if(command==='apply') {
  if(!existsSync(approval)||read(approval).proposalHash!==id) throw Error('이 제안에 대한 승인이 없습니다.');
  atomic(resolve(dir,id+'.backup.json'),current());
  // Public artifact first: if interrupted, rerun while base still matches.
  atomic(pub,proposal.next); atomic(data,proposal.next);
  atomic(resolve(dir,id+'.applied.json'),JSON.stringify({proposalHash:id,resultHash:hash(proposal.next)},null,2)+'\n');
  console.log('승인된 공개 데이터 반영 완료. npm run build 후 Git diff를 검토하세요.');return;
 }
 throw Error('propose / approve / apply 중 하나를 사용하세요.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {try {run(process.argv.slice(2))}catch(e){console.error(e.message);process.exitCode=1}}
