import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  renderSquareNull(i) {
    return <Square value={null} onClick={() => this.props.onClick(i)} />;
  }

  render() {
    let rows = [];
    for (var i = 0; i < 8; i++) {
      let squares = [];
      for (var j = 0; j < 10; j++) {
        //squares.push(this.renderSquare(10 * i + j));
        if (this.props.maskOn[10 * i + j] === true) {
          squares.push(this.renderSquareNull(10 * i + j));
        } else {
          squares.push(this.renderSquare(10 * i + j));
        }
      }
      rows.push(<div className="board-row">{squares}</div>);
    }
    return rows;
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //why why why?
      squares: this.initialGame(),
      maskOn: Array(80).fill(true),
      maskOff: 0,
      explode: false,
    };
  }

  initialGame() {
    let squares = Array(80).fill(0);
    let bombs = [];
    let count = 0;
    while (count < 10) {
      var currBomb = Math.floor(Math.random() * 80);
      if (bombs.indexOf(currBomb) === -1) {
        count += 1;
        bombs.push(currBomb);
      }
    }

    // console.log(bombs);
    for (var i = 0; i < 10; i++) {
      console.log(bombs[i]);
      squares[bombs[i]] = "B";
      let offset = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];
      for (var j = 0; j < 8; j++) {
        var x = Math.floor(bombs[i] / 10) + offset[j][0];
        var y = (bombs[i] % 10) + offset[j][1];
        //console.log(x, y);
        if (
          x >= 0 &&
          x < 8 &&
          y >= 0 &&
          y < 10 &&
          squares[x * 10 + y] !== "B"
        ) {
          squares[x * 10 + y] += 1;
        }
      }
    }
    return squares;
  }

  bfs(i, maskOn) {
    const squares = this.state.squares.slice(); // without mutation: better
    let maskOff = this.state.maskOff;
    let zeroMineAround = [i];
    let offset = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    while (zeroMineAround.length !== 0) {
      var currPos = zeroMineAround.shift(); // pop first
      if (maskOn[currPos] === true) {
        maskOn[currPos] = false;
        maskOff++;
      }
      for (var j = 0; j < 8; j++) {
        var x = Math.floor(currPos / 10) + offset[j][0];
        var y = (currPos % 10) + offset[j][1];
        //console.log(x, y);
        if (
          x >= 0 &&
          x < 8 &&
          y >= 0 &&
          y < 10 &&
          squares[x * 10 + y] !== "B" &&
          maskOn[x * 10 + y] === true
        ) {
          maskOn[x * 10 + y] = false;
          maskOff++;
          if (squares[x * 10 + y] === 0) {
            zeroMineAround.push(x * 10 + y);
          }
          // if greater than 0, reveal, no next step
        }
      }
    }

    this.setState({
      squares: squares,
      maskOn: maskOn,
      maskOff: maskOff,
    });
  }

  calculateResult() {
    if (this.state.maskOff === 70) {
      return true;
    }
    return false;
  }
  handleClick(i) {
    const squares = this.state.squares.slice(); // without mutation: better
    let maskOff = this.state.maskOff;
    let maskOn = this.state.maskOn.slice();
    let bombs = [];

    for (var x = 0; x < 80; x++) {
      if (squares[x] === "B") {
        bombs.push(x);
      }
    }

    if (maskOn[i] === false) {
      return;
    }
    if (squares[i] === "B") {
      for (var x = 0; x < 10; x++) {
        maskOn[bombs[x]] = false;
        maskOff++;
      }
      this.setState({
        squares: squares,
        maskOn: maskOn,
        maskOff: maskOff,
        explode: true,
      });

      console.log("game over");
    } else if (squares[i] === 0) {
      this.bfs(i, maskOn);
    } else {
      maskOn[i] = false;
      maskOff++;
      this.setState({
        squares: squares,
        maskOn: maskOn,
        maskOff: maskOff,
      });
    }
  }

  // jumpTo(step) {
  //   this.setState({
  //     stepNumber: step,
  //   });
  // }

  render() {
    const gameOver = this.calculateResult();
    let status;
    if (this.state.explode) {
      console.log("you lose");
      status = "You lose :(";
    } else if (gameOver) {
      console.log("you win!!!");
      status = "You win!!!";
    } else {
      status = "continue";
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={this.state.squares}
            maskOn={this.state.maskOn} // important
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          {/* <ol>{moves}</ol> */}
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));
