# bugs

- when adding all file sin cusotm view it adds same fiel multiple times

# Datei-Such- und Filterprogramm

Eine moderne Webanwendung zur effizienten Dateisuche und -filterung mit React und FastAPI.

## Projektstruktur

```
.
├── backend/
│   └── main.py         # FastAPI Backend
├── frontend/
│   ├── src/
│   │   ├── components/ # React Komponenten
│   │   ├── App.js      # Hauptanwendung
│   │   └── theme.js    # MUI Theme Konfiguration
│   └── package.json    # Frontend Abhängigkeiten
└── requirements.txt    # Backend Abhängigkeiten
```

## Installation

### Backend

1. Erstellen Sie eine virtuelle Umgebung:
```bash
python -m venv venv
source venv/bin/activate  # Unter Windows: venv\Scripts\activate
```

2. Installieren Sie die Abhängigkeiten:
```bash
pip install -r requirements.txt
```

3. Starten Sie den Backend-Server:
```bash
cd backend
uvicorn main:app --reload
```

### Frontend

1. Installieren Sie die Node.js-Abhängigkeiten:
```bash
cd frontend
npm install
```

2. Starten Sie den Frontend-Development-Server:
```bash
npm start
```

## Funktionen

- **Filterung**: Allgemeine und kategoriebasierte Filterung von Dateien
- **Visualisierung**: Flexible Dateipfad-Visualisierung mit Drag & Drop
- **Detailansicht**: Detaillierte Informationen zu ausgewählten Dateien
- **Responsive Design**: Moderne und benutzerfreundliche Oberfläche

## Technologie-Stack

- Frontend: React, Material-UI, react-beautiful-dnd
- Backend: FastAPI
- Styling: Material-UI Theme System
