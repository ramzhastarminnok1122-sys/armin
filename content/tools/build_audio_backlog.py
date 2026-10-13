#!/usr/bin/env python3
"""Build a repository-local, read-only-derived audio backlog.

This tool reads lesson JSON, per-lesson plans, generated MP3s, local references,
and registry hashes. It never contacts Supabase and never copies registry URLs.
Run: python3 content/tools/build_audio_backlog.py
"""
from __future__ import annotations

from datetime import date
from hashlib import sha256
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = Path(__file__).resolve().with_name("language-config.json")
LANGUAGE_CONFIG = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
OUTPUT = ROOT / "content/audio/audio-backlog.json"
LANGUAGES = tuple(LANGUAGE_CONFIG["languages"])


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback


def mp3_frame_present(path: Path) -> bool:
    """Conservatively detect at least one syntactically plausible Layer III frame."""
    try:
        data = path.read_bytes()[:8192]
    except OSError:
        return False
    start = 0
    if data.startswith(b"ID3") and len(data) >= 10:
        size = sum((data[6 + i] & 0x7F) << (7 * (3 - i)) for i in range(4))
        start = 10 + size + (10 if data[5] & 0x10 else 0)
    for i in range(start, min(len(data) - 3, start + 8192)):
        h = int.from_bytes(data[i:i + 4], "big")
        version, layer = (h >> 19) & 3, (h >> 17) & 3
        bitrate, sample_rate = (h >> 12) & 15, (h >> 10) & 3
        if (h >> 21) == 0x7FF and version != 1 and layer == 1 and bitrate not in (0, 15) and sample_rate != 3:
            return True
    return False


def lesson_paths(language: str):
    base = ROOT / LANGUAGE_CONFIG["languages"][language]["lesson_root"]
    if not base.is_dir():
        return []
    return sorted(base.glob("*/lessons/L[0-9][0-9][0-9].json"))


