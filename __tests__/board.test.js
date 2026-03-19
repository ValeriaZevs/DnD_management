import Board from '../src/board';

const makeBoard = () => {
  const container = document.createElement('div');
  const board = new Board(container);
  board.state = {
    columns: [
      {
        id: 'todo',
        title: 'TODO',
        cards: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'B' },
          { id: 'c', text: 'C' },
        ],
      },
      {
        id: 'inprogress',
        title: 'IN PROGRESS',
        cards: [{ id: 'd', text: 'D' }],
      },
      {
        id: 'done',
        title: 'DONE',
        cards: [],
      },
    ],
  };

  return board;
};

describe('board moveCard', () => {
  test('moves card between columns', () => {
    const board = makeBoard();

    board.moveCard('b', { columnId: 'inprogress', index: 1 });

    expect(board.state.columns.find((col) => col.id === 'todo').cards.map((card) => card.id)).toEqual(['a', 'c']);
    expect(board.state.columns.find((col) => col.id === 'inprogress').cards.map((card) => card.id)).toEqual(['d', 'b']);
  });

  test('moves card down inside same column with correct index correction', () => {
    const board = makeBoard();

    board.moveCard('a', { columnId: 'todo', index: 3 });

    expect(board.state.columns.find((col) => col.id === 'todo').cards.map((card) => card.id)).toEqual(['b', 'c', 'a']);
  });

  test('moves card up inside same column', () => {
    const board = makeBoard();

    board.moveCard('c', { columnId: 'todo', index: 0 });

    expect(board.state.columns.find((col) => col.id === 'todo').cards.map((card) => card.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('board drag helpers', () => {
  test('getCardsContainerFromPosition finds a column by bounding boxes', () => {
    const container = document.createElement('div');
    const board = new Board(container);
    board.render();

    const cards = [...container.querySelectorAll('.cards')];
    const columns = [...container.querySelectorAll('.column')];

    columns[0].getBoundingClientRect = () => ({
      left: 0,
      right: 100,
      top: 0,
      bottom: 300,
    });
    columns[1].getBoundingClientRect = () => ({
      left: 120,
      right: 220,
      top: 0,
      bottom: 300,
    });
    columns[2].getBoundingClientRect = () => ({
      left: 240,
      right: 340,
      top: 0,
      bottom: 300,
    });

    cards[0].getBoundingClientRect = () => ({
      left: 0,
      right: 100,
      top: 40,
      bottom: 180,
      height: 140,
    });
    cards[1].getBoundingClientRect = () => ({
      left: 120,
      right: 220,
      top: 40,
      bottom: 180,
      height: 140,
    });
    cards[2].getBoundingClientRect = () => ({
      left: 240,
      right: 340,
      top: 40,
      bottom: 180,
      height: 140,
    });

    expect(board.getCardsContainerFromPosition(150, 120)).toBe(cards[1]);
  });

  test('getDropTarget uses placeholder index for target column', () => {
    const board = makeBoard();

    const targetContainer = document.createElement('div');
    targetContainer.className = 'cards';
    targetContainer.dataset.columnId = 'done';

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.dataset.index = '0';
    targetContainer.append(placeholder);

    board.placeholder = placeholder;

    expect(board.getDropTarget(0, 0)).toEqual({ columnId: 'done', index: 0 });
  });

  test('showPlaceholder appends placeholder to the end when no target card exists', () => {
    const board = makeBoard();
    const container = document.createElement('div');
    container.className = 'cards';

    const card = document.createElement('article');
    card.className = 'card';
    container.append(card);

    board.showPlaceholder(container, null, 64);

    expect(board.placeholder).not.toBeNull();
    expect(board.placeholder.dataset.index).toBe('1');
    expect(board.placeholder.style.height).toBe('64px');
    expect(container.lastElementChild).toBe(board.placeholder);
  });

  test('onPointerUp moves card to drop target', () => {
    const board = makeBoard();
    const sourceElement = document.createElement('article');
    sourceElement.className = 'card drag-source-hidden';

    const targetContainer = document.createElement('div');
    targetContainer.className = 'cards';
    targetContainer.dataset.columnId = 'done';

    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.dataset.index = '0';
    targetContainer.append(placeholder);

    board.placeholder = placeholder;
    board.dragged = { cardId: 'b', element: sourceElement };

    board.onPointerUp({ clientX: 0, clientY: 0 });

    expect(board.state.columns.find((col) => col.id === 'todo').cards.map((card) => card.id)).toEqual(['a', 'c']);
    expect(board.state.columns.find((col) => col.id === 'done').cards.map((card) => card.id)).toEqual(['b']);
  });
});