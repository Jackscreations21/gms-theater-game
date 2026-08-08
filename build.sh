#!/bin/sh
# Build the single-file game from src/.
# THE ORDER IS A DEPENDENCY ORDER, NOT ALPHABETICAL — see HANDOFF.md §1.
cd "$(dirname "$0")"
cat src/p1.txt  src/p2.txt  src/p2b.txt src/p2c.txt src/p2e.txt src/p2g.txt \
    src/p2h.txt src/p2f.txt src/p3.txt  src/p4.txt  src/p4c.txt src/p5.txt  src/p5e.txt \
    src/p6.txt  src/p6b.txt src/p5c.txt src/p5d.txt src/p5f.txt src/p5g.txt \
    src/p2j.txt src/p2k.txt src/p2m.txt src/p2i.txt src/p7.txt  src/p9.txt  src/pz.txt \
    > the-house.html
node -e "
const fs=require('fs');
const s=fs.readFileSync('the-house.html','utf8');
const b=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
fs.writeFileSync(require('os').tmpdir()+'/bundle.js', b);
" && node --check "${TMPDIR:-/tmp}/bundle.js" \
  && echo "built  $(wc -c < the-house.html) bytes  syntax OK"
