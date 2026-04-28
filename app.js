// app.js - Hauptdatei für ReitApp Charlotte

// Datenmodelle
class Horse {
    constructor(id, name, image, favoriteTreat, coatColor, characteristics) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.favoriteTreat = favoriteTreat;
        this.coatColor = coatColor;
        this.characteristics = characteristics;
    }
}

class DiaryEntry {
    constructor(id, date, notes, gaits, rating, relatedTodoId = null) {
        this.id = id;
        this.date = date;
        this.notes = notes;
        this.gaits = gaits;
        this.rating = rating;
        this.relatedTodoId = relatedTodoId;
    }
}

class CalendarEvent {
    constructor(id, title, date, horseId, isRecurring, recurrenceType, todos = []) {
        this.id = id;
        this.title = title;
        this.date = date;
        this.horseId = horseId;
        this.isRecurring = isRecurring;
        this.recurrenceType = recurrenceType;
        this.todos = todos;
    }
}

class Todo {
    constructor(id, text, date, completed = false, horseId = null) {
        this.id = id;
        this.text = text;
        this.date = date;
        this.completed = completed;
        this.horseId = horseId;
    }
}

// IndexedDB Setup
class Database {
    constructor() {
        this.dbName = 'ReitAppCharlotteDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('horses')) {
                    db.createObjectStore('horses', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('diaryEntries')) {
                    db.createObjectStore('diaryEntries', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('calendarEvents')) {
                    db.createObjectStore('calendarEvents', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('todos')) {
                    db.createObjectStore('todos', { keyPath: 'id' });
                }
            };
        });
    }

    async getAll(storeName) {
        await this.init();
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, item) {
        await this.init();
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new Database();

// App State
class AppState {
    constructor() {
        this.horses = [];
        this.diaryEntries = [];
        this.calendarEvents = [];
        this.todos = [];
        this.currentView = 'diary';
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener());
    }

    async loadData() {
        this.horses = await db.getAll('horses');
        this.diaryEntries = await db.getAll('diaryEntries');
        this.calendarEvents = await db.getAll('calendarEvents');
        this.todos = await db.getAll('todos');
        this.notify();
    }

    async saveData(storeName, data) {
        if (Array.isArray(data)) {
            for (const item of data) {
                await db.update(storeName, item);
            }
        } else {
            await db.update(storeName, data);
        }
    }

    async addHorse(horse) {
        this.horses.push(horse);
        await this.saveData('horses', horse);
        this.notify();
    }

    async saveDiaryEntry(entry) {
        const existingById = this.diaryEntries.find(e => e.id === entry.id);
        const existingByDate = this.diaryEntries.find(e => e.date === entry.date);
        if (existingById) {
            existingById.notes = entry.notes;
            existingById.gaits = entry.gaits;
            existingById.rating = entry.rating;
            existingById.relatedTodoId = entry.relatedTodoId;
            await this.saveData('diaryEntries', existingById);
        } else if (existingByDate) {
            existingByDate.notes = entry.notes;
            existingByDate.gaits = entry.gaits;
            existingByDate.rating = entry.rating;
            existingByDate.relatedTodoId = entry.relatedTodoId;
            await this.saveData('diaryEntries', existingByDate);
        } else {
            this.diaryEntries.push(entry);
            await this.saveData('diaryEntries', entry);
        }
    }

    async addDiaryEntry(entry) {
        await this.saveDiaryEntry(entry);
        this.notify();
    }

    getDiaryEntryForDate(date) {
        return this.diaryEntries.find(entry => entry.date === date);
    }

    async addCalendarEvent(event) {
        this.calendarEvents.push(event);
        await this.saveData('calendarEvents', event);
        this.notify();
    }

    async addTodo(todo) {
        this.todos.push(todo);
        await this.saveData('todos', todo);
        this.notify();
    }

    async completeTodo(todoId, createDiaryEntry = false) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.completed = true;
            await this.saveData('todos', todo);
            if (createDiaryEntry) {
                const existingEntry = this.getDiaryEntryForDate(todo.date);
                if (existingEntry) {
                    const noteLine = existingEntry.notes ? existingEntry.notes + '\n\n' : '';
                    existingEntry.notes = noteLine + `Erledigte ToDo: ${todo.text}`;
                    await this.saveDiaryEntry(existingEntry);
                } else {
                    const entry = new DiaryEntry(
                        Date.now().toString(),
                        todo.date,
                        `Erledigte ToDo: ${todo.text}`,
                        { step: false, trot: false, canter: false },
                        3,
                        todoId
                    );
                    await this.addDiaryEntry(entry);
                }
            }
            this.notify();
        }
    }

    getTodosForDate(date) {
        return this.todos.filter(todo => todo.date === date).sort((a, b) => a.completed - b.completed);
    }

    getEventsForMonth(year, month) {
        const monthEvents = [];
        this.calendarEvents.forEach(event => {
            const eventDate = new Date(event.date);
            if (event.isRecurring && event.recurrenceType === 'weekly') {
                const firstOfMonth = new Date(year, month, 1);
                const lastOfMonth = new Date(year, month + 1, 0);
                let current = new Date(event.date);
                while (current <= lastOfMonth) {
                    if (current >= firstOfMonth) {
                        monthEvents.push({ ...event, date: current.toISOString().split('T')[0] });
                    }
                    current.setDate(current.getDate() + 7);
                }
            } else {
                if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                    monthEvents.push(event);
                }
            }
        });
        return monthEvents.sort((a, b) => a.date.localeCompare(b.date));
    }

    setView(view) {
        this.currentView = view;
        this.notify();
    }
}

