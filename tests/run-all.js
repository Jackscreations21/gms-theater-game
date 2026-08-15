// npm test — runs all twenty-one suites in HANDOFF.md §2 order, exits non-zero if any fail.
const {spawnSync} = require('child_process');
const path = require('path');
/* probe-lint goes FIRST and it is not a suite: it sweeps the suites themselves
   for the three characters that break a probe template.  All three die at parse
   or eval time pointing somewhere unrelated, so a five-second sweep before
   anything boots saves the round-trip TRAPS has recorded four times. */
const suites = ['probe-lint','real','full14','rooms','holes','crew','smoke','show','sets','arc','studios','stages','legs','warehouse','orders','build','vr','carp','workshop','beetlejuice','artnet'];
const failed = [];
for(const s of suites){
  console.log('\n===== '+s+'.js =====');
  const r = spawnSync(process.execPath, [path.join(__dirname, s+'.js')], {stdio:'inherit'});
  if(r.status !== 0) failed.push(s);
}
console.log('\n===== '+(suites.length-failed.length)+'/'+suites.length+' suites passed'
  + (failed.length ? ' — FAILED: '+failed.join(', ') : '')+' =====');
process.exit(failed.length ? 1 : 0);
