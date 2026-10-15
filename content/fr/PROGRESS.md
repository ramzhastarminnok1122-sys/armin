# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L022 (22 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L008–L010: adjective agreement in respectful descriptions; café orders and partitive articles; food preferences with definite articles.
- L011–L013: market quantities and prices; giving directions; travel by public transport, bicycle, and on foot.
- L014–L016: invitations with `vouloir`/`pouvoir`; calendars and dates; weather and outdoor plans.
- L017–L019: minor symptoms and safe pharmacy language; rooms and furniture; morning routines with reflexive verbs.
- L020–L022: clothing sizes and colour agreement; hobbies with `aimer + infinitive`; weekend plans with the futur proche.
- L020–L022 range validator: 3 lessons, L001–L019 context, 3,545 checks, 0 errors.
- Full French validator: 22 lessons, 25,813 checks, 0 errors.
- L001–L019 remain unchanged by the latest batch.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 22; plan manifests: 22; planned clips: 968.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 968.
- Lessons with complete real audio: 0; lessons without real audio: 22.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation.

## Tooling note

The validator's recursive context scan skips `specs` directories. Authoring specs share `L###.json` names with lessons, and could otherwise shadow installed prior lessons during continuity validation.

## Next action

Start French L023: author an independent A1 spec for common occupations and workplaces, then build only L023 in an isolated directory, create its French-scoped plan, validate with French context L001–L022, run continuity/content QA, and install only after a zero-error pass.
