#!/bin/bash

set -e

# we have deafult venv in this ws
cd backend

# Load environment variables
source config.env

echo "Starting Uvicorn server on port $BACKEND_PORT..."
uvicorn main:app --reload --port $BACKEND_PORT --host $BACKEND_HOST
