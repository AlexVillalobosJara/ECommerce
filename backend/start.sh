#!/usr/bin/env bash
# Startup script for Render - runs migrations before starting the server
set -o errexit

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Starting Gunicorn server..."
exec gunicorn tenants_project.wsgi:application
