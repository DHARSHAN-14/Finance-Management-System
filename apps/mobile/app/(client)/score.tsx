import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { honestyApi } from '../../services/api';
import { Card, LoadingScreen, ErrorState } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function HonestyScoreScreen() {
  const [data, setData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [s, sugg] = await Promise.all([honestyApi.myScore(), honestyApi.mySuggestions()]);
      setData(s.data.data);
      setSuggestions(sugg.data.data.suggestions);
    } catch { setError('Failed to load score'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const score = data?.score ?? 0;
  const color = score >= 80 ? Colors.success : score >= 60 ? Colors.info : score >= 40 ? Colors.warning : Colors.danger;
  const emoji = score >= 80 ? '🏆' : score >= 60 ? '✅' : score >= 40 ? '⚠️' : '🚨';
  const pct = score;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={[styles.header, { backgroundColor: color }]}>
        <Text style={{ fontSize: 56 }}>{emoji}</Text>
        <Text style={styles.scoreNum}>{score}</Text>
        <Text style={styles.category}>{data?.category}</Text>
        <Text style={{ color: Colors.white + 'CC', fontSize: 13, marginTop: 4 }}>out of 100</Text>
      </View>

      {/* Score Gauge */}
      <Card style={styles.section}>
        <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>Score Breakdown</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.ranges}>
          {[
            { label: 'High Risk', range: '0–39', c: Colors.danger },
            { label: 'Medium', range: '40–59', c: Colors.warning },
            { label: 'Trustworthy', range: '60–79', c: Colors.info },
            { label: 'Highly Trustworthy', range: '80–100', c: Colors.success },
          ].map((r) => (
            <View key={r.label} style={{ alignItems: 'center' }}>
              <View style={[styles.dot, { backgroundColor: r.c }]} />
              <Text style={{ fontSize: 9, color: Colors.textMuted, textAlign: 'center', width: 60 }}>{r.range}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Stats */}
      <Card style={styles.section}>
        <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>Payment History</Text>
        {[
          { label: 'On-Time Payments', value: data?.onTimePayments, icon: '✅', color: Colors.success },
          { label: 'Late Payments', value: data?.latePayments, icon: '⏰', color: Colors.warning },
          { label: 'Missed Payments', value: data?.missedPayments, icon: '❌', color: Colors.danger },
          { label: 'Total Installments', value: data?.totalInstallments, icon: '📋', color: Colors.primary },
        ].map((stat) => (
          <View key={stat.label} style={styles.statRow}>
            <Text style={{ fontSize: 18 }}>{stat.icon}</Text>
            <Text style={[Typography.body, { flex: 1, marginLeft: Spacing.sm }]}>{stat.label}</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: stat.color }}>{stat.value ?? 0}</Text>
          </View>
        ))}
        {data?.bonus > 0 && (
          <View style={styles.statRow}>
            <Text style={{ fontSize: 18 }}>🌟</Text>
            <Text style={[Typography.body, { flex: 1, marginLeft: Spacing.sm }]}>Bonus Points</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: Colors.success }}>+{data.bonus}</Text>
          </View>
        )}
      </Card>

      {/* Formula */}
      <Card style={styles.section}>
        <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>How It's Calculated</Text>
        <View style={{ backgroundColor: Colors.gray50, borderRadius: 10, padding: Spacing.md }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 13, color: Colors.text, lineHeight: 22 }}>
            Score = 100{'\n'}
            + (On-Time × 2){'\n'}
            − (Late × 7){'\n'}
            − (Missed × 20){'\n'}
            + Bonus{'\n'}
            Clamped to 0–100
          </Text>
        </View>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card style={[styles.section, { marginBottom: Spacing.xl }]}>
          <Text style={[Typography.h4, { marginBottom: Spacing.sm }]}>💡 Suggestions</Text>
          {suggestions.map((s, i) => (
            <View key={i} style={styles.suggestion}>
              <Text style={{ color: Colors.primary, fontWeight: '700', marginRight: 8 }}>{i + 1}.</Text>
              <Text style={[Typography.body, { flex: 1, color: Colors.text }]}>{s}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xl },
  scoreNum: { color: Colors.white, fontSize: 72, fontWeight: '900', lineHeight: 80 },
  category: { color: Colors.white, fontSize: 20, fontWeight: '700', marginTop: 4 },
  section: { margin: Spacing.md, marginTop: 0 },
  progressBg: { height: 14, backgroundColor: Colors.gray200, borderRadius: 7 },
  progressFill: { height: 14, borderRadius: 7 },
  ranges: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  statRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  suggestion: { flexDirection: 'row', paddingVertical: Spacing.xs, alignItems: 'flex-start' },
});