def build_language(language: str):
    audio_root = ROOT / LANGUAGE_CONFIG["languages"][language]["audio_root"]
    registry_doc = read_json(audio_root / "registry.json", {})
    registry = registry_doc.get("clips", {}) if isinstance(registry_doc, dict) else {}
    if not isinstance(registry, dict):
        registry = {}

    entries = []
    totals = {
        "lessons": 0,
        "lessons_without_real_audio": 0,
        "lessons_with_partial_audio": 0,
        "lessons_with_all_planned_audio": 0,
        "plan_manifests": 0,
        "planned_clips": 0,
        "audio_references": 0,
        "physical_mp3_files": 0,
        "integrity_checked_files": 0,
        "registry_hash_matched_files": 0,
        "missing_planned_clips": 0,
    }

    for lesson_path in lesson_paths(language):
        lesson_doc = read_json(lesson_path, {})
        lesson = lesson_doc.get("lesson", {})
        lesson_id = lesson_path.stem
        if lesson.get("language_code") != language:
            continue
        content = lesson_doc.get("content", {})
        audio_section = content.get("audio", {})
        referenced = {}
        if isinstance(audio_section, dict):
            for section, items in audio_section.items():
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict) and item.get("id"):
                            referenced[item["id"]] = {"section": section, **item}

        plan_path = audio_root / f"{lesson_id}.plan.json"
        plan_doc = read_json(plan_path, {}) if plan_path.is_file() else {}
        clips = plan_doc.get("clips", []) if isinstance(plan_doc, dict) else []
        if not isinstance(clips, list):
            clips = []
        plan_by_id = {c.get("id"): c for c in clips if isinstance(c, dict) and c.get("id")}

        generated_dir = audio_root / "generated" / lesson_id
        physical_files = {p.stem: p for p in generated_dir.glob("*.mp3")} if generated_dir.is_dir() else {}
        generated_records = []
        complete_clip_ids = set()
        missing_clips = []
        for clip_id, clip in plan_by_id.items():
            file_path = physical_files.get(clip_id)
            ref = referenced.get(clip_id)
            registry_entry = registry.get(clip_id, {}) if isinstance(registry, dict) else {}
            file_exists = bool(file_path and file_path.is_file())
            raw_hash = sha256(file_path.read_bytes()).hexdigest() if file_exists else None
            byte_count = file_path.stat().st_size if file_exists else None
            frame_ok = mp3_frame_present(file_path) if file_exists else False
            registry_hash = str(registry_entry.get("hash", "")).lower() if isinstance(registry_entry, dict) else ""
            hash_match = bool(raw_hash and registry_hash and raw_hash.startswith(registry_hash))
            bytes_match = bool(file_exists and isinstance(registry_entry, dict) and registry_entry.get("bytes") == byte_count)
            ref_matches_plan = bool(ref and ref.get("text") == clip.get("tts_text") and ref.get("lang") == clip.get("language") and ref.get("role") == clip.get("role"))
            clip_ready = file_exists and frame_ok and ref_matches_plan and hash_match and bytes_match
            if clip_ready:
                complete_clip_ids.add(clip_id)
            if file_exists:
                totals["physical_mp3_files"] += 1
                generated_records.append({
                    "clip_id": clip_id,
                    "file": file_path.relative_to(ROOT).as_posix(),
                    "language": clip.get("language"),
                    "role": clip.get("role"),
                    "bytes": byte_count,
                    "sha256": raw_hash,
                    "registry_hash_match": hash_match,
                    "registry_bytes_match": bytes_match,
                    "mp3_frame_present": frame_ok,
                    "referenced": bool(ref),
                    "reference_matches_plan": ref_matches_plan,
                })
                if frame_ok and raw_hash:
                    totals["integrity_checked_files"] += 1
                if hash_match and bytes_match:
                    totals["registry_hash_matched_files"] += 1
            if not clip_ready:
                reasons = []
                if not file_exists: reasons.append("missing_file")
                elif not frame_ok: reasons.append("no_mp3_frame_detected")
                if not ref: reasons.append("missing_lesson_reference")
                elif not ref_matches_plan: reasons.append("reference_plan_mismatch")
                if file_exists and not registry_hash: reasons.append("missing_registry_hash")
                elif file_exists and not hash_match: reasons.append("registry_hash_mismatch")
                if file_exists and isinstance(registry_entry, dict) and not bytes_match: reasons.append("registry_byte_count_mismatch")
                missing_clips.append({
                    "clip_id": clip_id,
                    "language": clip.get("language"),
                    "role": clip.get("role"),
                    "priority": clip.get("priority"),
                    "source": clip.get("source"),
                    "reasons": reasons,
                })

        orphan_files = sorted(set(physical_files) - set(plan_by_id))
        complete_plan = bool(plan_by_id) and len(complete_clip_ids) == len(plan_by_id)
        if not complete_clip_ids:
            status = "missing"
            totals["lessons_without_real_audio"] += 1
        elif complete_plan:
            status = "complete"
            totals["lessons_with_all_planned_audio"] += 1
        else:
            status = "partial"
            totals["lessons_with_partial_audio"] += 1

        totals["lessons"] += 1
        totals["plan_manifests"] += int(plan_path.is_file())
        totals["planned_clips"] += len(plan_by_id)
        totals["audio_references"] += len(referenced)
        totals["missing_planned_clips"] += len(missing_clips)
        entries.append({
            "language": language,
            "lesson_id": lesson_id,
            "order_index": lesson.get("order_index"),
            "lesson_file": lesson_path.relative_to(ROOT).as_posix(),
            "plan_file": plan_path.relative_to(ROOT).as_posix() if plan_path.is_file() else None,
            "plan_clip_count": len(plan_by_id),
            "audio_reference_count": len(referenced),
            "physical_file_count": len(physical_files),
            "ready_clip_count": len(complete_clip_ids),
            "audio_status": status,
            "generated_assets": generated_records,
            "missing_planned_clips": missing_clips,
            "orphan_generated_files": orphan_files,
        })

    return {"summary": totals, "lessons": entries}


def main():
    result = {
        "generated_on": date.today().isoformat(),
        "definition": "A planned clip is ready only when its local MP3 has an MP3 frame, matching registry hash/byte count, and a lesson audio reference matching the plan. A lesson is complete only when every planned clip is ready.",
        "voice_note": "Plans retain role assignments. Existing voice IDs are not treated as current; fresh auditions are required before large-scale audio generation.",
        "languages": {language: build_language(language) for language in LANGUAGES},
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")
    for language, value in result["languages"].items():
        print(language, json.dumps(value["summary"], ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
