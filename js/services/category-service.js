
import {
  add,
  getAll,
  get,
  update,
  remove,
} from '../core/storage.js';

const STORE = 'categories';

function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function validateCategory(data) {
  const name = data.name?.trim();

  if (!name) {
    throw new Error('Informe o nome da categoria.');
  }

  if (!['income', 'expense'].includes(data.type)) {
    throw new Error('Tipo de categoria inválido.');
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(data.color)) {
    throw new Error('Cor inválida.');
  }

  return {
    name,
    type: data.type,
    color: data.color,
  };
}

export async function listCategories() {
  const categories = await getAll(STORE);

  return categories.sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  );
}

export async function createCategory(data) {
  const category = validateCategory(data);
  const categories = await listCategories();

  const duplicate = categories.some((item) =>
    item.type === category.type &&
    normalizeName(item.name) === normalizeName(category.name) &&
    !item.archived
  );

  if (duplicate) {
    throw new Error('Já existe uma categoria com esse nome e tipo.');
  }

  const now = new Date().toISOString();

  const record = {
    id: crypto.randomUUID(),
    ...category,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  await add(STORE, record);

  return record;
}

export async function editCategory(id, data) {
  const existing = await get(STORE, id);

  if (!existing) {
    throw new Error('Categoria não encontrada.');
  }

  const category = validateCategory(data);
  const categories = await listCategories();

  const duplicate = categories.some((item) =>
    item.id !== id &&
    item.type === category.type &&
    normalizeName(item.name) === normalizeName(category.name) &&
    !item.archived
  );

  if (duplicate) {
    throw new Error('Já existe uma categoria com esse nome e tipo.');
  }

  const updated = {
    ...existing,
    ...category,
    updatedAt: new Date().toISOString(),
  };

  await update(STORE, updated);

  return updated;
}

export async function archiveCategory(id) {
  const existing = await get(STORE, id);

  if (!existing) {
    throw new Error('Categoria não encontrada.');
  }

  const updated = {
    ...existing,
    archived: true,
    updatedAt: new Date().toISOString(),
  };

  await update(STORE, updated);

  return updated;
}

export async function restoreCategory(id) {
  const existing = await get(STORE, id);

  if (!existing) {
    throw new Error('Categoria não encontrada.');
  }

  if (!existing.archived) {
    throw new Error('Esta categoria já está ativa.');
  }

  const categories = await listCategories();

  const duplicate = categories.some((item) =>
    item.id !== id &&
    !item.archived &&
    item.type === existing.type &&
    normalizeName(item.name) === normalizeName(existing.name)
  );

  if (duplicate) {
    throw new Error(
      'Já existe uma categoria ativa com esse nome e tipo. Altere o nome da outra categoria antes de restaurar.'
    );
  }

  const restored = {
    ...existing,
    archived: false,
    updatedAt: new Date().toISOString(),
  };

  await update(STORE, restored);

  return restored;
}

export async function deleteCategory(id) {
  const existing = await get(STORE, id);

  if (!existing) {
    throw new Error('Categoria não encontrada.');
  }

  if (!existing.archived) {
    throw new Error('Arquive a categoria antes de excluí-la.');
  }

  const [transactions, budgets] = await Promise.all([
    getAll('transactions'),
    getAll('budgets'),
  ]);

  const usedInTransactions = transactions.some(
    (item) => item.categoryId === id
  );

  const usedInBudgets = budgets.some(
    (item) => item.categoryId === id
  );

  if (usedInTransactions || usedInBudgets) {
    throw new Error(
      'Esta categoria está vinculada a movimentações ou orçamentos e não pode ser excluída. Ela continuará arquivada para preservar seu histórico.'
    );
  }

  await remove(STORE, id);
}

export const DEFAULT_CATEGORIES = [
  { name: 'Alimentação e mercado', type: 'expense', color: '#E99555' },
  { name: 'Moradia', type: 'expense', color: '#B96E3D' },
  { name: 'Transporte', type: 'expense', color: '#6CC3E6' },
  { name: 'Saúde', type: 'expense', color: '#5FD1AE' },
  { name: 'Lazer', type: 'expense', color: '#C18BE8' },
  { name: 'Educação', type: 'expense', color: '#F0C667' },
  { name: 'Salário', type: 'income', color: '#5FD1AE' },
  { name: 'Freelance', type: 'income', color: '#6CC3E6' },
  { name: 'Investimentos', type: 'income', color: '#E99555' },
  { name: 'Presentes', type: 'income', color: '#C18BE8' },
  { name: 'Outros', type: 'income', color: '#92A7B0' },
];

// Corrige a duplicidade antiga de Salario e Salário.
// A versão sem acento é arquivada, nunca apagada.
export async function fixKnownCategoryDuplicates() {
  const categories = await listCategories();

  const correct = categories.find((item) =>
    item.type === 'income' &&
    item.name === 'Salário' &&
    !item.archived
  );

  const duplicate = categories.find((item) =>
    item.type === 'income' &&
    item.name === 'Salario' &&
    !item.archived
  );

  if (!correct || !duplicate) {
    return { archived: 0 };
  }

  await archiveCategory(duplicate.id);

  return { archived: 1 };
}

export async function createDefaultCategories(selectedCategories = []) {
  const result = {
    added: 0,
    restored: 0,
    skipped: 0,
  };

  for (const selected of selectedCategories) {
    const category = DEFAULT_CATEGORIES.find((item) =>
      item.name === selected.name &&
      item.type === selected.type
    );

    if (!category) continue;

    const existing = await listCategories();

    const match = existing.find((item) =>
      item.type === category.type &&
      normalizeName(item.name) === normalizeName(category.name)
    );

    if (match && !match.archived) {
      result.skipped++;
      continue;
    }

    if (match && match.archived) {
      await restoreCategory(match.id);
      result.restored++;
      continue;
    }

    const now = new Date().toISOString();

    const record = {
      id: crypto.randomUUID(),
      ...category,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    await add(STORE, record);
    result.added++;
  }

  return result;
}
