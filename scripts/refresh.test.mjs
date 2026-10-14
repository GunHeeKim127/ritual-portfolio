import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {generate,run} from './refresh.mjs';
const entry={id:'r1',date:'2026-08-27',title:'검증용 재시도',summary:'가상 기록',category:'자기동기력',source:'test',situation:'실습 오류',action:'다시 시도했다.',result:'검증용 결과'};
const input={rituals:{schemaVersion:1,source:'test',dates:['2026-08-27','2026-08-27'],records:[entry]},attendance:{schemaVersion:1,available:true,source:'출석 검증용',records:[{id:'a1',date:'2026-08-27',status:'present',source:'test'}]},tasks:{schemaVersion:1,available:true,source:'제출 검증용',records:[{id:'t1',date:'2026-08-27',status:'submitted',source:'test'}]}};
test('counts are deduplicated and missing sources stay unknown',()=>{const x=generate(input);assert.equal(x.metrics.ritualDays,1);assert.equal(x.metrics.attendance,1);assert.equal(x.metrics.submitted,1);assert.equal(x.candidates[0].date,entry.date);const y=structuredClone(input);y.attendance={schemaVersion:1,available:false,source:'미확보',records:[]};assert.equal(generate(y).metrics.attendance,null);assert.throws(()=>generate({...input,rituals:{...input.rituals,records:[entry,entry]}}));});
test('portable proposals and approved candidates only',()=>{
 mkdirSync('work',{recursive:true});const parent=mkdtempSync(join(process.cwd(),'work','refresh-'));const folders=['first','second'].map(n=>join(parent,n));const ids=[];
 for(const folder of folders){mkdirSync(join(folder,'data'),{recursive:true});mkdirSync(join(folder,'inputs'));writeFileSync(join(folder,'data/generated.json'),'{}\n');for(const [name,value] of Object.entries(input))writeFileSync(join(folder,'inputs',name+'.json'),JSON.stringify(value));ids.push(run(['generate',join(folder,'inputs')],folder));}
 assert.equal(ids[0],ids[1]);const root=folders[0],proposal=join(root,'updates/refresh',ids[0]+'.json');const first=readFileSync(proposal,'utf8');run(['generate',join(root,'inputs')],root);assert.equal(readFileSync(proposal,'utf8'),first);
 assert.throws(()=>run(['apply',proposal],root),/승인/);run(['approve',proposal,'--candidates','none','--confirm-public'],root);
 const modified=JSON.parse(first);modified.output.metrics.ritualDays=99;writeFileSync(proposal,JSON.stringify(modified));assert.throws(()=>run(['apply',proposal],root),/승인/);writeFileSync(proposal,first);
 run(['apply',proposal],root);const out=JSON.parse(readFileSync(join(root,'data/generated.json'),'utf8'));assert.deepEqual(out.approvedParagraphs,[]);assert.equal('candidates' in out,false);assert.equal(out.metrics.ritualDays,1);
});
