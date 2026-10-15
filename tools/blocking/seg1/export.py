import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)   # python -I leaves the script directory off sys.path
from lib import *
import t101, t102, t103, t104, t105, t106
for m in (t101, t102, t103, t104, t105, t106): m.build()
notes = open(os.path.join(HERE, 'notes.txt'), encoding='utf-8').read().strip()
os.makedirs(os.path.join(HERE, '..', 'segments'), exist_ok=True)
n = export(os.path.join(HERE, '..', 'segments', 'seg1.json'), notes)
print(n, 'waypoints written')
