import { View, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function ClientHome() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, paddingTop: 56 }}>
      <Text style={Typography.h2}>Client Home</Text>
      <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>
        You are signed in.
      </Text>
    </View>
  );
}

