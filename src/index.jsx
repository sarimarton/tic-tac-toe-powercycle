// This code is a mirror-implementation of React's
// Tic Tac Toe example from https://codepen.io/gaearon/pen/gWWZgR
import xs from 'xstream'
import { run } from '@cycle/run'
import { withState } from '@cycle/state'

import './style.css'

import withPower, { makeDOMDriver } from 'powercycle'
import { Collection, If, $, $map, $if } from 'powercycle/util'
import { get } from 'powercycle/fp'

function Square ({ props }) {
  return (
    <button className='square' onClick={props.onClick}>
      {props.value}
    </button>
  )
}

function Board ({ props }) {
  const getSquare = i =>
    <Square
      value={props.squares[i]}
      onClick={() => props.onClick(i)}
    />

  return (
    <div>
      <div className='board-row'>
        {getSquare(0)}
        {getSquare(1)}
        {getSquare(2)}
      </div>
      <div className='board-row'>
        {getSquare(3)}
        {getSquare(4)}
        {getSquare(5)}
      </div>
      <div className='board-row'>
        {getSquare(6)}
        {getSquare(7)}
        {getSquare(8)}
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
    .map(get('squares'))
    .map(calculateWinner)

  const getHandleClickReducer = i => prev => {
    const history = prev.history.slice(0, prev.stepNumber + 1)
    const current = history[history.length - 1]
    const squares = current.squares.slice()

    if (calculateWinner(squares) || squares[i]) {
      return prev
    }

    squares[i] = prev.xIsNext ? 'X' : 'O'

    return {
      history: history.concat([{
        squares: squares
      }]),
      stepNumber: history.length,
      xIsNext: !prev.xIsNext
    }
  }

  const jumpToReducer = prev => {
    const step = prev.index
    return ({
      ...prev,
      outerState: {
        ...prev.outerState,
        stepNumber: step,
        xIsNext: (step % 2) === 0
      }
    })
  }

  const move = $.index

  const moves =
    <Collection for='history'>
      <li>
        <button onClick={ev => jumpToReducer}>
          <If cond={move}
            then={<>Go to move #{move}</>}
            else={<>Go to game start</>}
          />
        </button>
      </li>
    </Collection>

  const status =
    // $if($.xIsNext, 'X', '0')
    <If cond={winner$}
      then={<>Winner: {winner$}</>}
      else={<>Next player: {$if($.xIsNext, 'X', '0')}</>}
    />

  return [
    <div className='game'>
      <div className='game-board'>
        <Board
          squares={$(current$).squares}
          onClick={i => getHandleClickReducer(i)}
        />
      </div>
      <div className='game-info'>
        <div>{status}</div>
        <ol>{moves}</ol>
      </div>
    </div>,
    { state: initialState$ }
  ]
}

// ========================================

function calculateWinner (squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ]
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

const drivers = {
  react: makeDOMDriver(document.getElementById('root'))
}

run(withState(withPower(Game)), drivers)
