import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, ErrorState, LoadingScreen, SectionHeader, StatCard } from '../../components/ui';
import { chitApi, honestyApi } from '../../services/api';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [myScore, setMyScore] = useState<any>(null);
  const [myChitsCount, setMyChitsCount] = useState<number>(0);

  const load = useCallback(async () => {
    setError('');
    try {
      const [scoreRes, chitsRes] = await Promise.all([
        honestyApi.myScore(),
        chitApi.myChits(),
      ]);

      setMyScore(scoreRes.data.data);
      const list = chitsRes.data.data || [];
      setMyChitsCount(Array.isArray(list) ? list.length : 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingScreen message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  const score = myScore?.score ?? myScore?.honestyScore ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subTitle}>Client</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <StatCard title="My Chits" value={myChitsCount} icon="🎯" color={Colors.accent} />
          <StatCard title="Honesty Score" value={score ?? '—'} icon="✅" color={Colors.success} />
        </View>

        <Card style={{ marginTop: Spacing.lg }}>
          <SectionHeader title="Status" />
          <Text style={[Typography.body, { color: Colors.textSecondary }]}>
            Your account may require admin approval before full access.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  subTitle: { color: Colors.white + 'CC', marginTop: 2 },
});

