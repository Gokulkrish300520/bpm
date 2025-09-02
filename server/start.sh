#!/bin/bash

# Update apt repositories and install system libs required by WeasyPrint
# apt-get update && apt-get install -y libcairo2 libpango1.0-0 libgdk-pixbuf2.0-0 libffi-dev libgobject-2.0-0

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn to serve the Django app
exec gunicorn server.wsgi --log-file -
