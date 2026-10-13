import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalize,run,hash } from './update.mjs';
const record={id:'a',date:'2026-10-13',title:'기록',summary:'근거',category:'자기조절력',source:'test'};
test('deterministic order and validation',()=>{
 const b={...record,id:'b'};
 assert.equal(normalize({schemaVersion:1,records:[b,record]}),normalize({schemaVersion:1,records:[record,b]}));
 assert.throws(()=>normalize({schemaVersion:1,records:[record,record]}));
 assert.throws(()=>normalize({schemaVersion:1,records:[{...record,date:'2026-02-30'}]}));
});
test('approval binds exact proposal and stale base is rejected',()=>{
 mkdirSync('work',{recursive:true});
 const root=mkdtempSync(join(process.cwd(),'work','ritual-test-'));
 for(const d of ['data','public/documents'])mkdirSync(join(root,d),{recursive:true});
 const empty='{"schemaVersion":1,"records":[]}\n';writeFileSync(join(root,'data/records.json'),empty);
 const next=normalize({schemaVersion:1,records:[record]});
 const proposal={version:1,baseHash:hash(empty),sourceHash:'test',next,sourceFile:'test'};
 const path=join(root,'proposal.json');writeFileSync(path,JSON.stringify(proposal));
 assert.throws(()=>run(['apply',path],root),/승인/);
 run(['approve',path,'--reviewer','owner','--confirm-public'],root);
 writeFileSync(join(root,'data/records.json'),'changed');
 assert.throws(()=>run(['apply',path],root),/기준/);
 writeFileSync(join(root,'data/records.json'),empty);
 run(['apply',path],root);
 assert.equal(readFileSync(join(root,'data/records.json'),'utf8'),next);
 assert.equal(readFileSync(join(root,'public/documents/records.json'),'utf8'),next);
});
