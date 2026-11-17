#!/bin/sh
# Runs `next build` with a watchdog.
#
# On memory-constrained self-hosted builders, `next build` can finish its work
# and print the route table but never exit (open handles from app modules that
# page-data collection imported). Once the route table is printed the output on
# disk is complete, so wait a short grace period and then stop the process
# instead of blocking the image build forever.
set -u

LOG=/tmp/next-build.log
: >"$LOG"

echo "▶ next build (watchdog enabled)"
pnpm exec next build >"$LOG" 2>&1 &
BUILD_PID=$!

waited=0
while [ "$waited" -lt 9000 ]; do
    if grep -q "Route (app)" "$LOG" 2>/dev/null; then
        echo "✔ route table printed; waiting 120s for output to flush"
        sleep 120
        kill -TERM "$BUILD_PID" 2>/dev/null || true
        sleep 10
        kill -KILL "$BUILD_PID" 2>/dev/null || true
        pkill -KILL -f "pool_entry" 2>/dev/null || true
        break
    fi
    if ! kill -0 "$BUILD_PID" 2>/dev/null; then
        break
    fi
    sleep 10
    waited=$((waited + 10))
done

wait "$BUILD_PID" 2>/dev/null
cat "$LOG"

for path in .next/BUILD_ID .next/server .next/standalone/apps/web/server.js; do
    if [ ! -e "$path" ]; then
        echo "✖ next build output missing: $path" >&2
        exit 1
    fi
done

echo "✔ next build output complete"
