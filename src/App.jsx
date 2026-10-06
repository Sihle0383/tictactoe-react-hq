import { useReducer, useEffect, useState } from 'react'
import './App.css'

const initialState = {
  board: Array(9).fill(null),
  xIsNext: true,
  winner: null,
  isDraw: false,
  scores: { X: 0, O: 0, draws: 0 },
  mode: 'computer', // 'friend' or 'computer'
  difficulty: 'hard' // 'easy' or 'hard'
}

function calculateWinner(s) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (let [a,b,c] of lines) {
    if (s[a] && s[a] === s[b] && s[a] === s[c]) return { player: s[a], line: [a,b,c] }
  }
  return null
}

// Minimax for unbeatable AI
function minimax(board, isMax, ai, human) {
  const win = calculateWinner(board)
  if (win) return win.player === ai? 10 : -10
  if (board.every(Boolean)) return 0

  let best = isMax? -Infinity : Infinity
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = isMax? ai : human
      const score = minimax(board,!isMax, ai, human)
      board[i] = null
      best = isMax? Math.max(best, score) : Math.min(best, score)
    }
  }
  return best
}

function getBestMove(board, ai, human, difficulty) {
  if (difficulty === 'easy') {
    const empty = board.map((v,i) => v? null : i).filter(v => v!== null)
    return empty[Math.floor(Math.random() * empty.length)]
  }
  let bestScore = -Infinity, bestMove = null
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai
      const score = minimax(board, false, ai, human)
      board[i] = null
      if (score > bestScore) { bestScore = score; bestMove = i }
    }
  }
  return bestMove
}

function reducer(state, action) {
  switch(action.type) {
    case 'MAKE_MOVE': {
      if (state.board[action.index] || state.winner || state.isDraw) return state
      const newBoard = state.board.slice()
      newBoard[action.index] = state.xIsNext? 'X' : 'O'
      const win = calculateWinner(newBoard)
      const draw =!win && newBoard.every(Boolean)
      let scores = state.scores
      if (win) scores = {...scores, [win.player]: scores[win.player] + 1 }
      else if (draw) scores = {...scores, draws: scores.draws + 1 }
      return {...state, board: newBoard, xIsNext:!state.xIsNext, winner: win, isDraw: draw, scores }
    }
    case 'COMPUTER_MOVE': {
      const move = getBestMove(state.board, 'O', 'X', state.difficulty)
      if (move === null || move === undefined) return state
      const newBoard = state.board.slice()
      newBoard[move] = 'O'
      const win = calculateWinner(newBoard)
      const draw =!win && newBoard.every(Boolean)
      let scores = state.scores
      if (win) scores = {...scores, [win.player]: scores[win.player] + 1 }
      else if (draw) scores = {...scores, draws: scores.draws + 1 }
      return {...state, board: newBoard, xIsNext: true, winner: win, isDraw: draw, scores }
    }
    case 'RESET': return {...state, board: Array(9).fill(null), xIsNext: true, winner: null, isDraw: false }
    case 'RESET_ALL': return {...initialState, mode: state.mode, difficulty: state.difficulty }
    case 'SET_MODE': return {...initialState, mode: action.mode, difficulty: state.difficulty }
    case 'SET_DIFFICULTY': return {...state, difficulty: action.difficulty }
    default: return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [thinking, setThinking] = useState(false)

  // Auto computer move when it's O's turn
  useEffect(() => {
    if (state.mode === 'computer' &&!state.xIsNext &&!state.winner &&!state.isDraw) {
      setThinking(true)
      const timer = setTimeout(() => {
        dispatch({ type: 'COMPUTER_MOVE' })
        setThinking(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [state.xIsNext, state.mode, state.winner, state.isDraw])

  let status
  if (state.winner) status = `Winner: ${state.winner.player} ${state.winner.player === 'O' && state.mode === 'computer'? '🤖' : '🎉'}`
  else if (state.isDraw) status = "Draw! 🤝"
  else if (thinking) status = "Computer thinking... 🤖"
  else status = `Next Player: ${state.xIsNext? 'X' : 'O'} ${state.mode === 'computer' &&!state.xIsNext? '(Computer)' : ''}`

  return (
    <div className="app">
      <h1>TicTacToe <span>React HQ</span></h1>

      <div className="mode-toggle">
        <button className={state.mode === 'friend'? 'active' : ''} onClick={() => dispatch({ type: 'SET_MODE', mode: 'friend' })}>👥 vs Friend</button>
        <button className={state.mode === 'computer'? 'active' : ''} onClick={() => dispatch({ type: 'SET_MODE', mode: 'computer' })}>🤖 vs Computer</button>
      </div>

      {state.mode === 'computer' && (
        <div className="mode-toggle small">
          <button className={state.difficulty === 'easy'? 'active' : ''} onClick={() => dispatch({ type: 'SET_DIFFICULTY', difficulty: 'easy' })}>Easy (Random)</button>
          <button className={state.difficulty === 'hard'? 'active' : ''} onClick={() => dispatch({ type: 'SET_DIFFICULTY', difficulty: 'hard' })}>Hard (Minimax)</button>
        </div>
      )}

      <div className="scoreboard">
        <div className={state.xIsNext &&!state.winner? 'active' : ''}>X: {state.scores.X}</div>
        <div>Draws: {state.scores.draws}</div>
        <div className={!state.xIsNext &&!state.winner? 'active' : ''}>O: {state.scores.O}</div>
      </div>

      <div className={`status ${state.winner? 'win' : ''} ${state.isDraw? 'draw' : ''}`}>{status}</div>

      <div className="board">
        {state.board.map((val, i) => (
          <button key={i} className={`square ${val? 'filled' : ''} ${state.winner?.line.includes(i)? 'win-line' : ''}`} onClick={() => dispatch({ type: 'MAKE_MOVE', index: i })} disabled={thinking}>
            {val}
          </button>
        ))}
      </div>

      <div className="controls">
        <button className="btn" onClick={() => dispatch({ type: 'RESET' })}>🔁 Restart Game</button>
        <button className="btn secondary" onClick={() => dispatch({ type: 'RESET_ALL' })}>Reset Scores</button>
      </div>

      <div className="history">
        <h3>🧠 State Management: useReducer</h3>
        <p>Actions: MAKE_MOVE, COMPUTER_MOVE, RESET, SET_MODE, SET_DIFFICULTY</p>
        <p>AI uses Minimax algorithm for unbeatable mode, random for easy mode</p>
      </div>

      <footer>Manual Feature: Scoreboard + Restart | Advanced: Play vs Computer AI</footer>
    </div>
  )
}