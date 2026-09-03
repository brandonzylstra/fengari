#!/bin/sh
# Run every probe in this directory through both a real lua and this checkout
# of fengari, and report how many lines differ.
#
#   ./compare.sh /path/to/lua-5.3.6/src/lua
#
# A difference is not automatically a bug: some are deliberate (fengari's %k
# and %l strftime extensions) and some are version drift if the binary is not
# a 5.3. See README.md.

set -e

LUA=${1:-lua}
DIR=$(dirname "$0")
OUT=${TMPDIR:-/tmp}/fengari-conformance
mkdir -p "$OUT"

printf '%-14s %8s %8s %s\n' probe lua fengari differing
total=0
for f in "$DIR"/*.lua; do
    name=$(basename "$f" .lua)
    "$LUA" "$f" > "$OUT/$name.lua.txt" 2>&1 || true
    node "$DIR/run.js" "$f" > "$OUT/$name.fengari.txt" 2>&1 || true
    n=$(diff "$OUT/$name.lua.txt" "$OUT/$name.fengari.txt" | grep -c '^<' || true)
    total=$((total + n))
    printf '%-14s %8s %8s %s\n' "$name" \
        "$(wc -l < "$OUT/$name.lua.txt" | tr -d ' ')" \
        "$(wc -l < "$OUT/$name.fengari.txt" | tr -d ' ')" "$n"
done
echo "total differing lines: $total"
echo "output kept in $OUT"
