# Media review gate

Every committed walkthrough must be reviewed after `pnpm media:inspect` and
before release. The temporary contact sheet printed by the command is the
review artifact; it is intentionally not committed.

| Review | Required decision | Approver | Date |
| --- | --- | --- | --- |
| Engineering | Deterministic interactions complete, no console errors, and the media matches the current build. | Pending | Pending |
| Visual / product | Story, captions, framing, legibility, and pacing meet the RevoGrid presentation bar. | Pending | Pending |

Replace both `Pending` values in a release pull request. Branch protection for
the repository must require both review roles before media changes can merge.
