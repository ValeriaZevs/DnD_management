import { generateId, loadState, saveState } from './state';

const CENTER_DIVISOR = 2;

export default class Board {
  constructor(container) {
    this.container = container;
    this.state = loadState();
    
    this.dragged = null;
    this.dragImage = null;
    this.placeholder = null;
    this.shiftX = 0;
    this.shiftY = 0;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
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
      targetIndex--;
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
    element.dataset.cardId = card.id;
    element.dataset.columnId = columnId;
    element.dataset.index = String(index);

    const removeButton = document.createElement('button');
    removeButton.className = 'delete-card';
    removeButton.type = 'button';
    removeButton.textContent = '✕';
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation(); 
      this.deleteCard(columnId, card.id);
    });

    element.append(removeButton);

    element.addEventListener('pointerdown', (event) => {
      if (event.target === removeButton) return;
      event.preventDefault();

      const rect = element.getBoundingClientRect();
      
      this.shiftX = event.clientX - rect.left;
      this.shiftY = event.clientY - rect.top;

      this.dragged = {
        cardId: card.id,
        element: element
      };

      this.dragImage = element.cloneNode(true);
      this.dragImage.classList.add('drag-image');
      this.dragImage.style.width = `${rect.width}px`;
      this.dragImage.style.height = `${rect.height}px`;
      
      this.dragImage.style.left = `${event.pageX - this.shiftX}px`;
      this.dragImage.style.top = `${event.pageY - this.shiftY}px`;
      
      document.body.append(this.dragImage);
      document.body.classList.add('drag-active');

      this.showPlaceholder(element.closest('.cards'), element, element.offsetHeight);

      element.classList.add('drag-source-hidden');

      document.addEventListener('pointermove', this.onPointerMove);
      document.addEventListener('pointerup', this.onPointerUp);
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

  onPointerMove(event) {
    if (!this.dragImage || !this.dragged) return;

    this.dragImage.style.left = `${event.pageX - this.shiftX}px`;
    this.dragImage.style.top = `${event.pageY - this.shiftY}px`;

    const cardsContainer = this.getCardsContainerFromPosition(event.clientX, event.clientY);
    if (!cardsContainer) return;

    const afterElement = this.getDragAfterElement(cardsContainer, event.clientY);
    this.showPlaceholder(cardsContainer, afterElement, this.dragged.element.offsetHeight);
  }

  onPointerUp(event) {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.body.classList.remove('drag-active');

    if (!this.dragged) return;

    if (this.placeholder && this.placeholder.parentNode) {
      const target = this.getDropTarget();
      if (target) {
        this.moveCard(this.dragged.cardId, target);
      }
    } else {
      this.dragged.element.classList.remove('drag-source-hidden');
    }

    this.dragImage?.remove();
    this.placeholder?.remove();
    this.dragged = null;
    this.dragImage = null;
    this.placeholder = null;
  }

  getCardsContainerFromPosition(x, y) {
    if (this.dragImage) {
      this.dragImage.style.visibility = 'hidden';
    }
    
    const elemBelow = document.elementFromPoint(x, y);
    
    if (this.dragImage) {
      this.dragImage.style.visibility = 'visible';
    }

    if (!elemBelow) return null;
    return elemBelow.closest('.cards');
  }

  getDropTarget() {
    if (!this.placeholder || !this.placeholder.parentNode) return null;
    
    const cardsContainer = this.placeholder.closest('.cards');
    if (!cardsContainer) return null;

    return {
      columnId: cardsContainer.dataset.columnId,
      index: Number(this.placeholder.dataset.index),
    };
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.drag-source-hidden):not(.placeholder)')];

    for (const child of draggableElements) {
      const box = child.getBoundingClientRect();
      const childCenterY = box.top + box.height / CENTER_DIVISOR;

      if (y < childCenterY) {
        return child;
      }
    }

    return null;
  }

  showPlaceholder(container, beforeElement, height) {
    if (!this.placeholder) {
      this.placeholder = document.createElement('div');
      this.placeholder.className = 'placeholder';
    }

    if (height) {
      this.placeholder.style.height = `${height}px`;
    }

    const visibleCards = [...container.querySelectorAll('.card:not(.drag-source-hidden):not(.placeholder)')];
    
    if (beforeElement) {
      const index = visibleCards.indexOf(beforeElement);
      this.placeholder.dataset.index = String(index);
      container.insertBefore(this.placeholder, beforeElement);
    } else {
      this.placeholder.dataset.index = String(visibleCards.length);
      container.append(this.placeholder);
    }
  }
}