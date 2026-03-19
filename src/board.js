import { generateId, loadState, saveState } from './state';

export default class Board {
  constructor(container) {
    this.container = container;
    this.state = loadState();
    
    // Переменные для хранения состояния DnD
    this.dragged = null;
    this.dragImage = null;
    this.placeholder = null;
    this.shiftX = 0;
    this.shiftY = 0;

    // Привязываем контекст для глобальных обработчиков
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
    // Корректировка индекса при перемещении вниз в той же колонке
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
      e.stopPropagation(); // Чтобы клик по крестику не начинал Drag and Drop
      this.deleteCard(columnId, card.id);
    });

    element.append(removeButton);

    // Вместо dragstart используем mousedown / pointerdown
    element.addEventListener('pointerdown', (event) => {
      if (event.target === removeButton) return;
      event.preventDefault(); // Предотвращаем выделение текста

      const rect = element.getBoundingClientRect();
      
      // Запоминаем сдвиг курсора относительно левого верхнего угла карточки
      this.shiftX = event.clientX - rect.left;
      this.shiftY = event.clientY - rect.top;

      this.dragged = {
        cardId: card.id,
        element: element
      };

      // Создаем "призрака" для перетаскивания
      this.dragImage = element.cloneNode(true);
      this.dragImage.classList.add('drag-image');
      this.dragImage.style.width = `${rect.width}px`;
      this.dragImage.style.height = `${rect.height}px`;
      
      // Позиционируем клон прямо под курсором
      this.dragImage.style.left = `${event.pageX - this.shiftX}px`;
      this.dragImage.style.top = `${event.pageY - this.shiftY}px`;
      
      document.body.append(this.dragImage);
      document.body.classList.add('drag-active'); // Меняем курсор глобально

      // Прячем оригинальную карточку (остается в DOM для расчетов, но невидима)
      element.classList.add('drag-source-hidden');

      // Навешиваем слушатели на весь документ
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

    // Двигаем "призрака" за мышкой, сохраняя изначальный сдвиг
    this.dragImage.style.left = `${event.pageX - this.shiftX}px`;
    this.dragImage.style.top = `${event.pageY - this.shiftY}px`;

    // Определяем контейнер под курсором
    const cardsContainer = this.getCardsContainerFromPosition(event.clientX, event.clientY);
    if (!cardsContainer) return;

    // Находим элемент, перед которым нужно вставить плейсхолдер
    const afterElement = this.getDragAfterElement(cardsContainer, event.clientY);
    this.showPlaceholder(cardsContainer, afterElement, this.dragged.element.offsetHeight);
  }

  onPointerUp(event) {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.body.classList.remove('drag-active');

    if (!this.dragged) return;

    // Если есть плейсхолдер, значит мы бросили карточку в валидное место
    if (this.placeholder && this.placeholder.parentNode) {
      const target = this.getDropTarget();
      if (target) {
        this.moveCard(this.dragged.cardId, target);
      }
    } else {
      // Если бросили мимо колонок, возвращаем видимость оригиналу
      this.dragged.element.classList.remove('drag-source-hidden');
    }

    // Очистка
    this.dragImage?.remove();
    this.placeholder?.remove();
    this.dragged = null;
    this.dragImage = null;
    this.placeholder = null;
  }

  // Метод для тестов и поиска колонки по координатам
  getCardsContainerFromPosition(x, y) {
    // Временно скрываем клона, чтобы он не перекрывал элементы под ним
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
    // Ищем все карточки в контейнере, кроме перетаскиваемой (она скрыта классом)
    const draggableElements = [...container.querySelectorAll('.card:not(.drag-source-hidden)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      // Центр карточки
      const offset = y - box.top - box.height / 2;
      
      // Нам нужен элемент, центр которого находится чуть ниже курсора
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  showPlaceholder(container, beforeElement, height) {
    if (!this.placeholder) {
      this.placeholder = document.createElement('div');
      this.placeholder.className = 'placeholder';
    }

    if (height) {
      this.placeholder.style.height = `${height}px`;
    }

    const visibleCards = [...container.querySelectorAll('.card:not(.drag-source-hidden)')];
    
    if (beforeElement) {
      const index = visibleCards.indexOf(beforeElement);
      this.placeholder.dataset.index = String(index);
      container.insertBefore(this.placeholder, beforeElement);
    } else {
      // Вставляем в конец колонки
      this.placeholder.dataset.index = String(visibleCards.length);
      container.append(this.placeholder);
    }
  }
}