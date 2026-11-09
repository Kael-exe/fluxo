
import {
  el,
  pageHead,
  toast,
  confirmDialog,
} from '../components/ui.js';

import {
  listCategories,
  createCategory,
  editCategory,
  archiveCategory,
  restoreCategory,
  deleteCategory,
  DEFAULT_CATEGORIES,
} from '../services/category-service.js';

export const title = 'Categorias';
export const icon = 'categories';

export async function render() {
  const categories = await listCategories();

  let editingId = null;

  const nameInput = el('input', {
    type: 'text',
    name: 'name',
    placeholder: 'Ex.: Alimentação',
    maxlength: '40',
    required: true,
  });

  const typeInput = el('select', { name: 'type', required: true },
    el('option', { value: 'expense' }, 'Despesa'),
    el('option', { value: 'income' }, 'Receita')
  );

  const colorInput = el('input', {
    type: 'color',
    name: 'color',
    value: '#E99555',
  });

  const submitButton = el('button', {
    class: 'btn btn--primary',
    type: 'submit',
  }, 'Adicionar categoria');

  const cancelButton = el('button', {
    class: 'btn',
    type: 'button',
    hidden: true,
  }, 'Cancelar edição');

  const form = el('form', { class: 'category-form' },
    el('label', { class: 'field' },
      'Nome da categoria',
      nameInput
    ),
    el('label', { class: 'field' },
      'Tipo',
      typeInput
    ),
    el('label', { class: 'field' },
      'Cor',
      colorInput
    ),
    submitButton,
    cancelButton
  );

  const activeList = el('div', { class: 'category-list' });
  const archivedList = el('div', { class: 'category-list' });

  function createSwatch(color) {
    const swatch = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );

    swatch.setAttribute('viewBox', '0 0 12 12');
    swatch.setAttribute('width', '12');
    swatch.setAttribute('height', '12');
    swatch.setAttribute('aria-hidden', 'true');

    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );

    circle.setAttribute('cx', '6');
    circle.setAttribute('cy', '6');
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', color);

    swatch.append(circle);

    return swatch;
  }

  function resetForm() {
    editingId = null;
    form.reset();

    colorInput.value = '#E99555';
    typeInput.value = 'expense';

    submitButton.textContent = 'Adicionar categoria';
    cancelButton.hidden = true;
  }

  async function refreshLists() {
    const updatedCategories = await listCategories();
    renderLists(updatedCategories);
    renderDefaultStatus(updatedCategories);
  }

  function renderDefaultStatus(items) {
    const active = items.filter((item) => !item.archived);

    const missing = DEFAULT_CATEGORIES.filter((suggested) =>
      !items.some((item) =>
        item.type === suggested.type &&
        item.name.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase() ===
        suggested.name.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase() &&
        !item.archived
      )
    );

    defaultStatus.replaceChildren();

    if (missing.length === 0) {
      defaultStatus.append(
        el('p', { class: 'hint' },
          'Todas as categorias sugeridas já estão cadastradas. Você pode criar suas próprias categorias abaixo.'
        )
      );
      return;
    }

    defaultStatus.append(
      el('p', { class: 'hint' },
        `${missing.length} categorias sugeridas ainda não estão ativas.`
      )
    );
  }

  function renderLists(items) {
    activeList.replaceChildren();
    archivedList.replaceChildren();

    const active = items.filter((item) => !item.archived);
    const archived = items.filter((item) => item.archived);

    if (active.length === 0) {
      activeList.append(
        el('p', { class: 'hint' },
          'Nenhuma categoria ativa cadastrada.'
        )
      );
    }

    if (archived.length === 0) {
      archivedList.append(
        el('p', { class: 'hint' },
          'Nenhuma categoria arquivada.'
        )
      );
    }

    for (const category of active) {
      const editButton = el('button', {
        class: 'btn',
        type: 'button',
        onclick: () => {
          editingId = category.id;

          nameInput.value = category.name;
          typeInput.value = category.type;
          colorInput.value = category.color;

          submitButton.textContent = 'Salvar alterações';
          cancelButton.hidden = false;

          nameInput.focus();
        },
      }, 'Editar');

      const archiveButton = el('button', {
        class: 'btn',
        type: 'button',
        onclick: async () => {
          const confirmed = await confirmDialog({
            title: 'Arquivar categoria?',
            message: `A categoria "${category.name}" deixará de aparecer nas categorias ativas. O histórico será preservado.`,
            confirmLabel: 'Arquivar',
          });

          if (!confirmed) return;

          try {
            await archiveCategory(category.id);

            if (editingId === category.id) {
              resetForm();
            }

            toast('Categoria arquivada.');
            await refreshLists();
          } catch (error) {
            toast(error.message || 'Não foi possível arquivar.', 'error');
          }
        },
      }, 'Arquivar');

      activeList.append(
        el('article', { class: 'category-item' },
          createSwatch(category.color),
          el('span', {}, category.name),
          el('small', {},
            category.type === 'income' ? 'Receita' : 'Despesa'
          ),
          el('div', { class: 'category-item__actions' },
            editButton,
            archiveButton
          )
        )
      );
    }

    for (const category of archived) {
      const restoreButton = el('button', {
        class: 'btn',
        type: 'button',
        onclick: async () => {
          try {
            await restoreCategory(category.id);
            toast('Categoria restaurada com sucesso!');
            await refreshLists();
          } catch (error) {
            toast(error.message || 'Não foi possível restaurar.', 'error');
          }
        },
      }, 'Restaurar');

      const deleteButton = el('button', {
        class: 'btn btn--danger',
        type: 'button',
        onclick: async () => {
          const confirmed = await confirmDialog({
            title: 'Excluir permanentemente?',
            message: `A categoria "${category.name}" será removida definitivamente. Essa ação não poderá ser desfeita.`,
            confirmLabel: 'Excluir permanentemente',
            danger: true,
          });

          if (!confirmed) return;

          try {
            await deleteCategory(category.id);
            toast('Categoria excluída permanentemente.');
            await refreshLists();
          } catch (error) {
            toast(error.message || 'Não foi possível excluir.', 'error');
          }
        },
      }, 'Excluir');

      archivedList.append(
        el('article', {
          class: 'category-item category-item--archived',
        },
          createSwatch(category.color),
          el('span', {}, category.name),
          el('small', {},
            category.type === 'income' ? 'Receita' : 'Despesa'
          ),
          el('div', { class: 'category-item__actions' },
            restoreButton,
            deleteButton
          )
        )
      );
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitButton.disabled = true;

    try {
      const data = {
        name: nameInput.value,
        type: typeInput.value,
        color: colorInput.value,
      };

      if (editingId) {
        await editCategory(editingId, data);
        toast('Categoria atualizada com sucesso!');
      } else {
        await createCategory(data);
        toast('Categoria cadastrada com sucesso!');
      }

      resetForm();
      await refreshLists();

    } catch (error) {
      toast(error.message || 'Não foi possível salvar.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  cancelButton.addEventListener('click', resetForm);

  const defaultStatus = el('div', {});

  renderLists(categories);
  renderDefaultStatus(categories);

  return el('section', {},
    pageHead(title, 'Organize e dê cor aos seus gastos.'),

    el('section', { class: 'category-panel' },
      el('h2', {}, 'Categorias sugeridas'),
      defaultStatus
    ),

    el('section', { class: 'category-panel' },
      el('h2', {}, 'Nova categoria'),
      form
    ),

    el('section', { class: 'category-panel' },
      el('h2', {}, 'Categorias ativas'),
      activeList
    ),

    el('section', { class: 'category-panel' },
      el('h2', {}, 'Categorias arquivadas'),
      archivedList
    )
  );
}
