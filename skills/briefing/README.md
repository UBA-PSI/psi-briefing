# psi-briefing — Claude skill

Packages the [psi-briefing](../../README.md) framework as a skill so Claude Code (or any Claude Agent SDK / Claude.ai setup that loads skills) can author self-contained HTML slide decks for you.

## What it does

Describe a talk — an outline, a set of notes, a retrospective — and Claude will:

1. Scaffold a deck from `references/starter.html` + `references/assets/`.
2. Give it a shape (title → section dividers → content → close).
3. Build each slide from the component catalog (`references/components.md`), using the right layout for the content.
4. Theme it (Bamberg blue/yellow, Midnight dark, or a custom palette from your brand colour).
5. Verify the render in a browser and, optionally, inline everything into one shareable file.

## Install

**Claude Code (personal):**
```bash
cp -R skills/briefing ~/.claude/skills/briefing
```

**Claude Code (per project):**
```bash
mkdir -p .claude/skills
cp -R skills/briefing .claude/skills/briefing
```

**Claude Agent SDK:** point your skills directory at `skills/`, or copy `briefing/` into the skills path your agent loads.

Then start (or restart) your session and ask, e.g. *"build me a psi-briefing deck for my project retrospective."* The skill triggers on requests to create slide decks / presentations / talks as HTML.

## What's inside

```
briefing/
├── SKILL.md                    # the skill instructions Claude reads
├── README.md                   # this file
└── references/
    ├── starter.html            # minimal working deck to copy
    ├── components.md           # full component catalog (mirror of docs/cookbook.md)
    └── assets/
        ├── briefing.css   # framework core
        ├── briefing.js    # runtime
        ├── bamberg.css         # blue/yellow theme
        └── midnight.css        # dark theme
```

Keep `references/assets/` in sync with the framework if you update it (`cp framework/* themes/* skills/briefing/references/assets/`).

Licensed **MIT**, like the rest of the project (fonts excepted — see the root LICENSE).
