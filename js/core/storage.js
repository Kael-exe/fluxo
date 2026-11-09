
import { openDatabase } from './database.js';

function makeRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(
      request.error || new Error('Erro ao acessar os dados.')
    );
  });
}

function makeTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error || new Error('Erro na transação.')
    );
    transaction.onabort = () => reject(
      transaction.error || new Error('Operação cancelada.')
    );
  });
}

function validateStoreName(storeName) {
  const allowed = [
    'transactions',
    'categories',
    'budgets',
    'goals',
    'goalContributions',
    'meta',
  ];

  if (!allowed.includes(storeName)) {
    throw new Error('Estrutura de armazenamento inválida.');
  }
}

export async function add(storeName, data) {
  validateStoreName(storeName);

  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  const result = makeRequest(tx.objectStore(storeName).add(data));

  const [id] = await Promise.all([
    result,
    makeTransaction(tx),
  ]);

  return id;
}

export async function get(storeName, id) {
  validateStoreName(storeName);

  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');

  return makeRequest(tx.objectStore(storeName).get(id));
}

export async function getAll(storeName) {
  validateStoreName(storeName);

  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readonly');

  return makeRequest(tx.objectStore(storeName).getAll());
}

export async function update(storeName, data) {
  validateStoreName(storeName);

  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');

  const result = makeRequest(tx.objectStore(storeName).put(data));

  const [id] = await Promise.all([
    result,
    makeTransaction(tx),
  ]);

  return id;
}

export async function remove(storeName, id) {
  validateStoreName(storeName);

  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');

  const result = makeRequest(tx.objectStore(storeName).delete(id));

  await Promise.all([
    result,
    makeTransaction(tx),
  ]);
}

export async function clear(storeName) {
  validateStoreName(storeName);

  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');

  const result = makeRequest(tx.objectStore(storeName).clear());

  await Promise.all([
    result,
    makeTransaction(tx),
  ]);
}
