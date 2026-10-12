# How Hamilton is lit — Howell Binkley's style, in depth

What this project learned about the lighting of the original Broadway production of *Hamilton* (Richard Rodgers
Theatre, 2015; the same production filmed for Disney+ in 2020), from three kinds of evidence:

- **The show file itself.** ETC's *Hamilton Programming Project* ships the real Eos show file of a *Hamilton* tour,
  with 124 of Binkley's real cues, his groups, presets and palettes, and his cue photos (`assets/hamilton-eos.json`,
  `docs/hamilton-cues-format.md`). This is the hardest evidence there is: it is how the cues are actually built.
- **What the creatives and the trade press wrote.** Binkley, his associate Ryan O'Gara, programmer David Arch, set
  designer David Korins, choreographer Andy Blankenbuehler, sound designer Nevin Steinberg, the stage manager, and the
  long features in *Lighting & Sound America* (October 2015) and *Live Design* (October 2015).
- **Pictures.** About 120 production images: the Disney+ press stills, per-song film frames, and Joan Marcus's Broadway
  production photos.

Confidence is marked where it matters:
- **[file]**: from the Eos data.
- **[A]**: a creative's own words.
- **[B]**: trade press or a critic.
- **[pic]**: seen in photographs.
- **[inferred]**: our reading.

Film frames are colour-graded and exposed for camera, so they look darker and more saturated than the stage does from a
seat. Read "dark" in them as "low level, high contrast", not black.

---

## 1. The idea in one paragraph

The show's resting state is **sepia and warm tungsten**: the company wears white and parchment, so Binkley kept the base
world warm and plain to leave himself somewhere to go **[A]**. Colour is **saved** and spent song by song: each number
gets its own quality and texture of light, **following the mood of the song rather than a colour per character [A]**. The
light **sculpts** bodies out of a busy, permanently visible set. It does this with sidelight and steep downlight more than
front light, and isolates principals with precision while the watching company is kept dim **[A][B][pic]**. It is cued
like rock and roll, with hits, bumps and sweeps on the music, many fired by MIDI straight from the sound desk. But it
changes with the patience of a sunset when the song wants intimacy **[A]**. The rig itself is meant to be seen, like a
concert **[A]**.

---

## 2. The team and the rig

- **Design:** Howell Binkley, LD (Tony Award 2016). Ryan O'Gara, associate. Amanda Zieve and Naftali Wayne, assistants.
- **Programming:** David Arch, on Eos. PRG supplied the rig **[A][file]**.

### Broadway, 2015 (Live Design gear list; LSA counts agree) [A/B]

| Job | Units |
|---|---|
| Spots / specials / templates | 35 Martin MAC Viper Performance. They replaced small MAC Auras used at the Public, because the trim rose from about 17 ft to 24–25 ft. |
| LED wash | 26 GLP impression X4 XL, 7–50° zoom, with concentric rings |
| Wash FX | 7 Vari-Lite VL3500Q Wash FX |
| Iris specials | 7 Source Four Revolutions |
| Downlight and diagonals | about 400 Source Fours (19° to 70°), 44 Source Four PAR VNSP, 52 PAR64 VNSP |
| Set uplight | LED ColorBlast / ColorBlaze strips uplighting the columns and the back wall |
| LED sidelight | ELAR 108 PARs, PixelPars |
| Little sources | MR16 Birdies, Stik-Ups, Mini-10s |
| Followspots | 3 Lycian 1290s |
| Haze | MDG Atmosphere hazers, a very fine haze, never visible clouds from the wings |
| Practicals | wireless dimming for ball candles, flown lanterns, the tavern chandelier and the street lampposts |

### Positions [A/B/file]

- **Electrics:** pipes over the stage, and separate pipes for the moving lights. A front-of-house truss, an apron
  electric and a FOH electric.
- **Booms:** booms in the wings and ladders.
- **Under the gallery:** units hidden under the set's balconies. Binkley and Korins had to find this real estate.
- **Act 2:** extra positions, because the half-built brick wall grows about 8 ft at intermission and Act 2 needs light
  higher up.

