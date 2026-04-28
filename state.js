// state.js - Zentraler State für ReitApp Charlotte

class AppState {
    constructor() {
        this.horses = [];
        this.diaryEntries = [];
        this.calendarEvents = [];
        this.todos = [];
        this.currentView = 'diary';
        this.listeners = [];
    }

    // Listener für State-Änderungen
    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener());
    }

    // Daten laden aus DB
    async loadData() {
        const db = await import('./db.js').then(m => m.default || m);
        await db.init();
        this.horses = await db.getAll('horses');
        this.diaryEntries = await db.getAll('diaryEntries');
        this.calendarEvents = await db.getAll('calendarEvents');
        this.todos = await db.getAll('todos');
        this.notify();
    }

    // Daten speichern in DB
    async saveData(storeName, data) {
        const db = await import('./db.js').then(m => m.default || m);
        await db.init();
        if (Array.isArray(data)) {
            for (const item of data) {
                await db.update(storeName, item);
            }
        } else {
            await db.update(storeName, data);
        }
    }

    // Pferd hinzufügen
    async addHorse(horse) {
        this.horses.push(horse);
        await this.saveData('horses', horse);
        this.notify();
    }

    // Tagebucheintrag hinzufügen
    async addDiaryEntry(entry) {
        this.diaryEntries.push(entry);
        await this.saveData('diaryEntries', entry);
        this.notify();
    }

    // Kalenderereignis hinzufügen
    async addCalendarEvent(event) {
        this.calendarEvents.push(event);
        await this.saveData('calendarEvents', event);
        this.notify();
    }

    // ToDo hinzufügen
    async addTodo(todo) {
        this.todos.push(todo);
        await this.saveData('todos', todo);
        this.notify();
    }

    // ToDo abschließen und optional Tagebucheintrag erstellen
    async completeTodo(todoId, createDiaryEntry = false) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.completed = true;
            await this.saveData('todos', todo);
            if (createDiaryEntry) {
                const entry = new (await import('./models.js')).DiaryEntry(
                    Date.now().toString(),
                    new Date().toISOString().split('T')[0],
                    `ToDo erledigt: ${todo.text}`,
                    { step: false, trot: false, canter: false },
                    3,
                    todoId
                );
                await this.addDiaryEntry(entry);
            }
            this.notify();
        }
    }

    // View wechseln
    setView(view) {
        this.currentView = view;
        this.notify();
    }
}

// Singleton-Instanz
const state = new AppState();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = state;
}