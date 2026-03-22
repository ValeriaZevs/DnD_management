const STORAGE_KEY = 'trello-board-state';
const EXPECTED_COLUMNS_COUNT = 3;
const ID_RADIX = 16;
const ID_SLICE_START = 2;

export const createDefaultState = () => ({
  columns: [
    { id: 'todo', title: 'TODO', cards: [] },
    { id: 'inprogress', title: 'IN PROGRESS', cards: [] },
    { id: 'done', title: 'DONE', cards: [] },
  ],
});

export const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.columns || parsed.columns.length !== EXPECTED_COLUMNS_COUNT) {
      return createDefaultState();
    }
    return parsed;
  } catch {
    return createDefaultState();
  }
};

export const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const generateId = () => `${Date.now()}-${Math.random().toString(ID_RADIX).slice(ID_SLICE_START)}`;