### The tour rig in the show file [file]

This is what our 313-unit rig is built from (`assets/hamilton-rig.json`): 41 Vipers, 24 X4s, 6 VL3500s, 96 Source Fours,
30 Source Four LED Lustrs, 48 ColorBlaze-48s, 7 ColorBlaze-72s, 12 PAR64s, 9 Source Four PARs, 9 ColorSource PARs,
11 ColorBlasts, 10 Birdies, 4 Mini-10s, 3 Lycians and 3 hazers.

The tour swaps in Lustrs for some conventionals, but the language is the same.

### Size

- Broadway runs about **850 light cues**.
- The stage manager calls **over 1,300 light and turntable cues** a show **[A/B]**.
- The tour file's cue numbers run 0.5 → 1271, consistent with that **[file]**.

---

## 3. The palette

### What the gels are [file]

The show file's colour palettes are named gels and colour temperatures, which is the plainest statement of his palette:

| Family | Gels in the file |
|---|---|
| **Warm / candle** | R01 Light Bastard Amber, R09 Pale Amber Gold, R15 Deep Straw, R312 Canary, R318 Mayan Sun, R23 Orange, Lee 204 Full CTO, "Rust" |
| **Red** | R26 Light Red (battle red) |
| **Pink / lavender** | R33 No Color Pink, R56 Gypsy Lavender, R57 Lavender, Lee 128 Bright Pink |
| **Blue** | R59 Indigo, R68 Sky Blue, R69 Brilliant Blue, R80 Primary Blue, Lee 161 Slate Blue, Lee 201 Full CTB, Lee 202 Half CTB |
| **Sea / green-blue** | R73 Peacock Blue, R77 Green Blue, Lee 116 Medium Blue-Green, Lee 124 Dark Green |
| **White** | colour-temperature palettes 5600 K, 4600, 4150, 3750, 3200, 2700 — whites chosen by temperature, not "open" |
| **LED primaries** | RED / GREEN / BLUE / WHITE LED palettes for the colour-mixing units |

The fixed-colour conventionals are mostly **R01** (Light Bastard Amber, 41 Source Fours and the Source Four PARs) and
**R23** (Orange, 20 Source Fours and the PAR64s). Some carry **R32** Medium Salmon Pink, **R40** Light Salmon,
**L114** Hamburg Frost (diffusion), and **L161 / L182** for a few specials. Almost every fixed unit is warm. **The cool
colours come from the movers and LEDs**, which is how the warm base stays warm and the colour stays *spent*, not
spread **[file]**.

### What the colours mean on stage [A/B/pic]

