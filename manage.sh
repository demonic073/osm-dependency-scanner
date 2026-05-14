#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -L)"
exec python3 "$SCRIPT_DIR/manage.py" "$@"