const state = new AppState();

// UI
const nav = document.getElementById('nav');
const mainContent = document.getElementById('main-content');

function updateNavActive(view) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`nav-${view}`);
    if (btn) btn.classList.add('active');
}

function renderView(view) {
    mainContent.innerHTML = '';
    switch (view) {
        case 'diary': renderDiary(); break;
        case 'calendar': renderCalendar(); break;
        case 'todos': renderTodos(); break;
        case 'horses': renderHorses(); break;
        default: renderDiary(); break;
    }
}

function renderDiary() {
    const container = document.createElement('div');
    container.className = 'page-card';
    container.innerHTML = `
        <h2 class="section-title">Reittagebuch</h2>
        <p class="section-intro">Hier kannst du eintragen, was du heute mit deinem Pferd erlebt hast.</p>
        <button class="btn btn-large" id="add-diary-entry">Neuer Eintrag</button>
        <div id="diary-entries"></div>
    `;
    mainContent.appendChild(container);

    const entriesDiv = document.getElementById('diary-entries');
    if (state.diaryEntries.length === 0) {
        entriesDiv.innerHTML = '<p>Hier wird dein Reittagebuch beginnen. Drücke oben auf "Neuer Eintrag".</p>';
    } else {
        state.diaryEntries.sort((a, b) => b.date.localeCompare(a.date)).forEach(entry => {
            const completedTodos = state.getTodosForDate(entry.date).filter(todo => todo.completed);
            const entryDiv = document.createElement('div');
            entryDiv.className = 'diary-entry fade-in';
            entryDiv.innerHTML = `
                <div class="entry-header">
                    <div>
                        <h3>${new Date(entry.date).toLocaleDateString('de-DE')}</h3>
                        <p>Gangarten: ${entry.gaits.step ? 'Schritt ' : ''}${entry.gaits.trot ? 'Trab ' : ''}${entry.gaits.canter ? 'Galopp' : ''}</p>
                    </div>
                    <button class="btn edit-entry" data-id="${entry.id}">Bearbeiten</button>
                </div>
                <p>${entry.notes || 'Keine Notizen'}</p>
                <div class="stars">
                    ${Array.from({ length: 5 }, (_, i) => `<span class="star ${i < entry.rating ? 'active' : ''}">★</span>`).join('')}
                </div>
                ${completedTodos.length ? `<div class="completed-todos"><h4>Erledigte ToDos</h4><ul>${completedTodos.map(todo => `<li>${todo.text}</li>`).join('')}</ul></div>` : ''}
            `;
            entryDiv.querySelector('.edit-entry').addEventListener('click', () => showDiaryForm(entry));
            entriesDiv.appendChild(entryDiv);
        });
    }

    document.getElementById('add-diary-entry').addEventListener('click', () => showDiaryForm());
}