| World | Light |
|---|---|
| **Public, day, the tavern, ensemble numbers** | warm amber general: golden deck, warm brick, gallery lit, principals in a warm-white key. Often one or two cool accents high on the wall. |
| **Night, grief, intimacy** | deep saturated blue on everything, cool-white keys, very low. **Eliza's world** (Helpless, That Would Be Enough, Burn, It's Quiet Uptown, the finale) is blue, with candles and lanterns as the only warm light. |
| **Battle** | **red is for battle** **[A]**, and red is rare. Seen: Washington on Your Side's red deck, red-amber for "the world turned upside down", and the red disc of the slow-motion bullet in The World Was Wide Enough **[pic]**. |
| **Hurricane** | blue-green, turquoise and yellow **[A]**. |
| **Jefferson and Madison** | lavender-blue (What'd I Miss) and navy for the cabinet battles **[pic]**. Jefferson's coat is magenta velvet; Tazewell tuned costume colours knowing Binkley would add colour **[A]**. |
| **King George** | one bright white or warm special, the stage dark, blue on the wall behind **[A][pic]**. In What Comes Next, his stomp snaps the light from red to blue (two independent sources) **[B]**. |
| **The last image of the show** | a lavender-magenta wash, not white **[pic]**. |

**Say No to This is not a red wash** **[pic]**. It is saturated cyan-blue rim light with magenta and warm faces; only
Maria's dress is red. "Red equals seduction" is the obvious guess, and the pictures say otherwise.

---

## 4. The look-book: the recurring looks

1. **Warm amber general.** Public and ensemble numbers: Farmer Refuted, A Winter's Ball, Ten Duel Commandments, We Know,
   The Election of 1800, Blow Us All Away, the tavern in My Shot **[pic]**.
2. **Warm floor and cool shafts.** The big company moments: warm amber front and side on the company, plus 3–12
   steel-blue or cool-white beams from overhead in haze. Seen in My Shot, The Schuyler Sisters, the fan of about 12 beams
   in Guns and Ships, the soldiers-on-boxes tableau and the opening **[pic]**.
3. **The single shaft.** One narrow cool beam straight down onto a principal, the rest dim. Seen on Hamilton's "my name"
   moment in the opening, Burr in Wait for It (a deep-blue column), Burr in The Room Where It Happens (cyan) and Eliza
   in the finale **[pic]**.
4. **The deep-blue world.** Seen in Helpless, the Story of Tonight reprise, That Would Be Enough, Wait for It,
   Hurricane, Burn, Stay Alive (Reprise), It's Quiet Uptown and the end of The World Was Wide Enough **[pic]**.
5. **Separate pools on a dark deck.** Isolation is done with several round pools, not one big special: Dear Theodosia's
   two warm pools; Yorktown's battle with 8–10 small warm-white pools and blue brick; Your Obedient Servant's one desk
   pool; a second dim pool on a watcher in Wait for It **[pic]**. **Yorktown ends with each soldier isolated in his own
   pool** **[A/B]**.
6. **The King.** A tight, hard-edged Viper special on a fairly dark stage **[A][pic]**.
7. **Sculpted white.** Heavily shaped white looks set against bursts of saturated colour **[B]**.
8. **The kaleidoscope.** Geometric forms and jewel-toned patterns laid on the turntable, framed in white, circular
   patterns that mesh with the revolve **[B]**.

---

## 5. How he uses the space

- **The brick wall is a coloured surface, and the fastest read of the scene** **[pic]**:
  - warm amber or orange for day, interiors and public scenes;
  - deep blue for night and grief;
  - red-orange in strips or patches for dawn (Best of Wives, the left side of Dear Theodosia);
  - blue-violet for One Last Time.

  It is often **split**, warm on one side and blue on the other: Dear Theodosia, the Washington–Hamilton handshake.
  The show file's systems for this are the **WALL SCRAPES** (21 units grazing the brick), **WIPE COLUMNS** (28),
  **US WALL PARS**, the **Column Birdies**, the **LED Foots** and the column and back-wall uplights **[file]**.
- **The deck carries texture.** A warm amber breakup gobo on the turntable is common; so are hard angular "window" or
  "shard" patterns (lavender and amber in The Room Where It Happens, amber and rose in the finale) **[pic]**. The tour
  file's gobo palettes name what is loaded: Construction, Linear, Dust, Cobble stone, Alpha, Vignette, Nite sky, Brains,
  Pebbles, Blocks, Pickup sticks **[file]**. Binkley's signature gobo is Rosco R77760 "Internal Reflections", renamed
  "Binkley Reflections" after his death. His electricians kept stacks of it for his shows; exactly where Hamilton uses it
  is not documented **[A]**.
- **The turntable is framed.** The presets name rings and paths (RING 1, NEW RINGS, inner temps, Outer Temps, turntables
  1, T/table B/up, circle down, circle flip, cntr path, path 1, Outside inside paths) **[file]**. The double turntable is
  an inner disc and an independent outer ring. Blankenbuehler reads counterclockwise as time passing and clockwise as
  resisting fate **[A]**.
- **The gallery is working space**, lit as a place to stand. Lustrs on the 2nd level, units under the balconies. The
  watching company up there is kept dim **[A][file]**.
- **Practicals carry scenes:**
  - the tavern chandelier flies in;
  - lampposts ride the turntable for the New York streets;
  - the Winter's Ball brings four wagons of electrified candles and a star-field of flown lanterns;
  - floor candles at the wedding;
  - Eliza's lantern in Burn;
  - a lit window in Take a Break.

  In the blue scenes they are often the only warm light **[A][pic]**. The show file's groups: LAMPOSTS, FLYING LANTERNS,
  SCENIC LANTERNS, HANDHELD LANTERNS, CANDLE SHELVES, RUNNING LIGHTS **[file]**.
- **The rig is in the picture.** In wide shots a row of low-glowing amber lamp faces on the overhead pipe stays visible
  even in blue scenes, with saturated beams coming down out of the same pipe **[pic]**.

---

## 6. How the rig is organised: his systems [file]

Binkley's group names describe a classic, very complete system design, each system in zones (DS, MS, US, UUS; SL, CL, C,
CR, SR):

