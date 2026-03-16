import { createDefaultState } from '../src/state';

describe('state', () => {
  test('createDefaultState returns 3 fixed columns', () => {
    const state = createDefaultState();
    expect(state.columns).toHaveLength(3);
    expect(state.columns.map((col) => col.id)).toEqual(['todo', 'inprogress', 'done']);
  });
});
