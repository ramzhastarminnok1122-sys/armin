# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L016 (16 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L008–L010: adjective agreement in respectful descriptions; café orders and partitive articles; food preferences with definite articles.
- L011–L013: market quantities and prices; giving directions; travel by public transport, bicycle, and on foot.
- L014–L016: invitations with `vouloir`/`pouvoir`; calendars and dates; weather and outdoor plans.
- L014–L016 range validator: 3 lessons, L001–L013 context, 3,530 checks, 0 errors.
- Full French validator: 16 lessons, 18,728 checks, 0 errors.
- L001–L013 remain unchanged by the latest batch.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 16; plan manifests: 16; planned clips: 704.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 704.
- Lessons with complete real audio: 0; lessons without real audio: 16.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation.

## Tooling note

The validator's recursive context scan skips `specs` directories. Authoring specs share `L###.json` names with lessons, and could otherwise shadow installed prior lessons during continuity validation.

## Next action

Start French L017: author an independent A1 spec for describing common symptoms and asking for help at a pharmacy, then build only L017 in an isolated directory, create its French-scoped plan, validate with French context L001–L016, run continuity/content QA, and install only after a zero-error pass.
