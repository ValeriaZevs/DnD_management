import '../css/style.css';
import Board from './board';

const app = document.getElementById('app');
const board = new Board(app);
board.init();
