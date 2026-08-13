/* PROBE LINT — the five-second check TRAPS.md asks for and nobody runs.

   Every suite in here builds a PROBE as one template literal and evals it inside
   the page.  Three characters break that, and all three have bitten more than
   once, and all three die at PARSE or EVAL time pointing somewhere unrelated:

     a backtick anywhere, INCLUDING IN A COMMENT, closes the template early
     a SINGLY-escaped quote is eaten by the template and arrives unescaped

   TRAPS records the backtick twice and says "sweep for it mechanically rather
   than trusting care".  This is the sweep.  It is not a test of the game; it is
   a test of the tests, so it lives here and runs with them.

   TWO THINGS IT DELIBERATELY DOES NOT FLAG, because both are correct and both
   turned up on the first run:

     a DOUBLED escape (backslash backslash quote) is the fix, not the fault —
     it survives the template and arrives as a proper escape;
     an interpolation is a feature.  build.js and carp.js inject values into
     their probes on purpose, and a lint that called those faults would be
     noise, which is how a lint stops being run.

   usage: node probe-lint.js        (exits non-zero on a finding)
*/
const fs = require('fs'), path = require('path');

const FILES = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && f !== 'probe-lint.js' && f !== 'run-all.js');

let bad = 0, swept = 0;
for(const f of FILES){
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8').split('\n');
  /* the probe is delimited by a line that opens a template and a line that
     closes it.  Find every such region rather than assuming there is one. */
  let inProbe = false, opened = 0;
  for(let i = 0; i < src.length; i++){
    const line = src[i];
    if(!inProbe){
      if(/^\s*const\s+\w*[Pp]robe\w*\s*=\s*`/.test(line)){ inProbe = true; opened = i + 1; swept++; }
      continue;
    }
    if(/^`;\s*$/.test(line)){ inProbe = false; continue; }
    const hits = [];
    if(line.indexOf('`') >= 0) hits.push('a backtick');
    /* a SINGLE backslash before a quote.  The doubled form is correct, so the
       test is "an odd number of backslashes", which for real code means: not
       preceded by another backslash. */
    if(/(^|[^\\])\\'/.test(line)) hits.push('a singly-escaped quote');
    if(hits.length){
      bad++;
      console.log(f + ':' + (i + 1) + '  ' + hits.join(' and ') + '\n    ' + line.trim().slice(0, 110));
    }
  }
  if(inProbe) console.log(f + ':' + opened + '  a probe template is never closed — the sweep may be short');
}
console.log('--- probe lint: ' + swept + ' probe region(s) swept, ' + bad + ' finding(s) ---');
process.exit(bad ? 1 : 0);
