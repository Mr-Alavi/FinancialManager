export const DB_CONFIG = {
  name: 'T.R.O.R_DB',
  version: 2,
  stores: { ACCOUNTS: 'accounts', TRANSACTIONS: 'transactions', CATEGORIES: 'categories', BUDGETS: 'budgets', GOALS: 'goals', SAVINGS: 'savings', DEBTS: 'debts', SETTINGS: 'settings', REPORTS: 'reports' }
};

let dbInstance = null;

export function openDatabase() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      Object.values(DB_CONFIG.stores).forEach(store => {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
      });
    };
    request.onsuccess = (e) => { dbInstance = e.target.result; resolve(dbInstance); };
    request.onerror = (e) => reject(e.target.error);
  });
}

export function getStoreService(storeName) {
  return {
    async getAll() {
      const db = await openDatabase();
      return new Promise((res, rej) => {
        const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
    },
    async create(item) {
      const db = await openDatabase();
      const newItem = { id: 'id_' + Date.now() + Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), ...item };
      return new Promise((res, rej) => {
        const req = db.transaction(storeName, 'readwrite').objectStore(storeName).add(newItem);
        req.onsuccess = () => res(newItem);
        req.onerror = () => rej(req.error);
      });
    },
    async update(id, updates) {
      const db = await openDatabase();
      return new Promise(async (res, rej) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => {
          const updated = { ...req.result, ...updates, updatedAt: new Date().toISOString() };
          store.put(updated);
          res(updated);
        };
        req.onerror = () => rej(req.error);
      });
    },
    async delete(id) {
      const db = await openDatabase();
      return new Promise((res, rej) => {
        const req = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
        req.onsuccess = () => res(true);
        req.onerror = () => rej(req.error);
      });
    }
  };
}
