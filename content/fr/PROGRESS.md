# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L025 (25 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L008–L010: adjective agreement in respectful descriptions; café orders and partitive articles; food preferences with definite articles.
- L011–L013: market quantities and prices; giving directions; travel by public transport, bicycle, and on foot.
- L014–L016: invitations with `vouloir`/`pouvoir`; calendars and dates; weather and outdoor plans.
- L017–L019: minor symptoms and safe pharmacy language; rooms and furniture; morning routines with reflexive verbs.
- L020–L022: clothing sizes and colour agreement; hobbies with `aimer + infinitive`; weekend plans with the futur proche.
- L023–L025: occupations and workplaces; safe exchange of contact details; classroom instructions with `il faut`.
- L023–L025 range validator: 3 lessons, L001–L022 context, 3,553 checks, 0 errors.
- Full French validator: 25 lessons, 29,366 checks, 0 errors.
- L001–L022 remain unchanged by the latest batch.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 25; plan manifests: 25; planned clips: 1,100.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 1,100.
- Lessons with complete real audio: 0; lessons without real audio: 25.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation.

## Tooling note

The validator's recursive context scan skips `specs` directories. Authoring specs share `L###.json` names with lessons, and could otherwise shadow installed prior lessons during continuity validation.

## Next action

Start French L026: author an independent A1 spec for a practical post-office errand, including a letter or parcel, postage, and a polite service request; then build only L026 (or its batch) in an isolated directory, create the French-scoped plan, validate with French context L001–L025, run continuity/content QA, and install only after a zero-error pass.
