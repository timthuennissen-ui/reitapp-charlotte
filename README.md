# ReitApp Charlotte

Eine browserbasierte Web-App zur Organisation einer Reitbeteiligung, speziell für Mädchen um 11 Jahre.

## Funktionen

- **Reittagebuch**: Einträge mit Datum, Notizen, Gangarten und Sternebewertung
- **Kalender**: Monatsansicht mit Terminen und ToDos, zugeordnet zu Pferden
- **ToDos**: Tagesbezogene Aufgaben, die automatisch Tagebucheinträge erstellen können
- **Pferdeprofile**: Informationen zu den Pferden mit Bildern

## Technische Details

- Clientseitig, keine Backend-Abhängigkeiten
- Datenhaltung in IndexedDB (LocalStorage als Fallback)
- Offlinefähig
- Responsive Design mit pastellfarben für Kinder

## Lokales Ausführen

1. Klone das Repository
2. Öffne `index.html` in einem modernen Browser
3. Oder starte einen lokalen Server: `python3 -m http.server 8000`

## Deployment auf Github Pages

1. Pushe den Code in ein Github-Repository
2. Gehe zu Settings > Pages
3. Wähle Branch `main` oder `gh-pages` als Source
4. Die App ist unter `https://[username].github.io/reitapp-charlotte/` verfügbar

## Struktur

- `index.html`: Haupt-HTML
- `styles.css`: CSS-Stile
- `app.js`: Hauptskript
- `models.js`: Datenmodelle
- `db.js`: IndexedDB-Setup
- `state.js`: State-Management
- `ui.js`: UI-Komponenten und -Logik