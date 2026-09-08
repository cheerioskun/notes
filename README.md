# Notes

Standalone HTML learning notes and explainers. Existing articles and their URLs are preserved.

The content directory is `posts/`. The morning archive is at `posts/mornings/index.html`; each lesson has a stable dated HTML filename. `posts/mornings/catalog.json` contains public metadata, and the archive index provides a dated reading list. Hosted lessons may use JavaScript and interactive visualizations without the limitations of an embedded chat preview.

There is no build step or dependency install. Serve `posts/` with any static server. The existing Cloudflare Pages site is https://notes-9fl.pages.dev/ . Confirm each new live page after publishing before reporting its deployment as verified.

## Publish a morning lesson

1. Read `posts/mornings/AGENTS.md`.
2. Write one complete self-contained HTML lesson, add its public metadata to the catalog, and update the archive index. Put the newest entry first. Existing dates and URLs remain stable; corrections are normal Git commits.
3. Validate local links and any new JavaScript, check the worked example, and commit all related changes together.
4. Verify the hosting result independently of the Git commit. If hosting cannot be verified, report the commit and the specific missing deployment evidence.

This repository is public. Private course materials, transcripts, learner assessments, and scheduling state belong in separate private storage and must never be committed here, including outside `posts/`.