- **CLEAR TEMP DOWN** (`ALL CLEAR TEMP DOWN`, `DS T: DOWN` … `UUS T: DOWN`). Template downlight in no colour, zoned
  across the stage. The textured floor.
- **CLEAR TEMP X L/R** (`SL CLEAR TEMP X <`, `SR CLEAR Temp X >` …). Crossing template diagonals from each side. The
  "diagonals" the Source Fours and PAR64s carry.
- **CLEAR TEMP DIAG BK L/R** (`CLEAR T: DIAG BK <`, `CTR CLEAR T: DIAG BK >` …). Diagonal back-templates, the sculpting
  backlight.
- **SEA T: DIAG BK** and **ALL SEAC TEMP L/R**. A second, coloured ("sea") template system: the blue-green world.
- **Clear Temp Portal**, **LUSTRE Down T:**, **Lustre Temp Scenic**. Template systems on the LED profiles.
- **COLOR 1S** (`ALL COLOR 1S`, `FOH COLOR 1S`, `SR / SL COLOR 1S`, `BALC PARS`). The colour washes, front and side.
- **angled wash**, **us-ds wash**, **GLP WASH**. The X4 wash systems.
- **WALL SCRAPES**, **WIPE COLUMNS**, **US WALL PARS**, **Column Birdies**, **LED Foots**, **Footlights**. The set and
  wall layer.
- Positions as groups: the electrics (1E, 2E, 4E, 7E, 9E), booms and ladders (1 Boom L … 4 Boom R, 1 Ladder L/R), Lustrs
  SR / SL / 2nd Level, Box Booms, Sound Towers, Balcony Rail, ColorSources, Color Forces.

The reading: **a texture system in white from three directions (down, crossing, back), a coloured template system, a
colour wash system, and a set layer**. The movers sit on top for specials, colour and movement. Most looks are a blend of
a template system for the floor, a wash for colour, the wall layer for the room, and movers for the people.

---

## 7. The movers

- **The Vipers are the specials and the moving templates.** The presets are named for **people and places** **[file]**:
  - people: Ham DSC, BURR, Burr UL, Burr DSC, King DSC, king SR, Kings men DS, Woman SL, AH Burr DR, AH duel,
    Ham/Burr, philip, mum, GW, Ang Center Down;
  - places and props: Desk, Table USC, DS table, Cntr Table, chairs;
  - set-ups: Duel pools, Opening pools, 3 pools, 4 pools, cntr path, fly, wall scrape, Wall wash, Big X wash, Surround,
    High sides temps, invert 2.

  A cue says "Burr DSC in Lavender with Pickup sticks". It does not say "pan 120, tilt 40".
