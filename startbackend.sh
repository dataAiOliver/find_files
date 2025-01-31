#!/bin/bash

set -e

# we have deafult venv in this ws
cd backend

echo "Starting Uvicorn server..."
uvicorn main:app --reload
