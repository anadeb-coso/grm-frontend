# Change Log

All notable changes to this project will be documented in this file.

## 2023-04-23

### Added

- Added ReadMe deployment and development instruction and Changelog.md

### Changed

- Changed the commune fetching to only fetch user cell since they are reporting only items from that cell.
- Improved translation for Kinyarwanda to remove typos and cater for Pilot feedbacks
- Changed `"step_2_ongoing_hint"` to `"Is multiple occurrences?",` to avoid confusion in readers previously was `"Current event or multiple occurrences"`

### Fixed

- Fixed issue with storage getting full and causing crashes and delays when reporting an issues with slow internet. This was case for Rwanda with a lot of administrative levels
- Resolved bug in module D causing unexpected behavior.
