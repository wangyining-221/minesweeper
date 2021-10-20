import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

function Square(props) {
  return (
    <button
      className="square"
      onClick={props.onClick}
      onContextMenu={props.onContextMenu}
    >
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={(e) => this.props.onClick(i)}
        onContextMenu={(e) => this.props.onContextMenu(i)}
      />
    );
  }

  renderSquareNull(i) {
    return (
      <Square
        value={null}
        onClick={(e) => this.props.onClick(i)}
        onContextMenu={(e) => this.props.onContextMenu(i)}
      />
    );
  }

  renderSquareFlag(i) {
    return (
      <Square
        value={"F"}
        onClick={(e) => this.props.onClick(i)}
        onContextMenu={(e) => this.props.onContextMenu(i)}
      />
    );
  }

  render() {
    let res = [];
    for (var i = 0; i < this.props.rows; i++) {
      let squares = [];
      for (var j = 0; j < this.props.cols; j++) {
        //squares.push(this.renderSquare(10 * i + j));
        if (this.props.maskOn[this.props.cols * i + j] === false) {
          squares.push(this.renderSquare(this.props.cols * i + j));
        } else if (this.props.markWithFlag[this.props.cols * i + j] === true) {
          squares.push(this.renderSquareFlag(this.props.cols * i + j));
        } else {
          squares.push(this.renderSquareNull(this.props.cols * i + j));
        }
      }
      res.push(<div className="board-row">{squares}</div>);
    }
    return res;
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.mines = 10; //40;
    this.rows = 8; //14;
    this.cols = 10; //18;
    this.state = {
      //why why why?
      squares: this.initialGame(),
      maskOn: Array(this.rows * this.cols).fill(true),
      markWithFlag: Array(this.rows * this.cols).fill(false),
      maskOff: 0,
      explode: false,
      flags: this.mines,
    };
  }

  initialGame() {
    let squares = Array(this.rows * this.cols).fill(0);
    let bombs = [];
    let count = 0;
    while (count < this.mines) {
      var currBomb = Math.floor(Math.random() * this.rows * this.cols);
      if (bombs.indexOf(currBomb) === -1) {
        count += 1;
        bombs.push(currBomb);
      }
    }
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
    // console.log(bombs);
    for (var i = 0; i < this.mines; i++) {
      console.log(bombs[i]);
      squares[bombs[i]] = "B";
      for (var j = 0; j < 8; j++) {
        // fixed
        var x = Math.floor(bombs[i] / this.cols) + offset[j][0];
        var y = (bombs[i] % this.cols) + offset[j][1];
        //console.log(x, y);
        if (
          x >= 0 &&
          x < this.rows &&
          y >= 0 &&
          y < this.cols &&
          squares[x * this.cols + y] !== "B"
        ) {
          squares[x * this.cols + y] += 1;
        }
      }
    }
    return squares;
  }

  bfs(i, maskOn) {
    const squares = this.state.squares.slice(); // without mutation: better
    let maskOff = this.state.maskOff;
    let zeroMineAround = [i];
    let markWithFlag = this.state.markWithFlag.slice();
    let flags = this.state.flags;
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

    if (markWithFlag[i] === true) {
      markWithFlag[i] = false;
      flags++;
      console.log("unmark flag" + i);
    }
    maskOn[i] = false;
    maskOff++;

    while (zeroMineAround.length !== 0) {
      var currPos = zeroMineAround.shift(); // pop first
      for (var j = 0; j < 8; j++) {
        var x = Math.floor(currPos / this.cols) + offset[j][0];
        var y = (currPos % this.cols) + offset[j][1];
        //console.log(x, y);
        if (
          x >= 0 &&
          x < this.rows &&
          y >= 0 &&
          y < this.cols &&
          squares[x * this.cols + y] !== "B" &&
          maskOn[x * this.cols + y] === true
        ) {
          if (markWithFlag[x * this.cols + y] === true) {
            markWithFlag[x * this.cols + y] = false;
            flags++;
            console.log("unmark flag" + i);
          }
          maskOn[x * this.cols + y] = false;
          maskOff++;

          if (squares[x * this.cols + y] === 0) {
            zeroMineAround.push(x * this.cols + y);
          }
          // if greater than 0, reveal, no next step
        }
      }
    }

    this.setState({
      squares: squares,
      maskOn: maskOn,
      maskOff: maskOff,
      flags: flags,
      markWithFlag: markWithFlag,
    });
  }

  calculateResult() {
    if (this.state.maskOff === this.cols * this.rows - this.mines) {
      return true;
    }
    return false;
  }
  markAsFlag(i) {
    if (this.state.maskOn[i] === false) {
      console.log("already revealed, cannot be marked as flag");
      return;
    }
    let markWithFlag = this.state.markWithFlag.slice();
    let flags = this.state.flags;
    if (this.state.markWithFlag[i] === true) {
      console.log("already marked as flag, unmark");
      markWithFlag[i] = false;
      flags++;
    } else {
      console.log("mark as flag");
      flags--;
      markWithFlag[i] = true;
    }
    this.setState({ markWithFlag: markWithFlag, flags: flags });
  }

  handleClick(i) {
    const squares = this.state.squares.slice(); // without mutation: better
    let maskOff = this.state.maskOff;
    let maskOn = this.state.maskOn.slice();
    let bombs = [];
    if (this.state.markWithFlag[i] === true) {
      return;
    }
    if (maskOn[i] === false) {
      return;
    }
    //console.log("look at here!!!!" + e.type);

    for (var x = 0; x < this.rows * this.cols; x++) {
      if (squares[x] === "B") {
        bombs.push(x);
      }
    }

    if (squares[i] === "B") {
      for (var t = 0; t < this.mines; t++) {
        maskOn[bombs[t]] = false;
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
      console.log("");
      status = "You win!!!";
    } else {
      status = "continue";
    }
    let restFlags;
    restFlags = "flags: " + this.state.flags;

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={this.state.squares}
            maskOn={this.state.maskOn} // important
            markWithFlag={this.state.markWithFlag}
            onClick={(i) => this.handleClick(i)}
            onContextMenu={(i) => this.markAsFlag(i)}
            rows={this.rows}
            cols={this.cols}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <div>{restFlags}</div>
          {/* <ol>{moves}</ol> */}
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));
