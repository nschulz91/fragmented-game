# Fragmented Sprite Asset Review

This is the expected first-pass sprite package for the current side-scrolling build of **Fragmented**.

The goal is to review the asset scope before animation integration starts in code.

## Art Direction Baseline

- Style: dark fantasy 2D side-scroller
- Character treatment: hand-authored pixel art or painted sprite-style raster art with strong silhouette readability
- Camera/readability target: gameplay-first, high contrast, effects readable at speed
- Current gameplay structure:
  - `Chapter 1`: Lake Pixor
  - `Transition`: Breach Road
  - `Chapter 2`: Cinder Causeway
- Current playable cast:
  - Charlie
  - Shade
  - Cultist
  - Brute
  - Embermage
  - Ashhound
  - Warden of Pixor

## Technical Assumptions

- Side view only
- Separate sheets per character/enemy is preferred
- PNG with transparency
- Consistent pivot/origin placement across each sheet
- Recommended base gameplay scale:
  - Charlie and standard humanoids: around `96x128` source frames
  - Brute: around `128x128`
  - Ashhound: around `128x96`
  - Warden: around `144x168` or `160x192`
- Export both:
  - sprite sheet PNG
  - frame map JSON or a simple frame index spec

## Naming Convention

Recommended file naming:

- `charlie_sheet.png`
- `shade_sheet.png`
- `cultist_sheet.png`
- `brute_sheet.png`
- `embermage_sheet.png`
- `ashhound_sheet.png`
- `warden_sheet.png`

If effect sheets are separated:

- `fx_slash_sheet.png`
- `fx_pulse_sheet.png`
- `fx_dash_sheet.png`
- `fx_parry_sheet.png`
- `fx_charge_sheet.png`

Portraits:

- `portrait_charlie.png`
- `portrait_warden.png`
- `portrait_veyra.png`
- `portrait_scout.png`
- `portrait_glass.png`

## Charlie

### Purpose

Main player character. Fast, agile, serious, readable under combat pressure.

### Visual Requirements

- Match the approved Charlie look:
  - black messy hair
  - red eyes
  - white shirt with dark chest emblem
  - dark pants
  - fingerless gloves
- Should read as a melee-and-magic fighter
- Silhouette should stay readable during dash/parry/charge

### Required Animation States

- `idle`
  - 6 to 8 frames
- `run`
  - 8 frames
- `jump_start`
  - 2 to 3 frames
- `jump_air`
  - 2 frames
- `fall`
  - 2 frames
- `land`
  - 2 frames
- `slash_1`
  - 5 to 6 frames
- `pulse_cast`
  - 5 to 6 frames
- `dash`
  - 4 to 5 frames
- `parry`
  - 4 to 5 frames
- `charge_start`
  - 3 frames
- `charge_hold`
  - 2 to 3 looping frames
- `charge_release`
  - 5 to 6 frames
- `hit_react`
  - 2 to 3 frames
- `death`
  - 6 to 8 frames
- `story_pose`
  - 1 clean portrait/full-body pose for cards and promo use

### Estimated Deliverable

- One gameplay sprite sheet
- One portrait
- Optional separate full-body illustration for menus/dialogue

## Shade

### Role

Fast flank-and-lunge skirmisher.

### Required States

- `idle` 4 to 6
- `move` 6 to 8
- `telegraph` 3 to 4
- `lunge` 4 to 5
- `recover` 2
- `hit_react` 2
- `death` 5 to 6

### Notes

- Lean silhouette
- Purple/indigo shadow energy
- Must read clearly against both Lake Pixor and Causeway backgrounds

## Cultist

### Role

Ranged caster pressure unit.

### Required States

- `idle` 4 to 6
- `walk` 6
- `cast_start` 3 to 4
- `cast_loop` 2 to 3
- `cast_release` 3 to 4
- `hit_react` 2
- `death` 5 to 6

### Notes

- Robes/light armor
- Magical, precise, fanatical
- Casting pose should strongly read from side view

## Brute

### Role

Heavy charge-based enforcer.

### Required States

- `idle` 4
- `walk` 6
- `charge_telegraph` 3 to 4
- `charge` 4 to 5
- `recover` 2
- `hit_react` 2
- `death` 5 to 6

