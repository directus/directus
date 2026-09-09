# AJN Media Baseline

This directory is an imported baseline manifest for the future AJN TV guide, archive playback, news, playlist, and media-control integration.

## Source artifact

Original ZIP: `daily-highlights-archive-COPY.zip`

The ZIP should remain preserved as the original source artifact. The unpacked files are reference/source data only until the AJN Directus data model and import contracts are finalized.

## Contents

- `images/` — channel, program, place-card, archive, and UI artwork
- `json_files/` — archive catalogs, playlist-derived JSON, retro/news data, and stream manifests
- `m3u_files/` — source playlists and channel/program collections
- `other_files/` — DPL, M3U8, and static TV-player source
- `pls_files/` — PLS playlist sources

## Important implementation boundary

Do not make these files the live playback authority. They are source/baseline inputs for a future import/normalization pipeline.

Planned flow:

`baseline files -> validation -> canonical AJN model -> Directus -> published manifest -> AJN runtime`

The AJN runtime remains authoritative for deterministic 24/7 playback execution.

## Known source-data issues to address during import

Some JSON files in the supplied archive are not currently valid JSON and must be quarantined/repaired by an importer rather than silently accepted. The importer should produce an explicit validation report and preserve the original files.
