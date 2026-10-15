# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L028 (28 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L008–L010: adjective agreement in respectful descriptions; café orders and partitive articles; food preferences with definite articles.
- L011–L013: market quantities and prices; giving directions; travel by public transport, bicycle, and on foot.
- L014–L016: invitations with `vouloir`/`pouvoir`; calendars and dates; weather and outdoor plans.
- L017–L019: minor symptoms and safe pharmacy language; rooms and furniture; morning routines with reflexive verbs.
- L020–L022: clothing sizes and colour agreement; hobbies with `aimer + infinitive`; weekend plans with the futur proche.
- L023–L025: occupations and workplaces; safe exchange of contact details; classroom instructions with `il faut`.
- L026–L028: post-office services and postage; hotel reservations; train times, platforms, and delays.
- L026–L028 range validator: 3 lessons, L001–L025 context, 3,561 checks, 0 errors.
- Full French validator: 28 lessons, 32,927 checks, 0 errors.
- L001–L025 remain unchanged by the latest batch.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 28; plan manifests: 28; planned clips: 1,232.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 1,232.
- Lessons with complete real audio: 0; lessons without real audio: 28.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation.

## Tooling notes

- The validator's recursive context scan skips `specs` directories. Authoring specs share `L###.json` names with lessons, and could otherwise shadow installed prior lessons during continuity validation.
- Replaced ASCII-only word boundaries in the forbidden technical-term check with Unicode-aware boundaries. This avoids false positives inside valid accented French vocabulary, e.g. `réserver`, while still rejecting standalone English technical terms.

## Next action

Continue with French L029: author an independent French-native A1 specification, then build only the selected range in an isolated directory, create French-scoped audio plans, validate with L001–L028 context, run continuity/content QA, and install only after a zero-error pass.
