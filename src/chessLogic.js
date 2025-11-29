export const colors = { WHITE: 'white', BLACK: 'black' };
export const pieces = { PAWN: 'pawn', ROOK: 'rook', KNIGHT: 'knight', BISHOP: 'bishop', QUEEN: 'queen', KING: 'king' };


export const initializeBoard = () => {
  const board = [];
  for (let i = 0; i < 8; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      row.push(null);
    }
    board.push(row);
  }

  for (let j = 0; j < 8; j++) {
    board[1][j] = { type: pieces.PAWN, color: colors.BLACK };
    board[6][j] = { type: pieces.PAWN, color: colors.WHITE };
  }


  const order = [pieces.ROOK, pieces.KNIGHT, pieces.BISHOP, pieces.QUEEN, pieces.KING, pieces.BISHOP, pieces.KNIGHT, pieces.ROOK];
  for (let j = 0; j < 8; j++) {
    board[0][j] = { type: order[j], color: colors.BLACK };
    board[7][j] = { type: order[j], color: colors.WHITE };
  }

  return board;
};
export function getLegalMoves(board, from) {
  const moves = [];
  const piece = board[from.row][from.col];
  if (!piece) return moves;

  const row = from.row;
  const col = from.col;
  const color = piece.color;

  const tryAddMove = (r, c) => {
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (target === null) {
        moves.push({ from: from, to: { row: r, col: c } });
        return true;
      } else if (target.color !== color) {
        moves.push({ from: from, to: { row: r, col: c } });
        return false; 
      } else {
        return false; 
      }
    }
    return false; 
  };

  if (piece.type === pieces.PAWN) {
    const direction = color === colors.WHITE ? -1 : 1;
    const startRow = color === colors.WHITE ? 6 : 1;

    // Move forward 1
    if (row + direction >= 0 && row + direction < 8 && board[row + direction][col] === null) {
      moves.push({ from: from, to: { row: row + direction, col: col } });
      // Move forward 2
      if (row === startRow && board[row + 2 * direction][col] === null) {
        moves.push({ from: from, to: { row: row + 2 * direction, col: col } });
      }
    }


    const captureOffsets = [-1, 1];
    for (let i = 0; i < captureOffsets.length; i++) {
      const targetCol = col + captureOffsets[i];
      if (row + direction >= 0 && row + direction < 8 && targetCol >= 0 && targetCol < 8) {
        const target = board[row + direction][targetCol];
        if (target && target.color !== color) {
          moves.push({ from: from, to: { row: row + direction, col: targetCol } });
        }
      }
    }
  } else if (piece.type === pieces.KNIGHT) {
    const knightMoves = [
      { r: 2, c: 1 }, { r: 2, c: -1 }, { r: -2, c: 1 }, { r: -2, c: -1 },
      { r: 1, c: 2 }, { r: 1, c: -2 }, { r: -1, c: 2 }, { r: -1, c: -2 }
    ];
    for (let i = 0; i < knightMoves.length; i++) {
      tryAddMove(row + knightMoves[i].r, col + knightMoves[i].c);
    }
  } else if (piece.type === pieces.KING) {
    const kingMoves = [
      { r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 },
      { r: 1, c: 1 }, { r: 1, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 }
    ];
    for (let i = 0; i < kingMoves.length; i++) {
      tryAddMove(row + kingMoves[i].r, col + kingMoves[i].c);
    }
  } else {
    
    const directions = [];
    if (piece.type === pieces.ROOK || piece.type === pieces.QUEEN) {
      directions.push({ r: 1, c: 0 }, { r: -1, c: 0 }, { r: 0, c: 1 }, { r: 0, c: -1 });
    }
    if (piece.type === pieces.BISHOP || piece.type === pieces.QUEEN) {
      directions.push({ r: 1, c: 1 }, { r: 1, c: -1 }, { r: -1, c: 1 }, { r: -1, c: -1 });
    }

    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      for (let k = 1; k < 8; k++) {
        const r = row + dir.r * k;
        const c = col + dir.c * k;
        if (!tryAddMove(r, c)) break;
      }
    }
  }

  
  const safeMoves = [];
  for (let i = 0; i < moves.length; i++) {
    if (!wouldLeaveKingInCheck(board, moves[i], color)) {
      safeMoves.push(moves[i]);
    }
  }
  return safeMoves;
}

function wouldLeaveKingInCheck(board, move, color) {
  // Manual deep copy of the board
  const tempBoard = [];
  for (let i = 0; i < 8; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      row.push(board[i][j]);
    }
    tempBoard.push(row);
  }

  tempBoard[move.to.row][move.to.col] = tempBoard[move.from.row][move.from.col];
  tempBoard[move.from.row][move.from.col] = null;
  return isInCheck(tempBoard, color);
}

export const isInCheck = (board, color) => {
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === pieces.KING && p.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
  }
  if (!kingPos) return false;

  const opponentColor = color === colors.WHITE ? colors.BLACK : colors.WHITE;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === opponentColor) {
        if (checkAttack(board, { row: r, col: c }, kingPos, p)) return true;
      }
    }
  }
  return false;
};

function checkAttack(board, from, to, piece) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  if (piece.type === pieces.PAWN) {
    const direction = piece.color === colors.WHITE ? -1 : 1;
    return dr === direction && absDc === 1;
  }
  if (piece.type === pieces.KNIGHT) {
    return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
  }
  if (piece.type === pieces.KING) {
    return absDr <= 1 && absDc <= 1;
  }

  if (piece.type === pieces.ROOK || piece.type === pieces.QUEEN) {
    if (dr === 0 || dc === 0) {
      return isPathClear(board, from, to);
    }
  }
  if (piece.type === pieces.BISHOP || piece.type === pieces.QUEEN) {
    if (absDr === absDc) {
      return isPathClear(board, from, to);
    }
  }
  return false;
}

function isPathClear(board, from, to) {
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);
  let r = from.row + dr;
  let c = from.col + dc;
  while (r !== to.row || c !== to.col) {
    if (board[r][c] !== null) return false;
    r += dr;
    c += dc;
  }
  return true;
}

export const isCheckmate = (board, color) => {
  if (!isInCheck(board, color)) return false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const moves = getLegalMoves(board, { row: r, col: c });
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
};
