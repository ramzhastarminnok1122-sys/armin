# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L010 (10 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L008–L010: adjective agreement in respectful descriptions; café orders and partitive articles; food preferences with definite articles.
- L008–L010 range validator: 3 lessons, L001–L007 context, 3,506 checks, 0 errors.
- Full French validator: 10 lessons, 11,684 checks, 0 errors.
- L001–L007 remain unchanged by the latest batch.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 10; plan manifests: 10; planned clips: 440.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 440.
- Lessons with complete real audio: 0; lessons without real audio: 10.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation.

## Tooling note

The validator's recursive context scan skips `specs` directories. Authoring specs share `L###.json` names with lessons, and could otherwise shadow installed prior lessons during continuity validation.

## Next action

Start French L011: author an independent A1 spec for shopping at a market, asking prices, and expressing quantities; then build only L011 in an isolated directory, create its French-scoped plan, validate with French context L001–L010, run continuity/content QA, and install only after a zero-error pass.
