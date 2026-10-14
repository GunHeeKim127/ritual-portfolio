import {readFileSync,writeFileSync,mkdirSync,renameSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash,normalize} from './update.mjs';
const cats=['자기조절력','대인관계력','자기동기력'];
const stable=x=>JSON.stringify(x,null,2)+'\n';
const date=x=>{if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x)||!Number.isFinite(Date.parse(x))||new Date(x).toISOString().slice(0,10)!==x)throw Error('날짜 오류');return x};
const text=x=>{if(typeof x!=='string'||!x.trim()||x.length>3000)throw Error('본문/출처 오류');return x.trim().normalize('NFC')};
const unique=(rows)=>{const ids=new Set();for(const r of rows){if(ids.has(r.id))throw Error('중복 id');ids.add(r.id)}return rows};
export function generate(input){
 const {rituals,attendance,tasks}=input;
 for(const x of [rituals,attendance,tasks])if(x.schemaVersion!==1||!Array.isArray(x.records))throw Error('입력 스키마 오류');
 if(!Array.isArray(rituals.dates))throw Error('리추얼 날짜 배열 필요');
 const dates=[...new Set(rituals.dates.map(date))].sort();
 const records=JSON.parse(normalize({schemaVersion:1,records:rituals.records})).records;
 for(const r of records)if(!dates.includes(r.date))throw Error('장면 날짜가 기록일 목록에 없음');
 const week=d=>{const x=new Date(d);x.setUTCDate(x.getUTCDate()-(x.getUTCDay()+6)%7);return x.toISOString().slice(0,10)};
 const parse=(data,statuses)=>{
  if(typeof data.available!=='boolean')throw Error('available 필요');text(data.source);
  if(!data.available&&data.records.length)throw Error('미확보 자료에는 기록을 넣을 수 없음');
  return unique(data.records.map(r=>{if(!statuses.includes(r.status))throw Error('상태 오류');return {id:text(r.id),date:date(r.date),status:r.status,source:text(r.source)}}));
 };
 const att=parse(attendance,['present','absent']), todo=parse(tasks,['submitted','pending']);
 if(new Set(att.map(r=>r.date)).size!==att.length)throw Error('중복 출석 날짜');
 const candidates=records.map(r=>{const original=rituals.records.find(x=>x.id===r.id);const action=text(original.action),result=text(original.result),situation=text(original.situation);const paragraph=`${r.date}, ${situation} 상황에서 ${action} ${result}`;return {id:hash(stable({date:r.date,category:r.category,paragraph,source:r.source})),date:r.date,category:r.category,paragraph,source:r.source}});
 return {schemaVersion:1,metrics:{ritualDays:dates.length,ritualWeeks:new Set(dates.map(week)).size,firstDate:dates[0]||null,lastDate:dates.at(-1)||null,attendance:attendance.available?att.filter(x=>x.status==='present').length:null,attendanceTotal:attendance.available?att.length:null,submitted:tasks.available?todo.filter(x=>x.status==='submitted').length:null,taskTotal:tasks.available?todo.length:null},sources:{rituals:text(rituals.source),attendance:text(attendance.source),tasks:text(tasks.source)},records,candidates,approvedParagraphs:[]};
}
export function run(args,root=resolve(dirname(fileURLToPath(import.meta.url)),'..')){
 const [command,path,...rest]=args, dir=resolve(root,'updates/refresh');mkdirSync(dir,{recursive:true});
 const current=resolve(root,'data/generated.json');const base=()=>hash(readFileSync(current,'utf8'));
 const atomic=(p,s)=>{mkdirSync(dirname(p),{recursive:true});writeFileSync(p+'.tmp',s);renameSync(p+'.tmp',p)};
 const read=p=>JSON.parse(readFileSync(p,'utf8'));
 if(command==='generate'){
  if(!path)throw Error('입력 폴더 필요');const folder=resolve(path);const input={rituals:read(resolve(folder,'rituals.json')),attendance:read(resolve(folder,'attendance.json')),tasks:read(resolve(folder,'tasks.json'))};
  const output=generate(input),proposal={schemaVersion:1,baseHash:base(),output};const id=hash(stable(proposal));atomic(resolve(dir,id+'.json'),stable(proposal));
  atomic(resolve(dir,id+'.review.md'),`# 숫자와 문단 후보 검토\n\n제안 ${id}\n\n${stable(output.metrics)}\n\n`+output.candidates.map(c=>`## ${c.category} ${c.date}\n\nID: ${c.id}\n\n${c.paragraph}\n\n근거: ${c.source}\n`).join('\n'));
  console.log('제안:',resolve(dir,id+'.json'));return id;
 }
 if(!path)throw Error('제안 파일 필요');const proposal=read(resolve(path)),id=hash(stable(proposal)),approval=resolve(dir,id+'.approval.json');
 if(proposal.baseHash!==base())throw Error('기준 변경: 다시 생성');
 if(command==='approve'){
  const at=rest.indexOf('--candidates');const value=at>=0?rest[at+1]:undefined;
  if(!rest.includes('--confirm-public')||value===undefined)throw Error('--candidates ID,ID (또는 none) --confirm-public 필요');
  const ids=value==='none'?[]:value.split(',');if(new Set(ids).size!==ids.length||ids.some(x=>!proposal.output.candidates.some(c=>c.id===x)))throw Error('후보 ID 오류');
  atomic(approval,stable({proposalHash:id,candidateIds:ids.sort()}));console.log('승인 저장');return;
 }
 if(command==='apply'){
  if(!existsSync(approval))throw Error('승인 없음');const approved=read(approval);if(approved.proposalHash!==id)throw Error('승인 불일치');
  const output={...proposal.output,approvedParagraphs:proposal.output.candidates.filter(c=>approved.candidateIds.includes(c.id))};
  // Candidates are private review material; only selected paragraphs are published.
  delete output.candidates;
  atomic(resolve(dir,id+'.backup.json'),readFileSync(current,'utf8'));
  atomic(resolve(root,'public/documents/latest-result.json'),stable(output));
  atomic(resolve(root,'public/documents/records.json'),normalize({schemaVersion:1,records:output.records}));
  atomic(resolve(root,'data/records.json'),normalize({schemaVersion:1,records:output.records}));
  atomic(current,stable(output));console.log('숫자와 승인 문단 반영 완료');return;
 }
 throw Error('generate / approve / apply 필요');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{run(process.argv.slice(2))}catch(e){console.error(e.message);process.exitCode=1}}
