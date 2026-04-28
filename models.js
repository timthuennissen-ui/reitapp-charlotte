// models.js - Datenmodelle für ReitApp Charlotte

// Pferd-Modell
class Horse {
    constructor(id, name, image, favoriteTreat, coatColor, characteristics) {
        this.id = id;
        this.name = name;
        this.image = image; // Base64 string oder URL
        this.favoriteTreat = favoriteTreat;
        this.coatColor = coatColor;
        this.characteristics = characteristics; // Array von Strings
    }
}

// Tagebucheintrag-Modell
class DiaryEntry {
    constructor(id, date, notes, gaits, rating, relatedTodoId = null) {
        this.id = id;
        this.date = date; // ISO String
        this.notes = notes;
        this.gaits = gaits; // { step: boolean, trot: boolean, canter: boolean }
        this.rating = rating; // 1-5
        this.relatedTodoId = relatedTodoId;
    }
}

// Kalenderereignis-Modell
class CalendarEvent {
    constructor(id, title, date, horseId, isRecurring, recurrenceType, todos = []) {
        this.id = id;
        this.title = title;
        this.date = date; // ISO String
        this.horseId = horseId;
        this.isRecurring = isRecurring;
        this.recurrenceType = recurrenceType; // 'weekly', 'monthly', etc.
        this.todos = todos; // Array von Todo-IDs
    }
}

// ToDo-Modell
class Todo {
    constructor(id, text, date, completed = false, horseId = null) {
        this.id = id;
        this.text = text;
        this.date = date; // ISO String
        this.completed = completed;
        this.horseId = horseId;
    }
}

export { Horse, DiaryEntry, CalendarEvent, Todo };