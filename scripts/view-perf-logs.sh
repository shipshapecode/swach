#!/bin/bash

# Script to view performance logs from Swach
# Run this after launching and testing the production app

echo "=== Swach Performance Logs ==="
echo ""
echo "Recent logs (last 5 minutes):"
echo "=============================="

/usr/bin/log show --last 5m --predicate 'process == "Swach"' --style compact | grep -E "\[PERF\]|\[IPC\]" | tail -100

echo ""
echo "=============================="
echo "To see all logs, run:"
echo "  log show --last 10m --predicate 'process == \"Swach\"'"
echo ""
echo "To export to file:"
echo "  log show --last 10m --predicate 'process == \"Swach\"' > ~/Desktop/swach-logs.txt"
