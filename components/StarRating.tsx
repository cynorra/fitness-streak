import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  value: number; // 0-5, may be fractional for display
  size?: number;
  onChange?: (rating: number) => void; // when provided the stars are tappable
};

export default function StarRating({ value, size = 18, onChange }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n - 0.25; // 4.8 still shows 5 filled stars
        const star = (
          <Text style={{ fontSize: size, color: filled ? '#fbbf24' : '#3f3f46' }}>{filled ? '★' : '☆'}</Text>
        );
        return onChange ? (
          <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            {star}
          </TouchableOpacity>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, alignItems: 'center' },
});
