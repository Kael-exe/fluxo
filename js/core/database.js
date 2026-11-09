
const DB_NAME = 'fluxo_db';
const DB_VERSION = 1;

let dbPromise = null;

function createStore(db, name, options, indexes = []) {
  const store = db.createObjectStore(name, options);

  for (const index of indexes) {
    store.createIndex(index.name, index.keyPath, {
      unique: index.unique ?? false,
    });
  }

  return store;
}

export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Este navegador não oferece suporte ao IndexedDB.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('transactions')) {
        createStore(db, 'transactions', { keyPath: 'id' }, [
          { name: 'date', keyPath: 'date' },
          { name: 'categoryId', keyPath: 'categoryId' },
          { name: 'type', keyPath: 'type' },
          { name: 'source', keyPath: 'source' },
          { name: 'status', keyPath: 'status' },
        ]);
      }

      if (!db.objectStoreNames.contains('categories')) {
        createStore(db, 'categories', { keyPath: 'id' }, [
          { name: 'type', keyPath: 'type' },
        ]);
      }

      if (!db.objectStoreNames.contains('budgets')) {
        createStore(db, 'budgets', { keyPath: 'id' }, [
          { name: 'categoryId', keyPath: 'categoryId', unique: true },
        ]);
      }

      if (!db.objectStoreNames.contains('goals')) {
        createStore(db, 'goals', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('goalContributions')) {
        createStore(db, 'goalContributions', { keyPath: 'id' }, [
          { name: 'goalId', keyPath: 'goalId' },
          { name: 'date', keyPath: 'date' },
        ]);
      }

      if (!db.objectStoreNames.contains('meta')) {
        createStore(db, 'meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Não foi possível abrir o banco local.'));
    };

    request.onblocked = () => {
      console.warn('A atualização do banco está bloqueada por outra aba do Fluxo.');
    };
  });

  return dbPromise;
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
