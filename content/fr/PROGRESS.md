# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L013 (13 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L008–L010: adjective agreement in respectful descriptions; café orders and partitive articles; food preferences with definite articles.
- L011–L013: market quantities and prices; giving directions; travel by public transport, bicycle, and on foot.
- L011–L013 range validator: 3 lessons, L001–L010 context, 3,514 checks, 0 errors.
- Full French validator: 13 lessons, 15,198 checks, 0 errors.
- L001–L010 remain unchanged by the latest batch.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 13; plan manifests: 13; planned clips: 572.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 572.
- Lessons with complete real audio: 0; lessons without real audio: 13.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation.

## Tooling note

The validator's recursive context scan skips `specs` directories. Authoring specs share `L###.json` names with lessons, and could otherwise shadow installed prior lessons during continuity validation.

## Next action

Start French L014: author an independent A1 spec for making plans and invitations with `pouvoir` and `vouloir`, then build only L014 in an isolated directory, create its French-scoped plan, validate with French context L001–L013, run continuity/content QA, and install only after a zero-error pass.
