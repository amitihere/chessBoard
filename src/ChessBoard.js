import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { ChessBishop, ChessKing, ChessKnight, ChessPawn, ChessRook, ChessQueen } from 'lucide-react-native';
import { initializeBoard, colors, pieces, isCheckmate, getLegalMoves, isInCheck } from './chessLogic';

const { width } = Dimensions.get('window')
const BOARD_SIZE = width - 20;
const SQUARE_SIZE = BOARD_SIZE / 8;

const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

const PieceIcon = ({ type, color }) => {
    const props = { size: SQUARE_SIZE * 0.8, color: color === colors.WHITE ? 'white' : 'black' };
    switch (type) {
        case pieces.PAWN: return <ChessPawn {...props} />
        case pieces.ROOK: return <ChessRook {...props} />
        case pieces.KNIGHT: return <ChessKnight {...props} />
        case pieces.BISHOP: return <ChessBishop {...props} />
        case pieces.QUEEN: return <ChessQueen {...props} />
        case pieces.KING: return <ChessKing {...props} />
        default: return null;
    }
};

export default function ChessBoard() {
    const [board, setBoard] = useState(initializeBoard());
    const [turn, setTurn] = useState(colors.WHITE);
    const [moveHistory, setMoveHistory] = useState([]);

    const [selectedPiece, setSelectedPiece] = useState(null);
    const [timer, setTimer] = useState({ w: null, b: null });
    const [timerDuration, setTimerDuration] = useState(null);
    const [showModal, setShowModal] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [inCheck, setInCheck] = useState(false);

    useEffect(() => {
        setInCheck(isInCheck(board, turn));
    }, [board, turn]);

    const restart = () => {
        setBoard(initializeBoard());
        setTurn(colors.WHITE);
        setMoveHistory([]);
        setTimer({ w: null, b: null });
        setTimerDuration(null);
        setGameOver(false);
        setSelectedPiece(null);
        setShowModal(true);
        setInCheck(false);
    };

    const giveUp = () => {
        setGameOver(true);
        alert(`${turn === colors.WHITE ? 'White' : 'Black'} gave up! ${turn === colors.WHITE ? 'Black' : 'White'} wins!`);
    };

    const undoMove = () => {
        if (moveHistory.length === 0) return;

        const lastMove = moveHistory[moveHistory.length - 1];
        const previousBoard = lastMove.boardSnapshot;
        setBoard(previousBoard);
        setTurn(lastMove.turn);
        setMoveHistory(prev => prev.slice(0, -1));
        setSelectedPiece(null);
        setGameOver(false);
    };

    useEffect(() => {
        if (!timer.w || gameOver || showModal) return
        const interval = setInterval(() => {
            const k = turn === colors.WHITE ? 'w' : 'b';
            setTimer(p => {
                const t = p[k] - 1;
                if (t <= 0) {
                    setGameOver(true);
                    alert(`Time's up! ${k === 'w' ? 'Black' : 'White'} wins!`);
                    return { ...p, [k]: 0 };
                }
                return { ...p, [k]: t };
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [turn, timer.w, gameOver, showModal]);

    const handlePieceSelect = (rowIndex, colIndex) => {
        const piece = board[rowIndex][colIndex];

        // If selecting a piece to move
        if (!selectedPiece) {
            if (!piece || piece.color !== turn) return;
            const moves = getLegalMoves(board, { row: rowIndex, col: colIndex });
            if (moves.length > 0) {
                setSelectedPiece({ row: rowIndex, col: colIndex, legalMoves: moves });
            }
            return;
        }

        // If clicking on the same piece, deselect
        if (selectedPiece.row === rowIndex && selectedPiece.col === colIndex) {
            setSelectedPiece(null);
            return;
        }

        // Check if the click is a valid move
        const move = selectedPiece.legalMoves.find(
            m => m.to.row === rowIndex && m.to.col === colIndex
        );

        if (!move) {
            // If clicked on another own piece, select that instead
            if (piece && piece.color === turn) {
                const moves = getLegalMoves(board, { row: rowIndex, col: colIndex });
                if (moves.length > 0) {
                    setSelectedPiece({ row: rowIndex, col: colIndex, legalMoves: moves });
                } else {
                    setSelectedPiece(null);
                }
            } else {
                setSelectedPiece(null);
            }
            return;
        }

        if (gameOver) return;

        // Apply Move
        const newBoard = JSON.parse(JSON.stringify(board)); // Deep copy
        newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
        newBoard[move.from.row][move.from.col] = null;

        // Save history
        setMoveHistory(prev => [...prev, {
            boardSnapshot: board, // Save current board before change
            turn: turn
        }]);

        setBoard(newBoard);
        const nextTurn = turn === colors.WHITE ? colors.BLACK : colors.WHITE;
        setTurn(nextTurn);

        if (isCheckmate(newBoard, nextTurn)) {
            setGameOver(true);
            alert(`Checkmate! ${nextTurn === colors.WHITE ? 'Black' : 'White'} wins!`);
        }

        setSelectedPiece(null);
    };

    const isKingInCheck = (rowIndex, colIndex) => {
        const piece = board[rowIndex][colIndex];
        return piece && piece.type === pieces.KING && piece.color === turn && inCheck;
    };

    return (
        <View style={styles.container}>
            <Modal visible={showModal} transparent>
                <View style={styles.modal}>
                    <View style={styles.modalContent}>
                        {[2, 5, 10].map(m => (
                            <TouchableOpacity key={m} style={styles.btn} onPress={() => {
                                const d = m * 60;
                                setTimer({ w: d, b: d });
                                setTimerDuration(d);
                                setShowModal(false);
                            }}>
                                <Text style={styles.btnText}>{m} Min</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
            <View style={[styles.timer, turn === colors.BLACK && !gameOver && styles.activeTimer]}>
                <Text style={styles.timerText}>{timer.b ? formatTime(timer.b) : '--:--'}</Text>
                {inCheck && turn === colors.BLACK && !gameOver && (
                    <Text style={styles.checkText}>CHECK!</Text>
                )}
            </View>
            <View style={styles.board}>
                {board.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((piece, colIndex) => (
                            <TouchableOpacity
                                onPress={() => {
                                    if (gameOver) return;
                                    handlePieceSelect(rowIndex, colIndex);
                                }}
                                key={colIndex}
                                style={[
                                    styles.square,
                                    { backgroundColor: (rowIndex + colIndex) % 2 === 0 ? '#d3971dff' : '#45584aff' },
                                    selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                                        ? { borderWidth: 4, borderColor: 'yellow' }
                                        : null,
                                    isKingInCheck(rowIndex, colIndex)
                                        ? styles.checkSquare
                                        : null
                                ]}
                            >
                                {piece && <PieceIcon type={piece.type} color={piece.color} />}
                                {selectedPiece && selectedPiece.legalMoves.some(
                                    (m) => m.to.row === rowIndex && m.to.col === colIndex
                                ) && (
                                        <View style={[
                                            styles.legalMoveIndicator,
                                            piece ? styles.captureIndicator : styles.moveIndicator
                                        ]} />
                                    )}

                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
            <View style={[styles.timer, turn === colors.WHITE && !gameOver && styles.activeTimer]}>
                <Text style={styles.timerText}>{timer.w ? formatTime(timer.w) : '--:--'}</Text>
                {inCheck && turn === colors.WHITE && !gameOver && (
                    <Text style={styles.checkText}>CHECK!</Text>
                )}
            </View>
            {!gameOver && !showModal && (
                <View style={styles.turnIndicator}>
                    <Text style={styles.turnText}>
                        {turn === colors.WHITE ? "White to move" : "Black to move"}
                    </Text>
                </View>
            )}
            {!showModal && (
                <View style={styles.buttonRow}>
                    {!gameOver && (
                        <>
                            <TouchableOpacity style={[styles.btn, styles.undoBtn, { marginHorizontal: 5 }]} onPress={undoMove}>
                                <Text style={styles.btnText}>Undo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.giveUpBtn, { marginHorizontal: 5 }]} onPress={giveUp}>
                                <Text style={styles.btnText}>Give Up</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {gameOver && (
                        <TouchableOpacity style={[styles.btn, { marginHorizontal: 5 }]} onPress={restart}>
                            <Text style={styles.btnText}>Restart</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    square: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    board: {
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        borderWidth: 2,
        borderColor: '#333',
    },
    timer: {
        width: BOARD_SIZE,
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    activeTimer: {
        backgroundColor: '#e8f5e9',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    timerText: {
        fontSize: 28,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    modal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        width: width * 0.8,
        alignItems: 'center',
    },
    btn: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 10,
        marginVertical: 5,
        maxWidth: width * 0.6,
        alignItems: 'center',
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        width: BOARD_SIZE,
    },
    giveUpBtn: {
        backgroundColor: '#f44336',
    },
    undoBtn: {
        backgroundColor: '#2196F3',
    },
    legalMoveIndicator: {
        position: 'absolute',
        borderRadius: 50,
    },
    moveIndicator: {
        width: SQUARE_SIZE * 0.3,
        height: SQUARE_SIZE * 0.3,
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
    },
    captureIndicator: {
        width: SQUARE_SIZE * 0.9,
        height: SQUARE_SIZE * 0.9,
        borderWidth: 4,
        borderColor: 'rgba(255, 0, 0, 0.6)',
        backgroundColor: 'transparent',
    },
    checkText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f44336',
        marginTop: 5,
    },
    checkSquare: {
        backgroundColor: '#ff6b6b',
        borderWidth: 3,
        borderColor: '#d32f2f',
    },
    turnIndicator: {
        width: BOARD_SIZE,
        padding: 8,
        marginVertical: 5,
        backgroundColor: '#fff3e0',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff9800',
    },
    turnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e65100',
    },
});
