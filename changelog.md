# Changelog

_Gaps between patch versions are faulty or test releases_

## 9.0.0-rc.70 (June 1st, 2021)

### :sparkles: New Features

- API

  - added support for mirroring foreign key constraints with the database (@rijkvanzanten) (#5615)
    [933537240046e257d38b41692bffa2ad07c81831]
  - added support for new environment variables that allow you to control maximum asset generation parameters
    (@rijkvanzanten) (#5795) [8d3102fbad815bf0c4c6afde4ca7900d0c863149]
  - added support for deep filtering on many-to-any items (@rijkvanzanten) (#5855)
    [ce59ce0d2f765fbe556eaa91016c38e22ebd7854]

- App

### :rocket: Improvements

- API
  - treat `uniqueidentifier` in MS SQL as a UUID (@Oreilles) (#5804) [bb14309b9c16aa29eac9422f105d310ce5a6cf03]
  - throw a 503 service unavailable when the storage adapter crashes during a file upload (@rijkvanzanten)
    [e2c9e15a981bd7034b1c5dad839a9816148aa594]
  - set the default TTL for cache to a more reasonable 10 minutes (from 30) (@rijkvanzanten)
    [02089a6227575a340bbf5b926cf9717a89941138]
- App
  - set the default value for boolean filters to `true`, preventing confusion around the state of the toggle in advanced
    filters (@rijkvanzanten) [4277de088988a65f9ea4ea18a4121488a24a8e87]
  - prevent unusable collections from being selected in the relational setup (@rijkvanzanten)
    [a5cba0dc7e3a1566095deb58d10297f3b7bbe9bd]
  - don't allow using `_contains` on a UUID (@rijkvanzanten) [4beccb6a8a9e33d0ae0e47333bfacd60741a91bc]
  - only close menu boxes when clicking on menu content, ignore menu box itself (@rijkvanzanten)
    [a40d75a184e2257256a0b1e33fcdcc696e9ad73b]
  - allow setting on-create and on-update triggers for many-to-one UUID fields (@rijkvanzanten)
    [3d3a508880f0fd51df8a8f05b990c0687fca53f5]
  - allow rendering a translations preview next to the language in the translations interface (@rijkvanzanten)
    [5c66c53478400261d80113edc3c32186d3fdb6f0]
  - allow the user to update it's own profile in the app recommended permissions (@cupcakearmy)
    [e7381b24906f5d584be47f0c360f852704af631d]
- drive-gcs
  - improve uploading performance (@rijkvanzanten) [5704cd46d28217ac464cea4d2a88356c80fb75f4]

### :bug: Bug Fixes

- API
  - fixed an issue that could cause updates on o2m items to fail (@MiniDigger) (#5763)
    [1cc990031751ddfb0834c3dfca796eb3e653918d]
  - fixed an issue that could cause `_or` filters to shortcircuit (@rijkvanzanten) (#5806)
    [bc8399c362534cb8215c4bb272fd66c870f9a9bc]
  - fixed an issue that would prevent nested one to many item updates to store the correct parent revision
    (@rijkvanzanten) [95307cee979940558fafd8f822bc9fe8083bd526]
- App
  - fixed custom fields on system collections not aligning to the configured sort order (#5810) (@rijkvanzanten)
    [33e0236cfe9c579982db9b3ae928d2bf478eb6e8]
  - fixed a small issue that would prevent the advanced filter field selection from allowing multiple nested fields from
    being opened (@rijkvanzanten) [158316f86318e83de5d5e6e203306a5603458c6d]
  - fixed an issue that would require non-null fields to be submitted in every GraphQL mutation (@rijkvanzanten)
    [246c55266b78ae063408dbc1b04d1797bd85e476]
  - fixed fallback interface for `boolean` type fields (@rijkvanzanten) [550621479e3b9173f963a0bd723595213f56dedb]
  - fixed an issue that would make custom field translations disappear when reordering the fields in settings
    (@rijkvanzanten) [b782eba859d0a91d08dfd39ab41e6952db0c94b7]
  - fixed an issue that would cause the relational setup to auto generate an invalid name when making a recursive
    many-to-many field (@rijkvanzanten) [bd6cab8989ea8a8af3b0848c51ee9b3fae289ab3]
  - fix collection search when using custom nav override structure (@Oreilles)
    [8590eec662364ce8c865b529394f271b8b46a1c7]
  - fixed an issue where dragging an event in the calendar layout could save with the wrong timezone when using a
    datetime field (@rijkvanzanten) [dee8160f184af4f041580d76ce88da5dc3eb0d12]
  - don't let v-error messages overflow the bounding box of the dialog (@rijkvanzanten)
    [374e6e5a7dd3d752a25c352df7ce5f661a5b15c1]
  - fixed an issue that would prevent the user from continuing in field setup when using an existing junction table for
    a many-to-many relationship (@rijkvanzanten) [2660c3995426dd3d8d36a8022893cddcd27ed53f]
  - fixed the highlight color of a selected folder in the move-folder dialog (@rijkvanzanten)
    [de0b9627365b392d4af0589a52b122cf0b5ec927]
- drive-azure
  - fixed an issue that would cause file reads from S3/Azure to be double-prefixed with the storage root option
    (@aidenfoxx) (#5788) [017646a8344f2457761a1c06b45fdd2294b522fe]
- drive-s3
  - fixed an issue that would cause file reads from S3/Azure to be double-prefixed with the storage root option
    (@aidenfoxx) (#5788) [017646a8344f2457761a1c06b45fdd2294b522fe]
  - fixed an issue that would cause issues when leaving ACL empty (@rijkvanzanten)
    [eb68195cd5cd72ab16b5480f80162e9c94b7d004]
  - fixed an issue that would prevent Range header requests from sending the correct chunk of data (@rijkvanzanten)
    [925c3fa3fa4b8ad34801ecb17c954e3b0c4a19a1]
- gatsby-source-directus
  - fixed static token support (@TheAzack9) [48cdf6e0835b6e077cb0641be30d49483c611439]
- schema
  - ignore views when reading tables in MS SQL (@wc-matteo) (#5816) [32f4fcf0c717f1d96e1e418e9f91e00fbb50ac8a]

### :memo: Documentation

- added additional information on sort setup (@benhaynes) [9687970a32af252ee723a6a1f398a3dd8bef50b9]
- fixed a couple typos in email-templates (@larssobota) (#5750) [e94626d8444aed57b8b4c5258d8e0cbdb5541b0e]
- made sure that the latest version of the Docker image is used when copy pasting the docker-compose example
  (@rijkvanzanten) [477c36d86771190f8c314b0fa641a86f3ee1a3fb]
- improved the issue template for new issues on GitHub (@benhaynes) [c0182d7b14e31e8fe9d3103082fcedcbbda5dd99]
- added a note on sending relational data to the Data Access page (@moekify) [5f4a24d45637fdb2b5b2cb024002c5b6434e35b0]
- fixed the links to the API reference in the environment variable overview (@cosminepureanu)
  [7f5e59b1174f5d1ce12103f823001d53f8364295]
- remove Patreon in favor of GitHub Sponsors (@benhaynes) [56ad3c04dd0b350905aa23f2483045219a1a6502]
