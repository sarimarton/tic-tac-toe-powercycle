// This code is a mirror-implementation of React's
// Tic Tac Toe example from https://codepen.io/gaearon/pen/gWWZgR
import xs from 'xstream'
import sample from 'xstream-sample'
import { run } from '@cycle/run'
import { withState } from '@cycle/state'

import './style.css'

import withPower, { makeDOMDriver } from 'powercycle'
import { Collection, If, $, $get, $map, $if } from 'powercycle/util'

function Square({ props }) {
  return (
    <button className='square' onClick={props.onClick}>
      {props.value$}
    </button>
  )
}

function Board ({ props }) {
  function renderSquare (i) {
    return (
      <Square
        value$={props.squares$.map(s => s[i])}
        onClick={() => props.onClick(i)}
      />
    )
  }

  return (
    <div>
      <div className="board-row">
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div className="board-row">
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div className="board-row">
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  )
}

function Game ({ state }) {
  const initialState$ = xs.of(() => ({
    history: [{
      squares: Array(9).fill(null)
    }],
    stepNumber: 0,
    xIsNext: true
  }))

  const current$ = state.stream
    .map(state => state.history[state.stepNumber])

  const winner$ = current$
    .map(current => calculateWinner(current.squares))

  function handleClick (i) {
    return function (prevState) {
      const history = prevState.history.slice(0, prevState.stepNumber + 1)
      const current = history[history.length - 1]
      const squares = current.squares.slice()

      if (calculateWinner(squares) || squares[i]) {
        return prevState
      }

      squares[i] = prevState.xIsNext ? "X" : "O"

      return {
        history: history.concat([{
          squares: squares
        }]),
        stepNumber: history.length,
        xIsNext: !prevState.xIsNext
      }
    }
  }

  function jumpTo(stream) {
    return stream.map(itemState => outerState => {
      const step = itemState.index
      return {
        ...outerState,
        stepNumber: step,
        xIsNext: (step % 2) === 0
      }
    })
  }

  const moves =
    <Collection for='history'>
      {src => {
        const move = $get('index')
        const desc =
          <If cond={move}
            then={<>Go to move #{move}</>}
            else={<>Go to game start</>}
          />

        return (
          <li>
            <button onClick={{
              outerState: ev$ => jumpTo(sample(src.state.stream)(ev$))
            }}>{desc}</button>
          </li>
        )
      }}
    </Collection>

  const status =
    <If cond={winner$}
      then={<>Winner: {winner$}</>}
      else={<>Next player: {$if($.xIsNext, 'X', '0')}</>}
    />

  return [
    <div className="game">
      <div className="game-board">
        <Board
          squares$={current$.map(c => c.squares)}
          onClick={i => handleClick(i)}
        />
      </div>
      <div className="game-info">
        <div>{status}</div>
        <ol>{moves}</ol>
      </div>
    </div>,
    { state: initialState$ }
  ]
}

// ========================================

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

const drivers = {
  react: makeDOMDriver(document.getElementById('root'))
}

run(withState(withPower(Game)), drivers)
