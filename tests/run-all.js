// npm test — runs all seventeen suites in HANDOFF.md §2 order, exits non-zero if any fail.
const {spawnSync} = require('child_process');
const path = require('path');
const suites = ['real','full14','rooms','holes','crew','smoke','show','sets','arc','stages','legs','warehouse','orders','build','vr','carp','workshop'];
const failed = [];
for(const s of suites){
  console.log('\n===== '+s+'.js =====');
  const r = spawnSync(process.execPath, [path.join(__dirname, s+'.js')], {stdio:'inherit'});
  if(r.status !== 0) failed.push(s);
}
console.log('\n===== '+(suites.length-failed.length)+'/'+suites.length+' suites passed'
  + (failed.length ? ' — FAILED: '+failed.join(', ') : '')+' =====');
process.exit(failed.length ? 1 : 0);