function showDiaryForm(entry = null, relatedTodoId = null, presetDate = null, presetText = '') {
    const today = new Date().toISOString().split('T')[0];
    const isEdit = Boolean(entry);
    const selectedDate = isEdit ? entry.date : (presetDate || today);
    const existingEntry = !isEdit ? state.getDiaryEntryForDate(selectedDate) : entry;
    const notesText = isEdit ? entry.notes : (presetText || '');
    const currentGaits = isEdit ? entry.gaits : { step: false, trot: false, canter: false };
    const currentRating = isEdit ? entry.rating : 0;
    const form = document.createElement('form');
    form.className = 'fade-in';
    form.innerHTML = `
        <h3>${isEdit ? 'Eintrag bearbeiten' : 'Neuer Tagebucheintrag'}</h3>
        <input type="date" id="diary-date" value="${selectedDate}" ${isEdit ? 'disabled' : ''} required>
        <textarea id="diary-notes" placeholder="Was hast du heute gemacht?">${notesText}</textarea>
        <div class="checkbox-group">
            <label class="checkbox-item"><input type="checkbox" id="gait-step" ${currentGaits.step ? 'checked' : ''}> Schritt</label>
            <label class="checkbox-item"><input type="checkbox" id="gait-trot" ${currentGaits.trot ? 'checked' : ''}> Trab</label>
            <label class="checkbox-item"><input type="checkbox" id="gait-canter" ${currentGaits.canter ? 'checked' : ''}> Galopp</label>
        </div>
        <div class="stars" id="rating-stars">
            ${Array.from({ length: 5 }, (_, i) => `<span class="star ${i < currentRating ? 'active' : ''}" data-rating="${i + 1}">★</span>`).join('')}
        </div>
        <button type="submit" class="btn">Speichern</button>
        <button type="button" class="btn" id="cancel-diary">Abbrechen</button>
    `;
    mainContent.innerHTML = '';
    mainContent.appendChild(form);

    let rating = currentRating;
    document.getElementById('rating-stars').addEventListener('click', function (e) {
        if (e.target.classList.contains('star')) {
            rating = parseInt(e.target.dataset.rating, 10);
            document.querySelectorAll('#rating-stars .star').forEach(function (star, i) {
                star.classList.toggle('active', i < rating);
            });
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const date = document.getElementById('diary-date').value;
        const notes = document.getElementById('diary-notes').value;
        const gaits = {
            step: document.getElementById('gait-step').checked,
            trot: document.getElementById('gait-trot').checked,
            canter: document.getElementById('gait-canter').checked
        };
        if (!isEdit) {
            const existing = state.getDiaryEntryForDate(date);
            if (existing) {
                alert('Für diesen Tag gibt es bereits einen Eintrag. Wir öffnen ihn zum Bearbeiten.');
                showDiaryForm(existing);
                return;
            }
        }
        const entryId = isEdit ? entry.id : Date.now().toString();
        const diaryEntry = new DiaryEntry(entryId, date, notes, gaits, rating, relatedTodoId);
        await state.addDiaryEntry(diaryEntry);
        renderView('diary');
    });

    document.getElementById('cancel-diary').addEventListener('click', function () {
        renderView('diary');
    });
}

function renderCalendar() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const container = document.createElement('div');
    container.className = 'page-card';
    container.innerHTML = `
        <h2 class="section-title">Kalender</h2>
        <p class="section-intro">Plane Termine und sehe, wann du mit welchem Pferd reitest.</p>
        <button class="btn btn-large" id="add-calendar-event">Neuer Termin</button>
        <div class="calendar-grid" id="calendar-grid"></div>
        <div id="calendar-event-list"></div>
    `;
    mainContent.appendChild(container);
    renderCalendarGrid(currentYear, currentMonth);
    renderCalendarEventList(currentYear, currentMonth);
    document.getElementById('add-calendar-event').addEventListener('click', function () {
        showCalendarForm();
    });
}

