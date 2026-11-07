#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "${script_dir}/.." && pwd)"

service="${1:-app}"

cd "${project_dir}"

case "${service}" in
  app|mosquitto|rabbitmq)
    docker compose logs -f "${service}"
    ;;
  all)
    docker compose logs -f
    ;;
  *)
    echo "Usage: bash scripts/logs.sh [app|mosquitto|rabbitmq|all]"
    exit 1
    ;;
esac
