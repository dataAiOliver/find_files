#!/bin/bash

set -e

# Load environment variables
source backend/config.env

# Set React environment variables
export PORT=$FRONTEND_PORT
export REACT_APP_API_URL=http://${BACKEND_HOST}:${BACKEND_PORT}

cd frontend
npm start
