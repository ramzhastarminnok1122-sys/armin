# French production progress

Updated: 2026-10-15

## Content

- Installed and validated: French L001–L082 (82 of 340).
- L002–L004: age with `avoir`; spelling names and French diacritics; country of origin and residence.
- L005–L007: language names and `ne...pas`; family vocabulary and possessives; regular present-tense `-er` verbs and weekly schedules.
- L008–L010: adjective agreement in respectful descriptions; café orders and partitive articles; food preferences with definite articles.
- L011–L013: market quantities and prices; giving directions; travel by public transport, bicycle, and on foot.
- L014–L016: invitations with `vouloir`/`pouvoir`; calendars and dates; weather and outdoor plans.
- L017–L019: minor symptoms and safe pharmacy language; rooms and furniture; morning routines with reflexive verbs.
- L020–L022: clothing sizes and colour agreement; hobbies with `aimer + infinitive`; weekend plans with the futur proche.
- L023–L025: occupations and workplaces; safe exchange of contact details; classroom instructions with `il faut`.
- L026–L028: post-office services and postage; hotel reservations; train times, platforms, and delays.
- L029–L031: phone calls with singular object pronouns; comparing travel bags; shared-workspace rules with `il faut` and `il ne faut pas`.
- L032–L034: gentle everyday well-being suggestions; classroom duties with `devoir`; locating objects with prepositions of place.
- L035–L037: lost-and-found descriptions and location review; birthday dates with `le/en/à`; proposing and coordinating activities.
- L038–L040: possessive pronouns for personal items; `il y avait` versus `il y a` in a neighbourhood; sequencing a local event.
- L041–L043: confirmed plans with the present tense; regular futur simple for travel projects (irregular stems continued in L070); purpose with `pour + infinitif`.
- L044–L046: manner adverbs; `trop/assez` with adjectives and nouns; first passé composé experiences with regular `-er` participles. L044’s reading was adjusted to avoid an out-of-scope subjunctive.
- L047–L049: common `-ir`/`-re` participle models; movement verbs with `être` and basic agreement; high-frequency irregular participles with `avoir`.
- L050–L052: `depuis` with the present for ongoing situations; `il y a + duration` for completed past events; `ne...plus` for changed routines.
- L053–L055: indirect pronouns `lui/leur`; place pronoun `y`; quantity pronoun `en`.
- L056–L058: `ne...rien`; affirmative `quelqu’un/quelque chose/quelque part`; negative `personne` as subject or object.
- L059–L061: `être en train de` for a current action; demonstrative adjectives `ce/cet/cette/ces`; interrogative adjectives `quel/quelle/quels/quelles` with gender and number agreement.
- L062–L064: `ne...jamais` for habits; `pourquoi/parce que` for reasons versus `pour + infinitif` for purpose; identify with `c’est + nom` and describe with `il/elle est + adjectif`.
- L065–L067: `on` as a singular-conjugated subject for “we” or people generally; `ce sont` for plural identification; `avoir besoin de + nom/infinitif` for needs.
- L068–L070: imperatives for `tu/nous/vous` (including the regular `-er` tu form); plural direct-object pronoun `les`; irregular futur simple stems `ser-/aur-/ir-/fer-`.
- L071–L073: recent past with `venir de + infinitif`; stressed pronouns after prepositions; `savoir/pouvoir + infinitif` for skills versus possibility or permission.
- L074–L076: present-tense regular `-ir` and `-re` verb patterns; `de/d’` after `ne...pas` for indefinite and partitive articles.
- L077–L079: irregular present of `faire` for household tasks; `prendre` for choosing library items; irregular present forms of `lire` and `écrire` in a reading group.
- L080–L082: irregular present of `aller` with destination phrases; `venir` for inviting visitors home; `voir` for observing objects at a planetarium.
- Range validations: L044–L046, 3 lessons / 3,617 checks / 0 errors; L047–L049, 3 / 3,619 / 0; L050–L052, 3 / 3,630 / 0; L053–L055, 3 / 3,729 / 0; L056–L058, 3 / 3,649 / 0.
- Combined L044–L058 validation against L001–L043: 15 lessons, 18,244 checks, 0 errors.
- L059–L061 validation against L001–L058: 3 lessons, 3,694 checks, 0 errors.
- L062–L064 validation against L001–L061: 3 lessons, 3,674 checks, 0 errors.
- L065–L067 validation against L001–L064: 3 lessons, 3,681 checks, 0 errors.
- L068–L070 validation against L001–L067: 3 lessons, 3,711 checks, 0 errors.
- L071–L073 validation against L001–L070: 3 lessons, 3,697 checks, 0 errors.
- L074–L076 validation against L001–L073: 3 lessons, 3,715 checks, 0 errors.
- L077–L079 validation against L001–L076: 3 lessons, 3,720 checks, 0 errors.
- L080–L082 validation against L001–L079: 3 lessons, 3,733 checks, 0 errors.
- Previous full French validation (L001–L076): 76 lessons, 91,298 checks, 0 errors.
- Previous full French validation (L001–L079): 79 lessons, 95,018 checks, 0 errors.
- Latest full French validation (L001–L082): 82 lessons, 98,751 checks, 0 errors.
- Verified L001–L043 lesson bytes, plan files, and metadata entries remain unchanged. English content was not modified.
- Spanish production lessons: 0.

## Audio — plans are not recordings

From `content/audio/audio-backlog.json`:

- French lessons: 82; plan manifests: 82; planned clips: 3,615 (132 added for L080–L082: 44 per lesson).
- Reconciled the earlier L074–L076 discrepancy: the installed plan manifests contain 44 clips each (132 total); the earlier 45/45/44 note was inaccurate.
- Verified physical MP3s: 0; lesson audio references: 0; missing planned clips: 3,615.
- Lessons with complete real audio: 0; lessons without real audio: 82.
- English and Spanish sections of the backlog were preserved unchanged.

No French voice audition or speech synthesis has been performed. Audition is still required before large-scale audio generation. No MP3s or audio references were fabricated.

## Tooling notes

- The validator's recursive context scan skips `specs` directories. Authoring specs share `L###.json` names with lessons, and could otherwise shadow installed prior lessons during continuity validation.
- The forbidden technical-term check uses Unicode-aware word boundaries, avoiding false positives inside accented French vocabulary such as `réserver` while still rejecting standalone English technical terms.

## Next action

Continue sequentially from French L083: author French-native specifications, build only the selected range in an isolated directory, generate French-scoped audio plans, validate against all prior French lessons, run continuity/content QA, and install only after zero-error validation.
