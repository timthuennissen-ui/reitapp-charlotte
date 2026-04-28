// ui.js - UI-Komponenten und -Logik für ReitApp Charlotte

import state from './state.js';
import { Horse, DiaryEntry, CalendarEvent, Todo } from './models.js';

// DOM-Elemente
const nav = document.getElementById('nav');
const mainContent = document.getElementById('main-content');

// Navigation Event-Listener
nav.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-btn')) {
        const view = e.target.id.replace('nav-', '');
        state.setView(view);
        updateNavActive(view);
        renderView(view);
    }
});

// Aktive Nav-Button aktualisieren
function updateNavActive(view) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${view}`).classList.add('active');
}

// View rendern
function renderView(view) {
    mainContent.innerHTML = '';
    switch (view) {
        case 'diary':
            renderDiary();
            break;
        case 'calendar':
            renderCalendar();
            break;
        case 'todos':
            renderTodos();
            break;
        case 'horses':
            renderHorses();
            break;
    }
}

// Tagebuch rendern
function renderDiary() {
    const container = document.createElement('div');
    container.innerHTML = `
        <h2>Reittagebuch</h2>
        <button class="btn btn-large" id="add-diary-entry">Neuer Eintrag</button>
        <div id="diary-entries"></div>
    `;
    mainContent.appendChild(container);

    // Einträge anzeigen
    const entriesDiv = document.getElementById('diary-entries');
    state.diaryEntries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'diary-entry fade-in';
        entryDiv.innerHTML = `
            <h3>${new Date(entry.date).toLocaleDateString('de-DE')}</h3>
            <p>${entry.notes}</p>
            <p>Gangarten: ${entry.gaits.step ? 'Schritt ' : ''}${entry.gaits.trot ? 'Trab ' : ''}${entry.gaits.canter ? 'Galopp' : ''}</p>
            <div class="stars">
                ${Array.from({length: 5}, (_, i) => `<span class="star ${i < entry.rating ? 'active' : ''}">★</span>`).join('')}
            </div>
        `;
        entriesDiv.appendChild(entryDiv);
    });

    // Event-Listener für neuen Eintrag
    document.getElementById('add-diary-entry').addEventListener('click', () => showDiaryForm());
}

// Formular für neuen Tagebucheintrag
function showDiaryForm(relatedTodoId = null) {
    const form = document.createElement('form');
    form.className = 'fade-in';
    form.innerHTML = `
        <h3>Neuer Tagebucheintrag</h3>
        <input type="date" id="diary-date" required>
        <textarea id="diary-notes" placeholder="Was hast du heute gemacht?"></textarea>
        <div class="checkbox-group">
            <label class="checkbox-item"><input type="checkbox" id="gait-step"> Schritt</label>
            <label class="checkbox-item"><input type="checkbox" id="gait-trot"> Trab</label>
            <label class="checkbox-item"><input type="checkbox" id="gait-canter"> Galopp</label>
        </div>
        <div class="stars" id="rating-stars">
            ${Array.from({length: 5}, (_, i) => `<span class="star" data-rating="${i+1}">★</span>`).join('')}
        </div>
        <button type="submit" class="btn">Speichern</button>
        <button type="button" class="btn" id="cancel-diary">Abbrechen</button>
    `;
    mainContent.innerHTML = '';
    mainContent.appendChild(form);

    // Rating-Interaktion
    let rating = 0;
    document.getElementById('rating-stars').addEventListener('click', (e) => {
        if (e.target.classList.contains('star')) {
            rating = parseInt(e.target.dataset.rating);
            document.querySelectorAll('#rating-stars .star').forEach((star, i) => {
                star.classList.toggle('active', i < rating);
            });
        }
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('diary-date').value;
        const notes = document.getElementById('diary-notes').value;
        const gaits = {
            step: document.getElementById('gait-step').checked,
            trot: document.getElementById('gait-trot').checked,
            canter: document.getElementById('gait-canter').checked
        };
        const entry = new DiaryEntry(Date.now().toString(), date, notes, gaits, rating, relatedTodoId);
        await state.addDiaryEntry(entry);
        renderView('diary');
    });

    // Abbrechen
    document.getElementById('cancel-diary').addEventListener('click', () => renderView('diary'));
}

// Kalender rendern (vereinfacht für MVP)
function renderCalendar() {
    const container = document.createElement('div');
    container.innerHTML = `
        <h2>Kalender</h2>
        <button class="btn btn-large" id="add-calendar-event">Neuer Termin</button>
        <div id="calendar-events"></div>
    `;
    mainContent.appendChild(container);

    // Events anzeigen
    const eventsDiv = document.getElementById('calendar-events');
    state.calendarEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event fade-in';
        const horse = state.horses.find(h => h.id === event.horseId);
        eventDiv.innerHTML = `
            <h3>${event.title}</h3>
            <p>Datum: ${new Date(event.date).toLocaleDateString('de-DE')}</p>
            <p>Pferd: ${horse ? horse.name : 'Unbekannt'}</p>
        `;
        eventsDiv.appendChild(eventDiv);
    });

    // Event-Listener für neuen Termin
    document.getElementById('add-calendar-event').addEventListener('click', () => showCalendarForm());
}

// Formular für neuen Kalendertermin (vereinfacht)
function showCalendarForm() {
    const form = document.createElement('form');
    form.className = 'fade-in';
    form.innerHTML = `
        <h3>Neuer Termin</h3>
        <input type="text" id="event-title" placeholder="Titel" required>
        <input type="date" id="event-date" required>
        <select id="event-horse">
            <option value="">Pferd auswählen</option>
            ${state.horses.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
        </select>
        <button type="submit" class="btn">Speichern</button>
        <button type="button" class="btn" id="cancel-calendar">Abbrechen</button>
    `;
    mainContent.innerHTML = '';
    mainContent.appendChild(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const horseId = document.getElementById('event-horse').value;
        const event = new CalendarEvent(Date.now().toString(), title, date, horseId, false, null);
        await state.addCalendarEvent(event);
        renderView('calendar');
    });

    document.getElementById('cancel-calendar').addEventListener('click', () => renderView('calendar'));
}

// ToDos rendern
function renderTodos() {
    const container = document.createElement('div');
    container.innerHTML = `
        <h2>ToDos</h2>
        <button class="btn btn-large" id="add-todo">Neues ToDo</button>
        <ul id="todo-list"></ul>
    `;
    mainContent.appendChild(container);

    // ToDos anzeigen
    const list = document.getElementById('todo-list');
    state.todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <span>${todo.text} (${new Date(todo.date).toLocaleDateString('de-DE')})</span>
            <button class="btn" data-id="${todo.id}" ${todo.completed ? 'disabled' : ''}>Erledigt</button>
        `;
        list.appendChild(li);
    });

    // Event-Listener für Erledigt-Button
    list.addEventListener('click', async (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.textContent === 'Erledigt') {
            const todoId = e.target.dataset.id;
            const createEntry = confirm('Möchtest du einen Tagebucheintrag für dieses ToDo erstellen?');
            await state.completeTodo(todoId, createEntry);
            renderView('todos');
        }
    });

    // Event-Listener für neues ToDo
    document.getElementById('add-todo').addEventListener('click', () => showTodoForm());
}

