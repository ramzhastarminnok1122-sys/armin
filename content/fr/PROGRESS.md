# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L007 (7 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L005–L007 range validator: 3 lessons, L001–L004 context, 3,537 checks, 0 errors.
- Full French validator: 7 lessons, 8,178 checks, 0 errors.
- L001–L004 remain unchanged by the latest batch.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 7; plan manifests: 7; planned clips: 308.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 308.
- Lessons with complete real audio: 0; lessons without real audio: 7.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation.

## Tooling note

The validator's recursive context scan now skips `specs` directories. Authoring specs share `L###.json` names with lessons, and were otherwise able to shadow installed prior lessons during continuity validation.

## Next action

Start French L008: author an independent A1 spec on describing people with common adjectives and gender/number agreement, then build only L008 in an isolated directory, create its French-scoped plan, validate with French context L001–L007, run continuity/content QA, and install only after a zero-error pass.
