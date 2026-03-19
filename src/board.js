import { generateId, loadState, saveState } from './state';

export default class Board {
  constructor(container) {
    this.container = container;
    this.state = loadState();
    this.dragged = null;
    this.dragImage = null;
  }

  init() {
    this.render();
  }

  addCard(columnId, text) {
    const column = this.state.columns.find((item) => item.id === columnId);
    if (!column) return;

    column.cards.push({ id: generateId(), text });
    this.persistAndRender();
  }

  deleteCard(columnId, cardId) {
    const column = this.state.columns.find((item) => item.id === columnId);
    if (!column) return;

    column.cards = column.cards.filter((card) => card.id !== cardId);
    this.persistAndRender();
  }

  moveCard(cardId, target) {
    const sourceColumn = this.state.columns.find((col) => col.cards.some((card) => card.id === cardId));
    const targetColumn = this.state.columns.find((col) => col.id === target.columnId);
    if (!sourceColumn || !targetColumn) return;

    const sourceIndex = sourceColumn.cards.findIndex((card) => card.id === cardId);
    if (sourceIndex < 0) return;

    const [card] = sourceColumn.cards.splice(sourceIndex, 1);
    if (!card) return;

    let targetIndex = target.index;
    if (sourceColumn.id === target.columnId && sourceIndex < target.index) {
      targetIndex -= 1;
    }

    targetColumn.cards.splice(targetIndex, 0, card);
    this.persistAndRender();
  }

  persistAndRender() {
    saveState(this.state);
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const board = document.createElement('section');
    board.className = 'board';

    this.state.columns.forEach((column) => {
      board.append(this.createColumn(column));
    });

    this.container.append(board);
  }

  createColumn(column) {
    const col = document.createElement('div');
    col.className = 'column';
    col.dataset.columnId = column.id;

    const title = document.createElement('h3');
    title.className = 'column-title';
    title.textContent = column.title;

    const cards = document.createElement('div');
    cards.className = 'cards';
    cards.dataset.columnId = column.id;
    cards.addEventListener('dragover', (event) => this.onDragOver(event, cards));
    cards.addEventListener('drop', (event) => this.onDrop(event, cards));
    cards.addEventListener('dragleave', (event) => {
      if (!cards.contains(event.relatedTarget)) {
        cards.querySelector('.placeholder')?.remove();
      }
    });

    column.cards.forEach((card, index) => {
      cards.append(this.createCard(column.id, card, index));
    });

    const form = this.createAddForm(column.id);

    col.append(title, cards, form);
    return col;
  }

  createCard(columnId, card, index) {
    const element = document.createElement('article');
    element.className = 'card';
    element.textContent = card.text;
    element.draggable = true;
    element.dataset.cardId = card.id;
    element.dataset.columnId = columnId;
    element.dataset.index = String(index);

    const removeButton = document.createElement('button');
    removeButton.className = 'delete-card';
    removeButton.type = 'button';
    removeButton.textContent = '✕';
    removeButton.addEventListener('click', () => this.deleteCard(columnId, card.id));

    element.append(removeButton);

    element.addEventListener('dragstart', (event) => {
      const rect = element.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      this.dragImage = element.cloneNode(true);
      this.dragImage.classList.remove('hidden');
      this.dragImage.classList.add('drag-image');
      this.dragImage.style.width = `${rect.width}px`;
      document.body.append(this.dragImage);

      this.dragged = {
        cardId: card.id,
      };
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.id);
      event.dataTransfer.setDragImage(this.dragImage, offsetX, offsetY);
      element.classList.add('dragging');
      requestAnimationFrame(() => {
        element.classList.add('hidden');
      });
    });

    element.addEventListener('dragend', () => {
      this.dragged = null;
      this.dragImage?.remove();
      this.dragImage = null;
      this.render();
    });

    return element;
  }

  createAddForm(columnId) {
    const formWrapper = document.createElement('div');
    formWrapper.className = 'add-wrapper';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-btn';
    addBtn.textContent = 'Add another card';

    const form = document.createElement('form');
    form.className = 'add-form hidden';

    const input = document.createElement('textarea');
    input.required = true;
    input.placeholder = 'Enter card title...';

    const controls = document.createElement('div');
    controls.className = 'add-controls';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'submit-btn';
    submit.textContent = 'Add Card';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel-btn';
    cancel.textContent = '✕';

    addBtn.addEventListener('click', () => {
      addBtn.classList.add('hidden');
      form.classList.remove('hidden');
      input.focus();
    });

    cancel.addEventListener('click', () => {
      form.reset();
      form.classList.add('hidden');
      addBtn.classList.remove('hidden');
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;

      this.addCard(columnId, value);
    });

    controls.append(submit, cancel);
    form.append(input, controls);
    formWrapper.append(addBtn, form);

    return formWrapper;
  }

  onDragOver(event, container) {
    event.preventDefault();
    if (!this.dragged) return;

    const cardsContainer = container || event.target.closest('.cards');
    if (!cardsContainer) return;

    const afterElement = this.getDragAfterElement(cardsContainer, event.clientY);
    this.showPlaceholder(cardsContainer, afterElement);
  }

  onDrop(event, container) {
    event.preventDefault();
    if (!this.dragged) return;

    const cardsContainer = container || event.target.closest('.cards');
    if (!cardsContainer) return;

    const placeholder = cardsContainer.querySelector('.placeholder');
    const targetIndex = placeholder
      ? Number(placeholder.dataset.index)
      : cardsContainer.querySelectorAll('.card:not(.hidden)').length;

    this.moveCard(this.dragged.cardId, {
      columnId: cardsContainer.dataset.columnId,
      index: targetIndex,
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.hidden)')];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      },
      { offset: Number.NEGATIVE_INFINITY, element: null },
    ).element;
  }

  showPlaceholder(container, beforeElement) {
    container.querySelector('.placeholder')?.remove();

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';

    if (this.dragged) {
      const draggedElement = this.container.querySelector(`[data-card-id="${this.dragged.cardId}"]`);
      placeholder.style.height = `${draggedElement?.offsetHeight || 48}px`;
    }

    const visibleCards = [...container.querySelectorAll('.card:not(.hidden)')];
    let index = visibleCards.length;

    if (beforeElement) {
      index = visibleCards.indexOf(beforeElement);
      placeholder.dataset.index = String(index);
      container.insertBefore(placeholder, beforeElement);
      return;
    }

    placeholder.dataset.index = String(index);
    container.append(placeholder);
  }
}