### Notes

- Broader silhouette than all other standard enemies
- Armor/weight should be obvious before animation even starts

## Embermage

### Role

Causeway-specific fire caster and area denial enemy.

### Required States

- `idle` 4 to 6
- `walk` 6
- `cast_start` 4
- `cast_hold` 2 to 3
- `cast_release` 4
- `hit_react` 2
- `death` 5 to 6

### Notes

- Orange-gold fire magic
- Heat-scorched or ritualist look
- Should feel visually distinct from Cultist

## Ashhound

### Role

Fast feral pounce enemy.

### Required States

- `idle` 4
- `run` 6 to 8
- `telegraph` 3
- `pounce` 4 to 5
- `recover` 2
- `hit_react` 2
- `death` 4 to 5

### Notes

- Low aggressive profile
- Ember-lit eyes
- Must read clearly as a ground hunter, not a wolf placeholder

## Warden of Pixor

### Role

Chapter 1 boss.

### Required States

- `idle`
  - 6 frames
- `walk`
  - 6 to 8 frames
- `projectile_cast`
  - 5 to 6 frames
- `burst_charge`
  - 4 frames
- `burst_release`
  - 4 to 5 frames
- `dash_charge`
  - 4 frames
- `dash`
  - 4 to 5 frames
- `phase_shift`
  - 5 to 6 frames
- `summon`
  - 5 frames
- `hit_react`
  - 2 to 3 frames
- `death`
  - 8 to 10 frames
- `finisher_pose`
  - 1 frame or illustration for boss payoff scene

### Notes

- Larger, regal, threatening
- Needs a clean silhouette in all 3 phases
- Boss casting and phase-shift poses should be sellable enough for cinematic card moments

## Effects Sheets

These should be separate from character sheets unless the artist has a strong reason not to.

### Slash FX

- 5 to 7 frames
- Bright, sharp melee arc
- Side-view readable

### Pulse FX

- 6 to 8 frames
- Circular time-burst distortion
- Should work as a layered ring and shockwave

### Dash FX

- 4 to 6 frames
- Afterimage/speed streak

### Parry FX

- 4 to 5 frames
- Crisp impact spark and defensive flash

### Charged Strike FX

- 7 to 10 frames
- Grounded magical detonation centered on Charlie
- Needs anticipation, burst, and decay

### Projectile FX

- Cultist bolt
- Embermage bolt
- Warden bolt
- Warden burst projectile

## Environment Sprite / Tile Needs

Before full environment polish, these are the minimum art-backed gameplay assets expected for the side-scrolling conversion.

### Lake Pixor

- platform tiles
- cracked stone ledges
- toxic runoff tiles
- ruined battlement props
- breach gate prop set

### Breach Road

- broken road platforms
- shrine prop art
- ridge/watchline props
- scorched stone transition tiles

### Cinder Causeway

- volcanic stone platform tiles
- ember vent hazards
- fractured bridge pieces
- ritual architecture props
- crown-span set pieces

## Portrait Art Needed

These are separate from gameplay sprites.

- Charlie
- Warden of Pixor
- Marshal Veyra
- Scout Runner
- Archivist of Glass

Portrait target:

- bust or upper-body framing
- stronger detail than gameplay sprites
- consistent lighting and mood

## Recommended Delivery Order

1. Charlie gameplay sheet
2. Shade, Cultist, Brute
3. Warden gameplay sheet
4. Embermage and Ashhound
5. Core FX sheets
6. Portrait set
7. Environment tile/prop packs

## Review Questions

Approve or adjust these before animation integration:

- Is the frame size right, or do you want larger source art?
- Do you want pixel art, painted sprite art, or a hybrid?
- Should Charlie have one slash animation or two alternating slashes?
- Should the Warden have a full death animation or transition directly into a scripted finish scene?
- Do you want environment work to start with tile sets or with full background paintings first?

## Minimum Approval Set

If you want to move quickly, I would approve this minimum batch first:

- Charlie sheet
- Shade sheet
- Cultist sheet
- Brute sheet
- Warden sheet
- slash/pulse/dash/parry/charge FX sheets
- Lake Pixor tile + backdrop pack

That is enough to animate the first chapter properly before expanding the second region.
