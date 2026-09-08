# Notes: repository-wide instructions

This repository is a tool for communicating ideas through readable, interactive explainers.

## Architecture and design authority

The owner authorizes changes to structure, navigation, presentation, shared components, and build tooling when they improve communication or simplify maintenance. A reusable component library is permitted when actual lessons justify it. Preserve existing lesson access where feasible; use redirects or compatibility routes when changing published paths.

## Git history is permanent

Never rewrite Git history. No force-pushes, rebasing or amending published commits, destructive branch resets, or history filtering. Apply changes with new forward commits and ordinary merges. Undo a published mistake with a new revert/fix commit. Before moving a branch, ensure the update is a fast-forward and preserve concurrent work.

## Public content and private learning state

The entire repository and its history are public. Commit only reader-facing content, public metadata, and generic implementation instructions. Keep private learner assessments, conversation excerpts, personal schedules, and private course materials in the designated private state outside this repository.

## Delivery

The existing Pages origin is https://notes-9fl.pages.dev/ . Content currently lives in posts/. Preserve the existing hosting integration when changing code. Hosted lessons may use JavaScript, visualizations, dynamic equations, and libraries without the embedded-chat renderer's restrictions. Choose responsive layouts and touch-friendly interactions.

For morning lessons, also read posts/mornings/AGENTS.md. Keep source commits and deployment verification distinct. Do not claim a live page was verified merely because a commit succeeded.
