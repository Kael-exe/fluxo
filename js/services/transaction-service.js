
import {
  add,
  get,
  getAll,
  update,
  remove,
} from '../core/storage.js';

const STORE = 'transactions';

function validateDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Informe uma data válida.');
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error('Informe uma data válida.');
  }
}

async function validateTransaction(data, previous = null) {
  const {
    type,
    description,
    amountCents,
    categoryId,
    date,
    status = 'paid',
    source = '',
    notes = '',
  } = data;

  if (!['income', 'expense'].includes(type)) {
    throw new Error('Tipo de movimentação inválido.');
  }

  if (
    typeof description !== 'string' ||
    !description.trim() ||
    description.trim().length > 120
  ) {
    throw new Error('Informe uma descrição de até 120 caracteres.');
  }

  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('O valor precisa ser maior que zero.');
  }

  if (!categoryId) {
    throw new Error('Selecione uma categoria.');
  }

  validateDate(date);

  if (!['paid', 'forecast'].includes(status)) {
    throw new Error('Status da movimentação inválido.');
  }

  if (typeof source !== 'string' || source.length > 80) {
    throw new Error('A origem deve ter até 80 caracteres.');
  }

  if (typeof notes !== 'string' || notes.length > 500) {
    throw new Error('As observações devem ter até 500 caracteres.');
  }

  const category = await get('categories', categoryId);

  if (!category || category.type !== type) {
    throw new Error('A categoria selecionada não é válida para esta movimentação.');
  }

  const isSamePreviousCategory =
    previous && previous.categoryId === categoryId;

  if (category.archived && !isSamePreviousCategory) {
    throw new Error('Não é possível usar uma categoria arquivada.');
  }

  return {
    type,
    description: description.trim(),
    amountCents,
    categoryId,
    date,
    status,
    source: source.trim(),
    notes: notes.trim(),
  };
}

export async function listTransactions() {
  const transactions = await getAll(STORE);

  return transactions.sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);

    if (dateOrder !== 0) return dateOrder;

    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

export async function getTransaction(id) {
  return get(STORE, id);
}

export async function createTransaction(data) {
  const validated = await validateTransaction(data);
  const now = new Date().toISOString();

  const transaction = {
    id: crypto.randomUUID(),
    ...validated,
    createdAt: now,
    updatedAt: now,
  };

  await add(STORE, transaction);

  return transaction;
}

export async function editTransaction(id, data) {
  const previous = await get(STORE, id);

  if (!previous) {
    throw new Error('Movimentação não encontrada.');
  }

  const validated = await validateTransaction(data, previous);

  const transaction = {
    ...previous,
    ...validated,
    updatedAt: new Date().toISOString(),
  };

  await update(STORE, transaction);

  return transaction;
}

export async function deleteTransaction(id) {
  const transaction = await get(STORE, id);

  if (!transaction) {
    throw new Error('Movimentação não encontrada.');
  }

  await remove(STORE, id);

  return true;
}
