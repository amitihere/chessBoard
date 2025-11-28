import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import ChessBoard from './src/ChessBoard';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  return (
    <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.container}
    >
        <ChessBoard />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
