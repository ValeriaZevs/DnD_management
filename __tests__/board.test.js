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