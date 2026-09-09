# AJN Media Baseline Inventory

Source: `daily-highlights-archive-COPY.zip`

## Inventory

- 99 total ZIP entries, including directories
- 35 image files
- 8 JSON files
- 35 M3U playlists
- 1 DPL file
- 1 M3U8 file
- 1 static `tv-player.html`
- 2 PLS playlists

## Notable source sets

- `json_files/AJN ARCHIVE.json` — archive catalog envelope with `generated`, `total`, `episodes`
- `json_files/Retro news.json` — news/archive catalog envelope
- `json_files/stream-manifest-9-11 september 2001.json` — deterministic stream manifest/schedule data
- `json_files/all m3u.json` — 89,152 playlist-derived entries
- `m3u_files/Alex 24.m3u` — 13,072 playlist entries
- `m3u_files/Liberty_Express_Live (3).m3u` — 8,534 playlist entries
- `m3u_files/Info Survior.m3u` — 7,692 playlist entries
- `m3u_files/TV CRIME_cleaned.m3u` — 4,373 playlist entries
- `m3u_files/Super Alex Jones Archive.m3u` — 1,897 playlist entries
- `other_files/tv-player.html` — 82,981-byte static player source

## Validation observations

The archive contains at least two malformed/truncated JSON sources that require importer quarantine and repair/reporting:

- `json_files/Ancient Aliens.json`
- `json_files/honey mooners classic movies.json`

The baseline should never silently discard these records. The future import job should report parse errors, preserve the originals, and allow controlled re-import after repair.

## Proposed future mapping

`images/` -> Directus assets / object storage

`m3u_files/` -> playlist import jobs -> canonical channels/sources/media

`json_files/` -> provider/archive/EPG/news/manifest import jobs, depending on schema

`pls_files/`, `other_files/*.dpl`, `other_files/*.m3u8` -> parser-specific import adapters

`other_files/tv-player.html` -> reference/static-player asset; do not execute as Directus backend code
