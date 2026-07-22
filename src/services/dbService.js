```javascript
/**
 * src/services/dbService.js
 * IndexedDB service layer encapsulating TROR_Database operations.
 */

const DB_NAME = 'TROR_Database';
const DB_VERSION = 1;
const STORES = [
    'transactions',
    'goals',
    'settings',
    'categories',
    'vehicleLogs',
    'maintenance',
    'assets',
    'obligations',
    'savings'
];

let dbInstance = null;

export function openDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            return resolve(dbInstance);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            STORES.forEach(storeName => {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                }
            });
        };
    });
}

export async function getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function get(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function add(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function put(storeName, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function update(storeName, data) {
    return put(storeName, data);
}

export async function deleteRecord(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function softDelete(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const record = getRequest.result;
            if (!record) {
                return reject(new Error(`Record with id ${id} not found in ${storeName}`));
            }
            record.deleted = true;
            const putRequest = store.put(record);
            putRequest.onsuccess = () => resolve(putRequest.result);
            putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

export async function clear(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function exportAllData() {
    const db = await openDB();
    const exportData = {};

    for (const storeName of STORES) {
        exportData[storeName] = await new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    return exportData;
}

export async function importData(backupData) {
    const db = await openDB();

    for (const storeName of STORES) {
        if (backupData[storeName] && Array.isArray(backupData[storeName])) {
            await new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);

                backupData[storeName].forEach(item => {
                    store.put(item);
                });
            });
        }
    }
    return true;
}

```
0
