import { useReducer } from 'react'
import './App.css'

const initialState = {
  history: [Array(9).fill(null)],
  step: 0,
  xIsNext: true,
  scores: { X: 0, O: 0, draws: 0 },
  winner: null,
  isDraw: false,
}

function calculateWinner(squares) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (let [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: [a,b,c] }
    }
  }
  return null
}

function reducer(state, action) {
  switch(action.type) {
    case 'MAKE_MOVE': {
      const history = state.history.slice(0, state.step + 1)
      const current = history[history.length - 1]
      if (current[action.index] || state.winner) return state

      const newBoard = current.slice()
      newBoard[action.index] = state.xIsNext? 'X' : 'O'
      const win = calculateWinner(newBoard)
      const draw =!win && newBoard.every(Boolean)

      let scores = state.scores
      if (win && history.length === state.step + 1) {
        scores = {...scores, [win.player]: scores[win.player] + 1 }
      } else if (draw && history.length === state.step + 1) {
        scores = {...scores, draws: scores.draws + 1 }
      }

      return {
       ...state,
        history: [...history, newBoard],
        step: history.length,
        xIsNext:!state.xIsNext,
        winner: win,
        isDraw: draw,
        scores
      }
    }
    case 'JUMP_TO': {
      const board = state.history[action.step]
      return {
       ...state,
        step: action.step,
        xIsNext: action.step % 2 === 0,
        winner: calculateWinner(board),
        isDraw:!calculateWinner(board) && board.every(Boolean)
      }
    }
    case 'RESET': {
      return {
       ...state,
        history: [Array(9).fill(null)],
        step: 0,
        xIsNext: true,
        winner: null,
        isDraw: false,
      }
    }
    case 'RESET_ALL': {
      return initialState
    }
    default: return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const currentBoard = state.history[state.step]

  let status
  if (state.winner) status = `Winner: ${state.winner.player} 🎉`
  else if (state.isDraw) status = "Draw! 🤝"
  else status = `Next Player: ${state.xIsNext? 'X' : 'O'}`

  return (
    <div className="app">
      <h1>TicTacToe <span>React HQ</span></h1>

      <div className="scoreboard">
        <div className={state.xIsNext &&!state.winner? 'active' : ''}>X: {state.scores.X}</div>
        <div>Draws: {state.scores.draws}</div>
        <div className={!state.xIsNext &&!state.winner? 'active' : ''}>O: {state.scores.O}</div>
      </div>

      <div className={`status ${state.winner? 'win' : ''} ${state.isDraw? 'draw' : ''}`}>{status}</div>

      <div className="board">
        {currentBoard.map((val, i) => (
          <button
            key={i}
            className={`square ${val? 'filled' : ''} ${state.winner?.line.includes(i)? 'win-line' : ''}`}
            onClick={() => dispatch({ type: 'MAKE_MOVE', index: i })}
          >
            {val}
          </button>
        ))}
      </div>

      <div className="controls">
        <button className="btn" onClick={() => dispatch({ type: 'RESET' })}>🔁 Restart Game</button>
        <button className="btn secondary" onClick={() => dispatch({ type: 'RESET_ALL' })}>Reset Scores</button>
      </div>

      <div className="history">
        <h3>Move History + Time Travel ⏪</h3>
        <div className="history-list">
          {state.history.map((_, move) => (
            <button
              key={move}
              className={move === state.step? 'current' : ''}
              onClick={() => dispatch({ type: 'JUMP_TO', step: move })}
            >
              {move === 0? 'Go to Start' : `Go to Move #${move}`}
            </button>
          ))}
        </div>
      </div>

      <footer>Built with useReducer • No AI • Clean State Management</footer>
    </div>
  )
}