# Morning archive authoring

Scope: this directory and its descendants. Preserve the surrounding notes site and existing URLs. All repository content and Git history are public.

- Commit only standalone lessons and public metadata. Never include private transcripts, learner assessments, private course slides, account details, or personalized diagnostic notes anywhere in this repository.
- Lessons are hosted on Cloudflare Pages and may use JavaScript freely where it improves teaching: simulations, plots, controls, and dynamically rendered equations are allowed. Do not constrain hosted lessons to the ChatGPT iPhone artifact renderer. Use viewport metadata, body text at least 16px, responsive layout, and usable touch controls.
- Prefer portable HTML with colocated assets and a working initial state. Use the libraries and interaction complexity the explanation needs; there is no blanket inline-only, small-JavaScript, or no-JavaScript-fallback requirement. Keep loading and errors intelligible.
- Focus the central question while developing a complete reading path. Establish the concrete problem and necessary context, sustain a worked example through intermediate states, and let that example motivate the formal machinery. Connect sections through questions raised by the preceding material. End with a useful changed assumption and transferable insight. Concise chat is not a length cap for a standalone lesson; remove repetition, not explanatory steps. Make visuals reveal the mechanism rather than merely decorate results. Cite primary technical sources. Distinguish simulations, illustrative output, and measured command output.
- Keep titles, dates, estimated duration, filenames, and summaries consistent between catalog.json and index.html. Filenames use YYYY-MM-DD-topic.html. Preserve dated URLs; revisions use Git history.
- Add a link to index.html from each lesson. The archive index links to ../index.html for all notes. Preserve existing index entries.
- Read the latest branch head before editing. Validate changed local links, inline JavaScript syntax, and one meaningful model case. Commit article, catalog, and index changes atomically. Never force-push or overwrite concurrent changes.
- A successful commit does not prove successful hosting. Verify the live page or deployment status before claiming it is live.
- Scheduling and learner evidence are maintained privately. Do not invent learner answers, topic pacing, or evidence of retention. When the private state is unavailable, report that limitation rather than reconstructing personal details into this public repository.

## Visual variety between lessons

- Give each new lesson a deliberate visual identity suited to its subject. Inspect the last few lessons before choosing the next design, and vary composition, typography, palette, illustration style, or interaction form in ways a reader will notice. Repeatedly recoloring the same page template is insufficient.
- Fun, whimsy, and expressive colors are welcome. Possible directions include a field notebook, comic panels, a retro control room, a transit map, a colorful magazine, or cut-paper diagrams. These are examples to explore, not a fixed rotation or a requirement to force a metaphor onto every topic.
- Let the mechanism suggest the visual treatment: a scheduling timeline can become a dispatch board; a queue can become a playful procession. Keep the visual language coherent within a lesson and make illustrations and interactions help explain the behavior.
- Reuse components and accessible behaviors while allowing different page structures and visual treatments. Shared code must not force every article into the same visible shell.
- Preserve the full reading path, clear hierarchy, readable prose, legible code and equations, sufficient contrast, responsive layouts, touch-friendly controls, and reduced-motion support. Playfulness should make an explanation inviting without interrupting sustained reading.
