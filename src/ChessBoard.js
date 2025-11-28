import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { ChessBishop, ChessKing, ChessKnight, ChessPawn, ChessRook, ChessQueen } from 'lucide-react-native';
import { initializeBoard, colors, pieces, gameState, applyMove, isCheckmate, isStalemate, getLegalMoves, setGameState, newGame} from './chessLogic';

const { width } = Dimensions.get('window')
const BOARD_SIZE = width - 20;
const SQUARE_SIZE = BOARD_SIZE / 8;

const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;



const PieceIcon = ({ type, color }) => {
    const props = { size: SQUARE_SIZE * 0.8, color: color === colors.WHITE ? 'white' : 'black' };
    switch (type) {
        case pieces.PAWN:
            return <ChessPawn {...props} />

        case pieces.ROOK:
            return <ChessRook {...props} />

        case pieces.KNIGHT:
            return <ChessKnight {...props} />

        case pieces.BISHOP:
            return <ChessBishop {...props} />

        case pieces.QUEEN:
            return <ChessQueen {...props} />

        case pieces.KING:
            return <ChessKing {...props} />
        default:
            return null;
    }
};


export default function ChessBoard() {
    console.log('DEBUG: gameState in ChessBoard:', gameState);
    const [board, setBoard] = useState(initializeBoard());
    const [vertical, setVertical] = useState(null)
    const [horizontal, setHorizontal] = useState(null)
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [timer, setTimer] = useState({ w: null, b: null });
    const [timerDuration, setTimerDuration] = useState(null);
    const [showModal, setShowModal] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const ref = useRef(null);

    const restart = () => {
        newGame();
        setBoard(initializeBoard());
        setTimer({ w: null, b: null });
        setTimerDuration(null);
        setGameOver(false);
        setSelectedPiece(null);
        setShowModal(true);
    };

    const giveUp = () => {
        setGameOver(true);
        alert(`${gameState.turn === colors.WHITE ? 'White' : 'Black'} gave up! ${gameState.turn === colors.WHITE ? 'Black' : 'White'} wins!`);
    };

    useEffect(() => {
        if (!timer.w || gameOver || showModal) {
            if (ref.current) clearInterval(ref.current);
            return;
        }
        ref.current = setInterval(() => {
            const k = gameState.turn === colors.WHITE ? 'w' : 'b';
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
        return () => { if (ref.current) clearInterval(ref.current); };
    }, [gameState.turn, timer.w, gameOver, showModal]);

    const movePiece = (from, toRow, toCol) => {
        const piece = board[from.row][from.col];

        board[toRow][toCol] = piece;
        board[from.row][from.col] = {
            type: null,
            color: null
        };
        setBoard(board);

    };
    
    const handlePieceSelect = (rowIndex, colIndex) => {
        const piece = board[rowIndex][colIndex];

        if (!selectedPiece) {
            if (!piece || piece.color !== gameState.turn) return;
            const moves = getLegalMoves(board, { row: rowIndex, col: colIndex });
            if (moves.length > 0) {
                setSelectedPiece({ row: rowIndex, col: colIndex, legalMoves: moves });
            }
            return;
        }

        if (selectedPiece.row === rowIndex && selectedPiece.col === colIndex) {
            setSelectedPiece(null);
            return;
        }

        const move = selectedPiece.legalMoves.find(
            m => m.to.row === rowIndex && m.to.col === colIndex
        );

        if (!move) {
            if (piece && piece.color === gameState.turn) {
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
        const newState = applyMove(board, move);
        setBoard(newState.board);
        setGameState(newState);
        if (isCheckmate(newState.board, newState.turn)) {
            setGameOver(true);
            alert(`Checkmate! ${newState.turn === colors.WHITE ? 'Black' : 'White'} wins!`);
        } else if (isStalemate(newState.board, newState.turn)) {
            setGameOver(true);
            alert("Stalemate! The game is a draw.");
        }
        setSelectedPiece(null);
    };



    return (
        <View style={styles.container}>
            <Modal visible={showModal} transparent>
                <View style={styles.modal}>
                    <View style={styles.modalContent}>
                        {[2, 5, 10].map(m => (
                            <TouchableOpacity key={m} style={styles.btn} onPress={() => {
                                const d = m*60;
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
            <View style={[styles.timer, gameState.turn === colors.BLACK && !gameOver && styles.activeTimer]}>
                <Text style={styles.timerText}>{timer.b ? formatTime(timer.b) : '--:--'}</Text>
            </View>
            <View style={styles.board}>
                {board.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((piece, colIndex) => (
                            <TouchableOpacity
                                onPress={() => {
                                    if (gameOver) return;
                                    setVertical(rowIndex);
                                    setHorizontal(colIndex);
                                    handlePieceSelect(rowIndex, colIndex);
                                }}
                                key={colIndex}
                                style={[
                                    styles.square,
                                    { backgroundColor: (rowIndex + colIndex) % 2 === 0 ? '#d3971dff' : '#45584aff' },
                                    selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                                        ? { borderWidth: 4, borderColor: 'yellow' }
                                        : null
                                ]}
                            >
                                {piece && <PieceIcon type={piece.type} color={piece.color} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
            <View style={[styles.timer, gameState.turn === colors.WHITE && !gameOver && styles.activeTimer]}>
                <Text style={styles.timerText}>{timer.w ? formatTime(timer.w) : '--:--'}</Text>
            </View>
            {!showModal && (
                <View style={styles.buttonRow}>
                    {!gameOver && (
                        <TouchableOpacity style={[styles.btn, styles.giveUpBtn, { marginHorizontal: 5 }]} onPress={giveUp}>
                            <Text style={styles.btnText}>Give Up</Text>
                        </TouchableOpacity>
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
        width: width * 0.6,
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
});
