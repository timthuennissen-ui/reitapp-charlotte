// db.js - IndexedDB Setup für ReitApp Charlotte

class Database {
    constructor() {
        this.dbName = 'ReitAppCharlotteDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Object Stores erstellen
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
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, item) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, item) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Singleton-Instanz
const db = new Database();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = db;
}