# Releasing

How a release is cut, what runs automatically, and what to check when something
fails. Written down because this is the kind of process you do twice a year and
have forgotten by the second time.

If you only want the four commands, jump to [Cutting a release](#cutting-a-release).

## What runs automatically

Three workflows, in `.github/workflows/`. None of them installs anything: the
project has no dependencies and no lockfile, so `npm ci` would fail and a cache
would have nothing to cache. Node is on the runner only to execute `tools/`.

| Workflow | Runs when | What it does |
|---|---|---|
| `ci.yml` | every push and PR | Rebuilds both decks from their Markdown, builds a self-contained file, checks that the duplicated copies are in sync, and fails if the pre-rename name reappears in a tracked file. |
| `pages.yml` | every push to `main` | Publishes <https://uba-psi.github.io/psi-briefing/> – the landing page plus both decks, all rebuilt from source. |
| `release.yml` | a `v*` tag, or manually | Builds the release assets and creates the GitHub release. Run manually and it builds everything but creates no release: a dry run. |

The decks are always **rebuilt from the Markdown**, never copied from a tracked
HTML file. That is deliberate: a deck that has drifted from the source shipped
beside it is worse than no deck, and rebuilding makes every push a build check.

## Cutting a release

Say the new version is `1.2.0`.

```bash
# 1. the version, in the one place that holds it. --no-git-tag-version because
#    the tag is pushed by hand in step 4, after the notes exist.
npm version 1.2.0 --no-git-tag-version

# 2. the release notes: a new section at the top of CHANGELOG.md, headed
#    exactly "## 1.2.0 – 2026-11-04" (the heading is parsed, see below)

# 3. rehearse locally, then as a dry run on the runner
tools/sync-assets.sh --check
node tools/md-to-deck.mjs examples/tutorial.md -o examples/tutorial.html
tools/build-deck.sh examples/tutorial.html -o /tmp/tutorial.html
gh workflow run release.yml          # builds everything, creates no release

# 4. tag and push. This is the step that publishes.
git commit -am "Release 1.2.0"
git push origin main
git tag -a v1.2.0 -m "psi-briefing 1.2.0"
git push origin v1.2.0
```

Step 3 is worth not skipping. The first time this workflow ran, a check inside it
would have failed the release for a deck that was in fact correct (see
[The self-containment check](#the-self-containment-check)), and the dry run is
where that surfaced instead of at the tag.

## What the release contains

| Asset | What it is |
|---|---|
| `psi-briefing-<version>.tar.gz` · `.zip` | The tagged tree, plus the built decks under `dist/` and `examples/`. Identical contents in both formats. |
| `example-deck.html` | One self-contained file. Download, double-click, works offline. |
| `tutorial.html` | The same, and it teaches the format by being written in it. |
| `SHA256SUMS` | Checksums for the four above. |

The two decks are attached individually as well as being inside the archives,
because they are what most people want from a release page: something to open
before deciding whether to download anything.

The archive body comes from `git archive` **of the tag**, not from the runner's
working tree. So the source inside a release is exactly the source at that tag and
cannot contain anything a build step generated. The built decks are then added
under the same prefix; they are the only content that is not in the tag.
`docs/site/` and `.github/` are removed – the website and the CI are the project's
own plumbing, not part of what you install.

## The guards, and what to do when one fails

The workflow refuses to build before it has checked three things. All three fail
loudly with a `::error::` line naming the mismatch.

**`tag is v1.2.0 but package.json says 1.1.0`**
You tagged without bumping, or bumped without committing before tagging. Delete
the tag, fix, re-tag:

```bash
git tag -d v1.2.0 && git push origin :refs/tags/v1.2.0
```

**`CHANGELOG.md has no section headed '## 1.2.0'`**
The heading must start with `## ` followed by the bare version, then a space or
the end of the line. Tested:

| Heading | |
|---|---|
| `## 1.2.0 – 2026-11-04` | matches, and is the form already in the file |
| `## 1.2.0 - 2026-11-04` | matches |
| `## 1.2.0` | matches |
| `## v1.2.0` | **no match** |
| `## Version 1.2.0` | **no match** |

The same heading is parsed to produce the release notes: everything from
that line to the next `## ` becomes the body of the GitHub release. If the notes
come out empty the workflow fails rather than publishing a blank release.

**`stale: skills/briefing/references/...`**
`tools/sync-assets.sh --check` found drift. Four framework and theme files, plus
the component catalog, exist in two places so that the skill is self-contained.
Run `tools/sync-assets.sh` to copy the originals over the copies, and commit the
result.

One consequence worth remembering: because `docs/cookbook.md` is kept
byte-identical as `skills/briefing/references/components.md`, **a relative link
that is correct in one is dead in the other**. Links added to that file have to be
absolute repository URLs. This has been fixed twice; it will happen a third time.

## The self-containment check

`tools/build-deck.sh` verifies that nothing external survives inlining, and the
release workflow checks again on the finished assets. That second check looks only
at what the browser fetches without being asked:

```
src="…"    a stylesheet <link>    url(…)    @import
```

It deliberately does **not** look at `<a href>`. The first version did, and flagged
`tutorial.html`, which links to psi-slides in the text of a slide. A hyperlink a
reader may click is not a dependency. If you ever tighten this check, calibrate it
in both directions – inject a `<script src="https://…">` into a real deck and
confirm it is caught, then confirm an ordinary link still is not.

## First-time setup, already done

Recorded so that a fork or a rebuild does not have to rediscover it.

- **Pages** needs Settings → Pages → Source set to **GitHub Actions**, once. Until
  it is, `pages.yml` builds fine and fails at the deploy step with
  `Creating Pages deployment failed … HttpError: Not Found`.
- **`release.yml` needs `permissions: contents: write`** to create a release. It
  uses `gh`, which is preinstalled on the runner, rather than a third-party
  action – a project with no dependencies anywhere else should not make its
  release path the exception.
- The repository was created on GitHub with a licence template, which produced an
  initial commit with an unrelated history. It was joined by rebasing local history
  onto it rather than force-pushing over it.

## Deleting a release

A release is undoable; a tag people have already fetched is less so. If you have
to:

```bash
gh release delete v1.2.0 --yes        # removes the release and its assets
git push origin :refs/tags/v1.2.0     # removes the tag from GitHub
git tag -d v1.2.0                     # and locally
```

Prefer cutting `1.2.1` over rewriting `1.2.0` once anyone could have downloaded it.

## Versioning

[Semantic versioning](https://semver.org/). For this project that means:

- **major** – a class name, a directive or a JS API that existing decks use is
  renamed or removed. Someone's deck stops rendering correctly.
- **minor** – new components, new directives, new tool flags. Existing decks are
  unaffected.
- **patch** – fixes and documentation. No new surface.

The public surface is larger than it looks: every class name in
[`docs/cookbook.md`](docs/cookbook.md), every directive in
[`docs/markdown.md`](docs/markdown.md), the CLI flags in
[`tools/README.md`](tools/README.md), and `window.Briefing.barChart()`. Decks are
plain HTML that people edit by hand, so a renamed class is a breaking change even
though nothing imports it.