function renderCalendarGrid(year, month) {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 7 : firstDay;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `<h3>${monthName}</h3>`;
    grid.appendChild(header);

    const weekdayRow = document.createElement('div');
    weekdayRow.className = 'calendar-weekdays';
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (day) {
        const cell = document.createElement('div');
        cell.className = 'calendar-weekday';
        cell.textContent = day;
        weekdayRow.appendChild(cell);
    });
    grid.appendChild(weekdayRow);

    const daysContainer = document.createElement('div');
    daysContainer.className = 'calendar-days';
    for (var i = 1; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        daysContainer.appendChild(emptyCell);
    }
    for (var day = 1; day <= daysInMonth; day++) {
        const dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.innerHTML = `<strong>${day}</strong>`;
        const dayEvents = state.getEventsForMonth(year, month).filter(function (event) {
            return event.date === dateKey;
        });
        const dayTodos = state.getTodosForDate(dateKey);
        if (dayEvents.length) {
            const badge = document.createElement('div');
            badge.className = 'calendar-badge';
            badge.textContent = dayEvents.length + ' Termin' + (dayEvents.length > 1 ? 'e' : '');
            dayCell.appendChild(badge);
        }
        if (dayTodos.length) {
            const badge = document.createElement('div');
            badge.className = 'calendar-todo-badge';
            badge.textContent = dayTodos.length + ' ToDo' + (dayTodos.length > 1 ? 's' : '');
            dayCell.appendChild(badge);
        }
        daysContainer.appendChild(dayCell);
    }
    grid.appendChild(daysContainer);
}

function renderCalendarEventList(year, month) {
    const list = document.getElementById('calendar-event-list');
    const events = state.getEventsForMonth(year, month);
    list.innerHTML = `
        <h3>Termine im Monat</h3>
        <ul class="event-list"></ul>
    `;
    const ul = list.querySelector('ul');
    if (events.length === 0) {
        ul.innerHTML = '<li>Keine Termine im aktuellen Monat.</li>';
        return;
    }
    events.forEach(function (event) {
        const horse = state.horses.find(function (h) { return h.id === event.horseId; });
        const li = document.createElement('li');
        li.className = 'calendar-event fade-in';
        li.innerHTML = `
            <strong>${event.title}</strong><br>
            ${new Date(event.date).toLocaleDateString('de-DE')} • ${horse ? horse.name : 'Kein Pferd'}<br>
            ${event.isRecurring ? 'Wiederholt sich wöchentlich' : 'Einzeln'}
        `;
        ul.appendChild(li);
    });
}

function showCalendarForm() {
    const today = new Date().toISOString().split('T')[0];
    const form = document.createElement('form');
    form.className = 'fade-in';
    form.innerHTML = `
        <h3>Neuer Termin</h3>
        <input type="text" id="event-title" placeholder="Titel" required>
        <input type="date" id="event-date" value="${today}" required>
        <select id="event-horse">
            <option value="">Pferd auswählen</option>
            ${state.horses.map(function(h) { return `<option value="${h.id}">${h.name}</option>`; }).join('')}
        </select>
        <select id="event-recurrence">
            <option value="none">Einzeln</option>
            <option value="weekly">Wöchentlich</option>
        </select>
        <button type="submit" class="btn">Speichern</button>
        <button type="button" class="btn" id="cancel-calendar">Abbrechen</button>
    `;
    mainContent.innerHTML = '';
    mainContent.appendChild(form);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const horseId = document.getElementById('event-horse').value;
        const recurrenceType = document.getElementById('event-recurrence').value;
        const event = new CalendarEvent(
            Date.now().toString(),
            title,
            date,
            horseId,
            recurrenceType !== 'none',
            recurrenceType === 'weekly' ? 'weekly' : null
        );
        await state.addCalendarEvent(event);
        renderView('calendar');
    });
    document.getElementById('cancel-calendar').addEventListener('click', function () {
        renderView('calendar');
    });
}

