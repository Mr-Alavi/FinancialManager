export const DB_CONFIG = {
  name: 'T.R.O.R_DB',
  version: 2,
  stores: { 
    ACCOUNTS: 'accounts', 
    TRANSACTIONS: 'transactions', 
    CATEGORIES: 'categories', 
    BUDGETS: 'budgets', 
    GOALS: 'goals', 
    SAVINGS: 'savings', 
    DEBTS: 'debts', 
    SETTINGS: 'settings', 
    REPORTS: 'reports' 
  }
};

let dbInstance = null;

export function openDatabase() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    
    try {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        Object.values(DB_CONFIG.stores).forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };
      
      request.onsuccess = (e) => { 
        dbInstance = e.target.result; 
        resolve(dbInstance); 
      };
      
      request.onerror = (e) => { 
        console.error('IndexedDB Error:', e.target.error);
        reject(e.target.error); 
      };
    } catch (err) {
      console.error('IndexedDB Exception:', err);
      reject(err);
    }
  });
}

export function getStoreService(storeName) {
  return {
    async getAll() {
      try {
        const db = await openDatabase();
        return new Promise((res, rej) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => res(req.result || []);
          req.onerror = () => rej(req.error);
        });
      } catch (err) {
        console.warn(`Fallback empty array for store: ${storeName}`);
        return [];
      }
    },
    async create(item) {
      try {
        const db = await openDatabase();
        const newItem = { id: 'id_' + Date.now() + Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), ...item };
        return new Promise((res, rej) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.add(newItem);
          req.onsuccess = () => res(newItem);
          req.onerror = () => rej(req.error);
        });
      } catch (err) {
        console.error('Create error:', err);
        throw err;
      }
    },
    async update(id, updates) {
      try {
        const db = await openDatabase();
        return new Promise((res, rej) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.get(id);
          req.onsuccess = () => {
            const data = req.result || {};
            const updated = { ...data, ...updates, updatedAt: new Date().toISOString() };
            store.put(updated);
            res(updated);
          };
          req.onerror = () => rej(req.error);
        });
      } catch (err) {
        console.error('Update error:', err);
        throw err;
      }
    },
    async delete(id) {
      try {
        const db = await openDatabase();
        return new Promise((res, rej) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.delete(id);
          req.onsuccess = () => res(true);
          req.onerror = () => rej(req.error);
        });
      } catch (err) {
        console.error('Delete error:', err);
        throw err;
      }
    }
  };
}
