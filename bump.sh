#!/usr/bin/env bash
# bump.sh — publish the working tree as the single init commit.
#
# This repo intentionally carries exactly one commit. bump.sh folds whatever is
# in the working tree into it and republishes:
#
#   1. raise the patch version in pyproject.toml (x.y.z -> x.y.z+1)
#   2. promote the [Unreleased] block in CHANGELOG.md into the new version
#   3. rebuild the bundles (pip: druids/static, npm: dist) so the shipped
#      contract manifests are stamped with the new version (gen-contracts reads
#      it from pyproject.toml)
#   4. stage everything, `git commit --amend --no-edit`
#   5. force-push, leased on the exact remote commit checked in step 0
#
# 0. Before any of that it fetches and REFUSES to run unless the local init
#    commit is exactly the one published. Every publish rewrites history, so a
#    stale checkout (another machine published meanwhile) would otherwise
#    silently replace the newer release with an older tree under a re-used
#    version number. That happened once: 1.0.5-1.0.9 were overwritten by a
#    "1.0.5" built on 1.0.4 (see CHANGELOG 1.0.10).
#
#    To deliberately replace what is published (e.g. restoring a lost
#    release), pass the remote commit you mean to discard:
#        ./bump.sh --replace <full remote sha>
#    The new version must still end up above the published one.
#
# Run it from anywhere; it operates on its own repo.
set -euo pipefail
cd "$(dirname "$0")"

branch="main"
replace=""
if [[ "${1:-}" == "--replace" ]]; then
    replace="${2:?bump.sh: --replace needs the remote commit sha to discard}"
elif [[ $# -gt 0 ]]; then
    echo "usage: bump.sh [--replace <remote sha>]" >&2
    exit 2
fi

fail() {
    echo "bump.sh: $*" >&2
    exit 1
}

# true when version $1 < $2
version_lt() {
    [[ "$1" != "$2" && "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -1)" == "$1" ]]
}

# --- 0. never publish over a release this tree doesn't contain ------------
[[ "$(git symbolic-ref --short HEAD)" == "$branch" ]] || fail "check out $branch first"
git fetch --quiet origin "$branch" || fail "cannot fetch origin/$branch — refusing to publish blind"
remote_sha="$(git rev-parse "origin/$branch")"
local_sha="$(git rev-parse HEAD)"
remote_version="$(git show "origin/$branch:pyproject.toml" | sed -nE 's/^version = "(.*)"/\1/p' | head -1)"

if [[ "$local_sha" != "$remote_sha" ]]; then
    if [[ "$replace" != "$remote_sha" ]]; then
        fail "origin/$branch is ${remote_sha:0:7} (v$remote_version) but this tree is built on ${local_sha:0:7}.
    Someone published since this checkout, or it is stale. Bring your changes onto
    origin/$branch first (e.g. stash, reset --hard origin/$branch, stash pop).
    Only if you really mean to discard ${remote_sha:0:7}: bump.sh --replace $remote_sha"
    fi
    echo "bump.sh: --replace: discarding published ${remote_sha:0:7} (v$remote_version)"
elif [[ -n "$replace" ]]; then
    fail "--replace given but HEAD already is origin/$branch — nothing to replace"
fi

pyproject="pyproject.toml"
package="package.json"
changelog="druids/CHANGELOG.md"   # repo-root CHANGELOG.md is a symlink to this

# --- 1. bump patch version (kept in lockstep across both manifests) -------
current="$(sed -nE 's/^version = "(.*)"/\1/p' "$pyproject" | head -1)"
if [[ -z "$current" ]]; then
    echo "bump.sh: could not read version from $pyproject" >&2
    exit 1
fi
pkg_current="$(sed -nE 's/^[[:space:]]*"version": "(.*)",?/\1/p' "$package" | head -1)"
if [[ "$pkg_current" != "$current" ]]; then
    echo "bump.sh: version mismatch — $pyproject is $current but $package is $pkg_current; align them first" >&2
    exit 1
fi
IFS='.' read -r major minor patch <<<"$current"
next="$major.$minor.$((patch + 1))"
if [[ -n "$remote_version" ]] && ! version_lt "$remote_version" "$next"; then
    fail "next version $next is not above the published v$remote_version — refusing to re-use a version"
fi
sed -i -E "s/^version = \".*\"/version = \"$next\"/" "$pyproject"
sed -i -E "s/^([[:space:]]*\"version\": \")[^\"]*(\",?)/\1$next\2/" "$package"

# --- 2. promote [Unreleased] -> [next] in the changelog -------------------
today="$(date +%Y-%m-%d)"
# Insert a fresh version header right after "## [Unreleased]", leaving the
# Unreleased block empty at the top for the next round of notes.
awk -v ver="$next" -v date="$today" '
    /^## \[Unreleased\]/ && !done {
        print
        print ""
        print "## [" ver "] — " date
        done = 1
        next
    }
    { print }
' "$changelog" >"$changelog.tmp" && mv "$changelog.tmp" "$changelog"

echo "bump.sh: $current -> $next"

# --- 3. restamp the shipped manifests --------------------------------------
# gen-contracts stamps druids/static/*.json from pyproject.toml, so the build
# has to run *after* the bump or the manifests ship the previous version and a
# consumer reading druids.registry.json concludes it has nothing to adopt.
npm run build
for manifest in druids/static/druids.components.json druids/static/druids.registry.json druids/static/druids.tokens.json; do
    stamped="$(sed -nE 's/^[[:space:]]*"version": "(.*)",?/\1/p' "$manifest" | head -1)"
    if [[ "$stamped" != "$next" ]]; then
        echo "bump.sh: $manifest is stamped $stamped, expected $next — build did not run?" >&2
        exit 1
    fi
done

# the npm entry point is installed straight from the commit (`npm i github:...`),
# so it has to be in the tree the same way the wheel's bundle is.
for artifact in dist/druids.js dist/types/index.d.ts; do
    [[ -s "$artifact" ]] || fail "$artifact missing after the build — npm consumers would install an empty package"
done

# --- 4 & 5. fold into the init commit and publish -------------------------
git add -A
git commit --amend --no-edit
git push --force-with-lease="$branch:$remote_sha" origin "HEAD:$branch"