function renderTodos() {
    const container = document.createElement('div');
    container.className = 'page-card';
    container.innerHTML = `
        <h2 class="section-title">ToDos</h2>
        <p class="section-intro">Schreibe Aufgaben auf und hake sie ab, wenn sie erledigt sind.</p>
        <button class="btn btn-large" id="add-todo">Neues ToDo</button>
        <div id="todo-by-date"></div>
    `;
    mainContent.appendChild(container);

    const grouped = state.todos.slice().sort(function (a, b) {
        return a.date.localeCompare(b.date);
    }).reduce(function (acc, todo) {
        if (!acc[todo.date]) acc[todo.date] = [];
        acc[todo.date].push(todo);
        return acc;
    }, {});
    const listContainer = document.getElementById('todo-by-date');
    if (state.todos.length === 0) {
        listContainer.innerHTML = '<p>Du hast noch keine ToDos. Füge gleich ein neues hinzu!</p>';
    } else {
        Object.keys(grouped).forEach(function (date) {
            const todos = grouped[date];
            const section = document.createElement('div');
            section.className = 'todo-date-group';
            section.innerHTML = `<h3>${new Date(date).toLocaleDateString('de-DE')}</h3>`;
            const ul = document.createElement('ul');
            todos.forEach(function (todo) {
                const li = document.createElement('li');
                li.className = 'todo-item ' + (todo.completed ? 'completed' : '');
                const horse = state.horses.find(function (h) { return h.id === todo.horseId; });
                li.innerHTML = `
                    <div>
                        <strong>${todo.text}</strong><br>
                        ${horse ? 'Pferd: ' + horse.name : 'Kein Pferd zugeordnet'}
                    </div>
                    <button class="btn" data-id="${todo.id}" ${todo.completed ? 'disabled' : ''}>Erledigt</button>
                `;
                ul.appendChild(li);
            });
            section.appendChild(ul);
            listContainer.appendChild(section);
        });
    }

    listContainer.addEventListener('click', async function (e) {
        if (e.target.tagName === 'BUTTON' && e.target.textContent === 'Erledigt') {
            const todoId = e.target.dataset.id;
            const createEntry = confirm('Möchtest du einen Tagebucheintrag für dieses ToDo erstellen?');
            await state.completeTodo(todoId, createEntry);
            renderView('todos');
        }
    });
    document.getElementById('add-todo').addEventListener('click', function () {
        showTodoForm();
    });
}

function showTodoForm() {
    const today = new Date().toISOString().split('T')[0];
    const form = document.createElement('form');
    form.className = 'fade-in';
    form.innerHTML = `
        <h3>Neues ToDo</h3>
        <input type="text" id="todo-text" placeholder="Was musst du tun?" required>
        <input type="date" id="todo-date" value="${today}" required>
        <select id="todo-horse">
            <option value="">Pferd auswählen (optional)</option>
            ${state.horses.map(function(h) { return `<option value="${h.id}">${h.name}</option>`; }).join('')}
        </select>
        <button type="submit" class="btn">Speichern</button>
        <button type="button" class="btn" id="cancel-todo">Abbrechen</button>
    `;
    mainContent.innerHTML = '';
    mainContent.appendChild(form);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const text = document.getElementById('todo-text').value;
        const date = document.getElementById('todo-date').value;
        const horseId = document.getElementById('todo-horse').value || null;
        const todo = new Todo(Date.now().toString(), text, date, false, horseId);
        await state.addTodo(todo);
        renderView('todos');
    });
    document.getElementById('cancel-todo').addEventListener('click', function () {
        renderView('todos');
    });
}

function renderHorses() {
    const container = document.createElement('div');
    container.className = 'page-card';
    container.innerHTML = `
        <h2 class="section-title">Pferde</h2>
        <p class="section-intro">Speichere hier die Pferde deiner Reitbeteiligung.</p>
        <button class="btn btn-large" id="add-horse">Neues Pferd</button>
        <div id="horse-list"></div>
    `;
    mainContent.appendChild(container);
    const list = document.getElementById('horse-list');
    state.horses.forEach(function (horse) {
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
    document.getElementById('add-horse').addEventListener('click', function () {
        showHorseForm();
    });
}

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

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('horse-name').value;
        const treat = document.getElementById('horse-treat').value;
        const color = document.getElementById('horse-color').value;
        const characteristics = document.getElementById('horse-characteristics').value.split(',').map(function (s) { return s.trim(); });
        let image = null;
        const fileInput = document.getElementById('horse-image');
        if (fileInput.files[0]) {
            image = await toBase64(fileInput.files[0]);
        }
        const horse = new Horse(Date.now().toString(), name, image, treat, color, characteristics);
        await state.addHorse(horse);
        renderView('horses');
    });
    document.getElementById('cancel-horse').addEventListener('click', function () {
        renderView('horses');
    });
}

function toBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            resolve(reader.result);
        };
        reader.onerror = function (error) {
            reject(error);
        };
    });
}

nav.addEventListener('click', function (e) {
    if (e.target.classList.contains('nav-btn')) {
        var view = e.target.id.replace('nav-', '');
        state.setView(view);
        updateNavActive(view);
        renderView(view);
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    await state.loadData();
    updateNavActive(state.currentView);
    renderView(state.currentView);
});

state.subscribe(function () {
    renderView(state.currentView);
});