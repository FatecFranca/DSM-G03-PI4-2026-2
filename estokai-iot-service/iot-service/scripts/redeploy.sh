#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "${script_dir}/.." && pwd)"

cd "${project_dir}"

echo "Stopping running containers..."
docker compose down --remove-orphans

echo "Building and starting containers..."
docker compose up --build -d --remove-orphans

echo "Current container status:"
docker compose ps
