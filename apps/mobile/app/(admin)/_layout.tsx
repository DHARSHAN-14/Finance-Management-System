import { Tabs } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Text style={[styles.iconText, focused && { color: Colors.primary }]}>{label}</Text>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="H" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          href: '/(admin)/customers',
          tabBarIcon: ({ focused }) => <TabIcon label="C" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans',
          href: '/(admin)/loans',
          tabBarIcon: ({ focused }) => <TabIcon label="L" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chits"
        options={{
          title: 'Chits',
          href: '/(admin)/chits',
          tabBarIcon: ({ focused }) => <TabIcon label="F" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          href: '/(admin)/payments/new',
          tabBarIcon: ({ focused }) => <TabIcon label="P" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="U" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconActive: {
    backgroundColor: Colors.primary + '15',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray500,
  },
});