- **The X4s are LED washes with rings:** the colour washes, "GLP WASH", "angled wash", "us-ds wash".
- **The VL3500 Wash FX** is the big soft colour and effects wash. When used, it's usually at full (median 100) **[file]**.
- **The beam palettes** say how the spots are used: `SHARP` / `soft` / `hard`, `pinbeam`, `SMALL`, `zoom in` /
  `zoom out` (and `zoom in soft`), `shutter in` / `half shutter`, `Iris in` / `out`, `spin` / `SPIN ZOOM`, `wash sharp`,
  `OPEN diffusion` / `full diffusion`, `strobe` **[file]**.
- **Move in the dark, always.** 76 of the 124 real cues are *marked*: a mover is repositioned and recoloured while it is
  dark, in an earlier cue, so it comes up already in place. Visible movement is a choice, never an accident **[file]**.
- **Effects** are few and purposeful, named for what they do **[file]**:
  - `AMBER red fade`, `RED blue fade` (colour breathing, most likely for the war numbers) and `PINK NC fade`;
  - `Slow intensity`;
  - `GOBO TRAIL <>` and `GOBO <>` (gobo motion);
  - `tilt wave 10 sec`;
  - `Rnd Strobe` and `Rnd Red-White` (the battle).

  The stock Eos shapes (Circle, Ballyhoo, Rainbow…) are in the file but barely used.

---

## 8. How the cues are built [file, from the 124 real cues]

- **Fast.** The median up time is **0.5 s**. 18 cues are **0-count snaps**, 11 take 1–2 s, and only 3 take 4–7 s. The
  longest is 6 s. The light moves on the music's accents, not in long crossfades. The "sunset" quality comes from
  **parts and delays**, not slow cue times.
- **Parted.** **82 of the 124 cues are part cues**, up to 8 parts. One GO lands several things at once on their own
  timings. For example, cue 192 ("BeBack"):
  - part 1 the cue;
  - part 2 "wash stagger up", 4 s delay;
  - part 3 "spots move";
  - part 4 "cntr area wash";
  - part 5 "spots intensity";
  - part 20 the mark.

  The look is choreographed inside one cue.
- **Chained.** 29 cues have an **auto-follow** (`F0.2`, `F1`, `F2.1` …), and the next cue's label starts with **"AF"**:
  36 → 36.1 "AF-Spot up", 633 → 633.01 "AF- Fly in" → 634 "AF-Center", the 1104 chain after the gunshot. The pattern is
  a hit followed by its after-image.
- **Fired by the sound.** Cues labelled **MIDI** (gunshots, "FIRE", the suck-out, "Move to center", "Button") fire
  from the DiGiCo sound desk: **a few hundred of them**, especially the battles, Satisfied and the rewind **[A]**. The
  light lands on the frame of the sound effect, every night.
- **Named for the moment, not the look.** The labels read "Burr Enters", "Woman in Red enters", "Click Boom", "Table
  cloth pull", "Lose outside pools", "Kill DR", "Build out", "Restore", "Button". The verbs (**Lose, Kill, Build,
  Restore, Add**) show how he thinks about changes.
- **Songs separated by +++FTB+++.** In the tour file each island starts with a fade-to-black cue and a scene marker.
  That is the Programming Project's packaging; the show itself flows song into song, often by shifting the wall and
  floor colour instead of a blackout **[A][pic]**.
- **Intensity is low and layered.** Typical levels when on: Vipers ~40%, X4s ~36%, Source Fours ~29%, Lustrs ~50%,
  ColorBlaze strips 30–44%. VL3500s and Birdies are the exceptions, at full **[file]**. The look is many units at modest
  levels, never a few at full.

---

## 9. The famous moments

- **The opening.** A single cool shaft on Hamilton at his name, the company in warm amber around the turntable, beams in
  haze; Burr enters on cue 36 into warm pools ("Opening pools" preset) **[pic][file]**.
- **You'll Be Back.** King George alone in a tight white special on a dark stage, blue on the wall, a ring of rose pools
  around his feet in the tour's cue 192 **[A][pic][file]**.