// Formular für neues ToDo
function showTodoForm() {
    const form = document.createElement('form');
    form.className = 'fade-in';
    form.innerHTML = `
        <h3>Neues ToDo</h3>
        <input type="text" id="todo-text" placeholder="Was musst du tun?" required>
        <input type="date" id="todo-date" required>
        <select id="todo-horse">
            <option value="">Pferd auswählen (optional)</option>
            ${state.horses.map(h => `<option value="${h.id}">${h.name}</option>`).join('')}
        </select>
        <button type="submit" class="btn">Speichern</button>
        <button type="button" class="btn" id="cancel-todo">Abbrechen</button>
    `;
    mainContent.innerHTML = '';
    mainContent.appendChild(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('todo-text').value;
        const date = document.getElementById('todo-date').value;
        const horseId = document.getElementById('todo-horse').value || null;
        const todo = new Todo(Date.now().toString(), text, date, false, horseId);
        await state.addTodo(todo);
        renderView('todos');
    });

    document.getElementById('cancel-todo').addEventListener('click', () => renderView('todos'));
}

// Pferde rendern
function renderHorses() {
    const container = document.createElement('div');
    container.innerHTML = `
        <h2>Pferde</h2>
        <button class="btn btn-large" id="add-horse">Neues Pferd</button>
        <div id="horse-list"></div>
    `;
    mainContent.appendChild(container);

    // Pferde anzeigen
    const list = document.getElementById('horse-list');
    state.horses.forEach(horse => {
        const horseDiv = document.createElement('div');
        horseDiv.className = 'horse-card fade-in';
        horseDiv.innerHTML = `
            <h3>${horse.name}</h3>
            ${horse.image ? `<img src="${horse.image}" alt="${horse.name}" style="max-width: 200px;">` : ''}
            <p>Lieblingsleckerlie: ${horse.favoriteTreat}</p>
            <p>Fellfarbe: ${horse.coatColor}</p>
            <p>Charakter: ${horse.characteristics.join(', ')}</p>
        `;
        list.appendChild(horseDiv);
    });

    // Event-Listener für neues Pferd
    document.getElementById('add-horse').addEventListener('click', () => showHorseForm());
}

// Formular für neues Pferd (vereinfacht)
function showHorseForm() {
    const form = document.createElement('form');
    form.className = 'fade-in';
    form.innerHTML = `
        <h3>Neues Pferd</h3>
        <input type="text" id="horse-name" placeholder="Name" required>
        <input type="file" id="horse-image" accept="image/*">
        <input type="text" id="horse-treat" placeholder="Lieblingsleckerlie">
        <input type="text" id="horse-color" placeholder="Fellfarbe">
        <textarea id="horse-characteristics" placeholder="Charakter (kommagetrennt)"></textarea>
        <button type="submit" class="btn">Speichern</button>
        <button type="button" class="btn" id="cancel-horse">Abbrechen</button>
    `;
    mainContent.innerHTML = '';
    mainContent.appendChild(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('horse-name').value;
        const treat = document.getElementById('horse-treat').value;
        const color = document.getElementById('horse-color').value;
        const characteristics = document.getElementById('horse-characteristics').value.split(',').map(s => s.trim());
        let image = null;
        const fileInput = document.getElementById('horse-image');
        if (fileInput.files[0]) {
            image = await toBase64(fileInput.files[0]);
        }
        const horse = new Horse(Date.now().toString(), name, image, treat, color, characteristics);
        await state.addHorse(horse);
        renderView('horses');
    });

    document.getElementById('cancel-horse').addEventListener('click', () => renderView('horses'));
}

// Hilfsfunktion für Base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
    await state.loadData();
    renderView(state.currentView);
});

// State-Änderungen abonnieren
state.subscribe(() => {
    renderView(state.currentView);
});