import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, ErrorState, LoadingScreen, SectionHeader } from '../../components/ui';
import { honestyApi } from '../../services/api';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function ClientHonesty() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const load = useCallback(async () => {
    setError('');
    try {
      const [s, sug] = await Promise.all([honestyApi.myScore(), honestyApi.mySuggestions()]);
      setScore(s.data.data);
      setSuggestions(sug.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load honesty score');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingScreen message="Loading score..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Honesty Score</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionHeader title="My Score" />
          <Text style={{ fontSize: 44, fontWeight: '900', color: Colors.primary }}>
            {score?.score ?? score?.honestyScore ?? '—'}
          </Text>
          {!!score?.category && (
            <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: 4 }]}>{score.category}</Text>
          )}
        </Card>

        <Card>
          <SectionHeader title="Suggestions" />
          {suggestions.length === 0 ? (
            <Text style={[Typography.body, { color: Colors.textSecondary }]}>No suggestions yet.</Text>
          ) : (
            suggestions.slice(0, 10).map((sug, idx) => (
              <Text key={idx} style={[Typography.body, { marginBottom: Spacing.sm }]}>
                • {String(sug?.message || sug?.title || sug)}
              </Text>
            ))
          )}
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
});

