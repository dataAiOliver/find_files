# File Search and Filter Application

A modern web application for efficient file searching and filtering using React and FastAPI.

## Project Structure

```
.
├── backend/
│   ├── main.py         # FastAPI Backend
│   ├── config.env      # Backend configuration
│   └── data/           # Data files
├── frontend/
│   ├── src/
│   │   ├── components/ # React Components
│   │   ├── App.js      # Main Application
│   │   └── theme.js    # MUI Theme Configuration
│   └── package.json    # Frontend Dependencies
├── startbackend.sh     # Backend start script
├── startfrontend.sh    # Frontend start script
└── requirements.txt    # Backend Dependencies
```

## Configuration

The application uses environment variables for configuration. These are stored in `backend/config.env`:

```env
# MongoDB Configuration
MONGODB_HOST=localhost
MONGODB_PORT=1003
MONGODB_DB_NAME=dummydb
MONGODB_COLLECTION_NAME=dummycollection

# Backend Configuration
BACKEND_HOST=localhost
BACKEND_PORT=2033

# Frontend Configuration
FRONTEND_HOST=localhost
FRONTEND_PORT=2034
```

## Installation

### Backend

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

## Running the Application

1. Make the start scripts executable:
```bash
chmod +x startbackend.sh startfrontend.sh
```

2. Start the backend server:
```bash
./startbackend.sh
```
The backend will run on the port specified in `config.env` (default: 2033)

3. In a new terminal, start the frontend:
```bash
./startfrontend.sh
```
The frontend will run on the port specified in `config.env` (default: 2034)

4. Access the application in your browser at `http://localhost:2034`

## Development

- Backend API documentation is available at `http://localhost:2033/docs`
- The application uses environment variables for configuration, which are loaded from `backend/config.env`
- Frontend automatically connects to the backend using the configured host and port
