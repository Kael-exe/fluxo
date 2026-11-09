
import {
  el,
  pageHead,
  toast,
  confirmDialog,
} from '../components/ui.js';

import {
  listTransactions,
  createTransaction,
  editTransaction,
  deleteTransaction,
} from '../services/transaction-service.js';

import { listCategories } from '../services/category-service.js';

export const title = 'Movimentações';
export const icon = 'transactions';

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function formatDate(date) {
  if (!date) return '—';

  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function parseAmount(value) {
  const amount = Number(value.replace(',', '.'));

  if (!Number.isFinite(amount)) {
    throw new Error('Informe um valor válido.');
  }

  return Math.round(amount * 100);
}

export async function render() {
  let transactions = await listTransactions();
  let categories = await listCategories();
  let editingId = null;

  const root = el('div', { class: 'transaction-page' });

  const form = el('form', {
    class: 'transaction-form',
  });

  const typeInput = el('select', {
    name: 'type',
    required: true,
  },
    el('option', { value: 'expense' }, 'Despesa'),
    el('option', { value: 'income' }, 'Receita')
  );

  const descriptionInput = el('input', {
    name: 'description',
    type: 'text',
    maxlength: '120',
    placeholder: 'Ex.: Compra no mercado',
    required: true,
  });

  const amountInput = el('input', {
    name: 'amount',
    type: 'number',
    min: '0.01',
    step: '0.01',
    placeholder: '0,00',
    required: true,
  });

  const categoryInput = el('select', {
    name: 'categoryId',
    required: true,
  });

  const dateInput = el('input', {
    name: 'date',
    type: 'date',
    value: today(),
    required: true,
  });

  const sourceInput = el('input', {
    name: 'source',
    type: 'text',
    maxlength: '80',
    placeholder: 'Ex.: Nubank, Pix, dinheiro',
  });

  const statusInput = el('select', {
    name: 'status',
  },
    el('option', { value: 'paid' }, 'Pago / recebido'),
    el('option', { value: 'forecast' }, 'Previsto')
  );

  const notesInput = el('textarea', {
    name: 'notes',
    maxlength: '500',
    rows: '3',
    placeholder: 'Observações opcionais',
  });

  const submitButton = el('button', {
    class: 'btn btn--primary',
    type: 'submit',
  }, 'Adicionar movimentação');

  const cancelButton = el('button', {
    class: 'btn',
    type: 'button',
    hidden: true,
    onclick: resetForm,
  }, 'Cancelar edição');

  function field(label, input) {
    return el('label', { class: 'field transaction-field' },
      label,
      input
    );
  }

  function populateCategories(selectedId = '') {
    const type = typeInput.value;

    const available = categories.filter((category) =>
      category.type === type &&
      (
        !category.archived ||
        category.id === selectedId
      )
    );

    categoryInput.replaceChildren(
      el('option', { value: '' }, 'Selecione uma categoria'),
      ...available.map((category) =>
        el('option', {
          value: category.id,
          selected: category.id === selectedId,
        }, category.name)
      )
    );

    if (!available.length) {
      categoryInput.replaceChildren(
        el('option', { value: '' }, 'Nenhuma categoria ativa')
      );
    }
  }

  function resetForm() {
    editingId = null;
    form.reset();

    typeInput.value = 'expense';
    dateInput.value = today();
    statusInput.value = 'paid';

    populateCategories();

    submitButton.textContent = 'Adicionar movimentação';
    cancelButton.hidden = true;
  }

  typeInput.addEventListener('change', () => {
    populateCategories();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const data = {
        type: typeInput.value,
        description: descriptionInput.value,
        amountCents: parseAmount(amountInput.value),
        categoryId: categoryInput.value,
        date: dateInput.value,
        status: statusInput.value,
        source: sourceInput.value,
        notes: notesInput.value,
      };

      if (editingId) {
        await editTransaction(editingId, data);
        toast('Movimentação atualizada.');
      } else {
        await createTransaction(data);
        toast('Movimentação adicionada.');
      }

      categories = await listCategories();
      transactions = await listTransactions();

      resetForm();
      renderList();
    } catch (error) {
      toast(error.message || 'Não foi possível salvar.', 'error');
    }
  });

  const searchInput = el('input', {
    type: 'search',
    placeholder: 'Pesquisar movimentação...',
    'aria-label': 'Pesquisar movimentação',
  });

  const filterType = el('select', {
    'aria-label': 'Filtrar por tipo',
  },
    el('option', { value: 'all' }, 'Todas'),
    el('option', { value: 'income' }, 'Receitas'),
    el('option', { value: 'expense' }, 'Despesas')
  );

  const filterCategory = el('select', {
    'aria-label': 'Filtrar por categoria',
  });

  const filterStatus = el('select', {
    'aria-label': 'Filtrar por status',
  },
    el('option', { value: 'all' }, 'Todos os status'),
    el('option', { value: 'paid' }, 'Pagos / recebidos'),
    el('option', { value: 'forecast' }, 'Previstos')
  );

  const startDate = el('input', {
    type: 'date',
    'aria-label': 'Data inicial',
  });

  const endDate = el('input', {
    type: 'date',
    'aria-label': 'Data final',
  });

  const list = el('div', {
    class: 'transaction-list',
    'aria-live': 'polite',
  });

  const count = el('p', {
    class: 'transaction-count',
  });

  function populateFilterCategories() {
    filterCategory.replaceChildren(
      el('option', { value: 'all' }, 'Todas as categorias'),
      ...categories
        .map((category) =>
          el('option', {
            value: category.id,
          }, category.name)
        )
    );
  }

  function getFilteredTransactions() {
    const search = searchInput.value.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const category = categories.find(
        (item) => item.id === transaction.categoryId
      );

      const matchesSearch =
        transaction.description.toLowerCase().includes(search) ||
        (transaction.source || '').toLowerCase().includes(search) ||
        (category?.name || '').toLowerCase().includes(search);

      const matchesType =
        filterType.value === 'all' ||
        transaction.type === filterType.value;

      const matchesCategory =
        filterCategory.value === 'all' ||
        transaction.categoryId === filterCategory.value;

      const matchesStatus =
        filterStatus.value === 'all' ||
        transaction.status === filterStatus.value;

      const matchesStart =
        !startDate.value ||
        transaction.date >= startDate.value;

      const matchesEnd =
        !endDate.value ||
        transaction.date <= endDate.value;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }

  function renderList() {
    const filtered = getFilteredTransactions();

    list.replaceChildren();

    count.textContent =
      `${filtered.length} movimentação(ões) encontrada(s)`;

    if (!filtered.length) {
      list.append(
        el('div', { class: 'empty-state' },
          el('h3', {}, 'Nenhuma movimentação encontrada'),
          el('p', {}, transactions.length
            ? 'Tente alterar os filtros ou a pesquisa.'
            : 'Suas receitas e despesas aparecerão aqui.')
        )
      );

      return;
    }

    for (const transaction of filtered) {
      const category = categories.find(
        (item) => item.id === transaction.categoryId
      );

      const isIncome = transaction.type === 'income';

      const amount = el('strong', {
        class: `transaction-amount ${isIncome ? 'is-income' : 'is-expense'}`,
      }, `${isIncome ? '+' : '-'} ${money.format(transaction.amountCents / 100)}`);

      const editButton = el('button', {
        class: 'btn',
        type: 'button',
        onclick: () => startEditing(transaction),
      }, 'Editar');

      const deleteButton = el('button', {
        class: 'btn btn--danger',
        type: 'button',
        onclick: () => removeTransaction(transaction),
      }, 'Excluir');

      const item = el('article', {
        class: 'transaction-item',
      },
        el('div', { class: 'transaction-item__main' },
          el('strong', {}, transaction.description),
          el('small', {},
            `${category?.name || 'Categoria indisponível'} · ${formatDate(transaction.date)}`
          ),
          el('small', {},
            `${transaction.source || 'Origem não informada'} · ${transaction.status === 'paid' ? 'Pago / recebido' : 'Previsto'}`
          )
        ),
        amount,
        el('div', { class: 'transaction-actions' },
          editButton,
          deleteButton
        )
      );

      list.append(item);
    }
  }

  function startEditing(transaction) {
    editingId = transaction.id;

    typeInput.value = transaction.type;
    populateCategories(transaction.categoryId);

    descriptionInput.value = transaction.description;
    amountInput.value = (transaction.amountCents / 100).toFixed(2);
    categoryInput.value = transaction.categoryId;
    dateInput.value = transaction.date;
    sourceInput.value = transaction.source || '';
    statusInput.value = transaction.status || 'paid';
    notesInput.value = transaction.notes || '';

    submitButton.textContent = 'Salvar alterações';
    cancelButton.hidden = false;

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    descriptionInput.focus();
  }

  async function removeTransaction(transaction) {
    const confirmed = await confirmDialog({
      title: 'Excluir movimentação?',
      message: `Deseja excluir "${transaction.description}"? Essa ação não poderá ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    });

    if (!confirmed) return;

    try {
      await deleteTransaction(transaction.id);

      transactions = await listTransactions();

      if (editingId === transaction.id) {
        resetForm();
      }

      renderList();
      toast('Movimentação excluída.');
    } catch (error) {
      toast(error.message || 'Não foi possível excluir.', 'error');
    }
  }

  for (const input of [
    searchInput,
    filterType,
    filterCategory,
    filterStatus,
    startDate,
    endDate,
  ]) {
    input.addEventListener('input', renderList);
    input.addEventListener('change', renderList);
  }

  form.append(
    el('div', { class: 'transaction-form__grid' },
      field('Tipo', typeInput),
      field('Descrição', descriptionInput),
      field('Valor (R$)', amountInput),
      field('Categoria', categoryInput),
      field('Data', dateInput),
      field('Origem / meio de pagamento', sourceInput),
      field('Status', statusInput),
      field('Observações', notesInput)
    ),
    el('div', { class: 'transaction-form__actions' },
      submitButton,
      cancelButton
    )
  );

  populateCategories();
  populateFilterCategories();

  root.append(
    pageHead(title, 'Receitas e despesas do dia a dia.'),
    el('section', { class: 'transaction-panel' },
      el('h2', {}, 'Nova movimentação'),
      form
    ),
    el('section', { class: 'transaction-panel' },
      el('div', { class: 'transaction-list-head' },
        el('h2', {}, 'Histórico'),
        count
      ),
      el('div', { class: 'transaction-filters' },
        searchInput,
        filterType,
        filterCategory,
        filterStatus,
        startDate,
        endDate
      ),
      list
    )
  );

  renderList();

  return root;
}