- **Satisfied, the rewind.** The light drains to sidelight only, with nothing on the floor. The lights flash, the
  turntable spins backwards, the band stops and a processed tape plays. Then the toast rebuilds. All MIDI-fired. In
  Binkley's cue 366.01, three pools appear, then the outer two go (368) **[A][B][file]**.
- **Ten Duel Commandments.** Each numbered commandment is its own cue (#1–#9 in the tour file, 452–470), one per count,
  then the gunshot **[file]**.
- **Yorktown.** No flash effects in the battle; pools on a dark deck with the brick blue; it ends with each soldier lit
  in his own pool **[A/B][pic]**.
- **What Comes Next.** The King's stomp snaps the light from red to blue **[B]**.
- **Non-Stop.** The Act 1 finale builds the whole company on the turntable ("Men on Ring", "Burr/Men") **[file]**.
- **Say No to This.** Cyan-blue rim, magenta and warm on the faces, Maria's dress the red **[pic]**. In the tour file,
  "Woman in Red enters", then lanterns, then "Ham DS of desk" **[file]**.
- **The Room Where It Happens.** Burr under a cyan shaft. Lavender-and-amber shard patterns on the floor for the dance.
  The tour file gives 21 cues, including "Click Boom", "Table cloth pull", "Jump Off", "Dance", and "Art of Bink" (the
  programmers' own joke label for the look) **[pic][file]**.
- **Hurricane.** Blue-green, turquoise and yellow; near-monochrome deep blue in the pictures **[A][pic]**.
- **The Reynolds Pamphlet.** "Build", an FX chase started and stopped, "Pigs and…", and a MIDI suck-out at the end
  **[file]**. *Hamilton: The Revolution* has a chapter about Hamilton blowing up his spot "with the assistance of Howell
  Binkley's lights"; it is worth reading.
- **Burn.** One figure: Eliza, a window-shaped light, the real flame of the letters. It ends in darkness as she leaves
  with a lantern **[A][pic]**.
- **The World Was Wide Enough.** The company in a line through centre like a clock hand, with Burr and Hamilton on the
  outer ring turning the other way. The Bullet crosses in slow motion with the music cut. A red disc lies on the deck
  with Hamilton outside it in white.
  - The tour cues: "FIRE" (MIDI), "Outer Ring CC", Hamilton's speech built from specials ("Legacy/ Hamilton DR",
    "America" centre pose, "Eyes UP", Philip UR, GW on the UL steps, ELIZA, "Freedom" fight), then the gunshot (MIDI),
    "Conv Rings", "Red Ring", "Build out" and fade to black.
  - This is a different moment from the slow-motion bullet in Act 1 **[A][B][pic][file]**.
- **The finale.** Eliza in a pale shaft with the company dim around her, amber and rose shards on the floor, and the last
  image, the gasp, in a lavender-magenta wash **[pic]**.

---

## 10. Number by number (palette and staging)

| # | Number | What the light does |
|---|---|---|
| 1-01 | Alexander Hamilton | warm amber company; a cool single shaft on Hamilton at his name; beams in haze; Burr's entrance into pools |
| 1-02 | Aaron Burr, Sir | a navy street at night with a lamppost, then the warm amber tavern |
| 1-03 | My Shot | the warm tavern (brick orange-amber); the big company sections are a warm floor with cool steel shafts |
| 1-04 | The Story of Tonight | warm, close, with the friends on chairs; a breakup gobo on the deck |
| 1-05 | The Schuyler Sisters | the sisters downstage centre in bright warm-white and gold; a golden deck; cool beams over it |
| 1-06 | Farmer Refuted | bright warm amber: a daytime street, Seabury on his box |
| 1-07 | You'll Be Back | the King alone in a tight white special; the stage dark; blue wall; rose pools at his feet |
| 1-08 | Right Hand Man | battle red and chaos, then a bright white-to-cool key for Washington's entrance (cue 274 "Here comes the General") |
| 1-09 | A Winter's Ball | warm amber and fairly bright: candle wagons and flown lanterns |
| 1-10 | Helpless | deep indigo-blue around warm candles; the wedding |
| 1-11 | Satisfied | the toast warm; the rewind drains to sidelight, then cool pools and Angelica in her warm key; back to the toast |
| 1-12 | Story of Tonight (Reprise) | warm tavern, then Burr; a darker, bluer world |
| 1-13 | Wait for It | Burr in a deep-blue column; the company in blue; a dim pool on a watcher |
| 1-14 | Stay Alive | the war: warm-white key on Washington and Lee, dark around them, red bursts |
| 1-15 | Ten Duel Commandments | warm amber-gold general; a cue on every count; the gunshot |
| 1-16 | Meet Me Inside | warm interior, Washington and Hamilton face to face |
| 1-17 | That Would Be Enough | deep saturated blue; Eliza and Hamilton |
| 1-18 | Guns and Ships | a fan of about 12 cool-white beams down through haze over a warm floor; Lafayette |
| 1-19 | History Has Its Eyes on You | Washington in a warm-white key; a dark warm background |
| 1-20 | Yorktown | pools on a dark deck, blue brick, no flashes; red-amber for "the world turned upside down"; each soldier in his own pool at the end |
| 1-21 | What Comes Next? | the King's special; the stomp snaps red to blue |
| 1-22 | Dear Theodosia | two warm pools (Burr and Hamilton); the wall split warm and blue |
| 1-23 | Non-Stop | the whole company, writing, building on the turntable; Act 1's big finish |
| 2-01 | What'd I Miss | Jefferson's world: lavender-blue with his magenta coat; showy |
| 2-02 | Cabinet Battle #1 | dark navy around the two debaters in warm-white keys |
| 2-03 | Take a Break | a warm domestic interior: the desk, the window, Philip at the piano |
| 2-04 | Say No to This | saturated cyan-blue rim, magenta and warm on faces; NOT a red wash |
| 2-05 | The Room Where It Happens | Burr under a cyan shaft; lavender-and-amber shard patterns for the dance |
| 2-06 | Schuyler Defeated | warm key on the upper gallery (Eliza, Philip and the newspaper) |
| 2-07 | Cabinet Battle #2 | as #1: navy around the debaters |
| 2-08 | Washington on Your Side | **a saturated red deck**: Jefferson, Madison and Burr in a row |
| 2-09 | One Last Time | a warm office (the desk, the decanter), turning blue-violet for the farewell |
| 2-10 | I Know Him | the King's bright warm-white special; a dark background |
| 2-11 | The Adams Administration | Burr downstage right, the King watching upstage left in his own pool |
| 2-12 | We Know | warm office: the three confront Hamilton at his desk; a breakup gobo on the deck |
| 2-13 | Hurricane | near-monochrome deep blue; blue-green, turquoise and yellow **[A]** |
| 2-14 | The Reynolds Pamphlet | the ensemble on the deck with pamphlets; an effects chase; a suck-out at the end |
| 2-15 | Burn | saturated deep blue; Eliza alone; the window light and the flame |
| 2-16 | Blow Us All Away | warm amber: Philip, young and bright |
| 2-17 | Stay Alive (Reprise) | the brick saturated blue; Philip on the table, Hamilton over him |
| 2-18 | It's Quiet Uptown | monochrome deep blue; everything else falls to black |
| 2-19 | The Election of 1800 | bright warm amber general; the company with ballots |
| 2-20 | Your Obedient Servant | one warm pool on Burr's desk, very dark around it |
| 2-21 | Best of Wives and Best of Women | pre-dawn: dark, with red-orange strips on the brick |
| 2-22 | The World Was Wide Enough | the clock-hand line; the slow-motion Bullet; the red disc; "FIRE"; the red ring; then blue for Burr's ending |
| 2-23 | Who Lives, Who Dies… | Eliza in a pale shaft; amber and rose shards; the final lavender-magenta gasp |

The per-number notes behind this table, with their sources, were written for this project's cue revision. They are kept
in the session's scratch area, not the repo.

---

## 11. Lighting "like Binkley": a checklist

Distilled for anyone writing cues for this rig:

1. **Start warm and plain.** Sepia and tungsten is home: R01 and R23 conventionals, white by colour temperature.
   Don't spend colour until the song asks for it.
2. **One idea of colour per song.** Mood decides it, not character. Saturated colour is an event.
3. **Light people from the side and above.** Template downlight and crossing diagonals texture the floor; sidelight
   carves the cast out. Front light stays modest.
4. **Isolate with pools.** Several round pools on a dark deck, not one big special. A solo gets one narrow shaft from
   above.
5. **Paint the wall.** The brick says what world we're in: amber for day, blue for night and grief, split when two worlds
   meet.
6. **Texture the floor.** A breakup gobo is the default; geometric patterns for the big numbers; rings on the turntable.
7. **Haze and beams are part of the composition.** Fans of cool shafts over a warm floor for the company moments. Keep
   the rig visible.
8. **Keep the watchers dim**, so the gallery and onlookers are present but not lit like principals.
9. **Cue on the music.** Snaps and fast times on accents; part cues to land a look in layers; auto-follows for the
   after-image of a hit; sound effects fire the light (MIDI).
10. **Move in the dark.** Every mover is preset while dark; nothing swings while lit unless it's the point.
11. **Red is for battle and blood.** Use it rarely.
12. **Practicals are light.** Candles, lanterns and lampposts carry blue scenes as the only warm sources.

---

## 12. What is still not known

- **The full cue stack.** Only 124 of about 850 cues are public (the 12 islands in the Programming Project). Everything
  else in `assets/hamilton-show.json` marked `"real": false` is our reconstruction.
- **The Cabinet Battle sides** (which side Jefferson and Hamilton take): not found in print or in captioned pictures.
- **Where Washington enters in Right Hand Man,** and the turntable's direction in It's Quiet Uptown.
- **Followspot pick-up lists,** and exactly where R77760 is used.
- **How a Viper's cyan flag passes light.** Augment3d draws C88/Y55 as blue where a textbook CMY model gives teal; the
  real dichroic is a deep blue-cyan that passes little green, so the photos are right and the textbook model was wrong.
  Our engine now mixes with per-flag transmissions fitted to the cue photos (`LX_CMY_FLAGS` in midtown.html; the
  ambers are unchanged). The exact Martin filter curves are still unknown (see `docs/guide/TRAPS.md`).

---

## 13. Sources

- **Lighting & Sound America,** October 2015, "Declaration of Independence", David Barbour (reprint:
  lightingandsoundamerica.com/reprint/Hamilton.pdf).
- **Live Design,** October 2015: "Birth of a Nation: Colonial Lighting" (with the gear list); "A Revolutionary Stage"
  (Korins); "Dressing the Founding Fathers" (Tazewell).
- **LSA** "Theatre in Review" (Broadway and Public).
- **Martin/Harman** release and PLSN on the Vipers (David Arch). PLSN's tribute to Binkley.
- **Playbill:** Blankenbuehler interview; a day with stage manager Amber White. Broadway in Cincinnati: Blankenbuehler.
- **Korins:** Stage Directions (October 2015), DesignLines, Tim Teeman.
- **Theatrecrafts:** Hamilton page.
- **LSi:** MDG haze for the London production (Binkley).
- **ALPD:** tribute to Binkley (R77760).
- **Scholastic Art** interview; WITN (2020) on adapting Hamilton for the film.
- **ETC:** The Hamilton Programming Project (etcconnect.com/hamilton): the show file, cue photos, magic sheet, focus
  charts. The project's own data is in `assets/hamilton-eos.json`.
- **Pictures:**
  - Disney+ press stills (press.disneyplus.com/disney-plus/hamilton/images);
  - per-song Disney+ frames (Screen Rant);
  - Joan Marcus Broadway production photos, in the Martin case study, Gilder Lehrman, Left Voice and the Playbill/Korins
    gallery.
