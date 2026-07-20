#!/usr/bin/env bash
# bump.sh — publish the working tree as the single init commit.
#
# This repo intentionally carries exactly one commit. bump.sh folds whatever is
# in the working tree into it and republishes:
#
#   1. raise the patch version in pyproject.toml (x.y.z -> x.y.z+1)
#   2. promote the [Unreleased] block in CHANGELOG.md into the new version
#   3. stage everything, `git commit --amend --no-edit`
#   4. `git push --force-with-lease`
#
# Run it from anywhere; it operates on its own repo.
set -euo pipefail
cd "$(dirname "$0")"

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

# --- 3 & 4. fold into the init commit and publish -------------------------
git add -A
git commit --amend --no-edit
git push --force-with-lease
