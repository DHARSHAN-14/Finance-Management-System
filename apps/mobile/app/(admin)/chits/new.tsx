import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { chitApi } from '../../../services/api';
import { Button, Input } from '../../../components/ui';
import { Colors, Spacing } from '../../../constants/theme';

export default function NewChit() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', totalValue: '', monthlyContribution: '',
    duration: '', commissionPct: '5', description: '', startDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (f: string) => (v: string) => setForm((p) => ({ ...p, [f]: v }));

  // Auto-calculate total value when monthly + duration changes
  const calcTotal = () => {
    const m = parseFloat(form.monthlyContribution);
    const d = parseInt(form.duration);
    if (m && d) setForm((p) => ({ ...p, totalValue: (m * d).toString() }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.monthlyContribution || parseFloat(form.monthlyContribution) <= 0) e.monthlyContribution = 'Enter amount';
    if (!form.duration || parseInt(form.duration) < 2) e.duration = 'Min 2 months';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const monthly = parseFloat(form.monthlyContribution);
      const dur = parseInt(form.duration);
      await chitApi.create({
        name: form.name,
        totalValue: parseFloat(form.totalValue) || monthly * dur,
        monthlyContribution: monthly,
        duration: dur,
        commissionPct: parseFloat(form.commissionPct) || 5,
        description: form.description || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      });
      Alert.alert('Success', 'Chit fund created successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create chit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.white, fontSize: 16 }}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Chit Fund</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        <Input label="Chit Name *" placeholder="Gold Chit 2024 - 1L" value={form.name} onChangeText={set('name')} error={errors.name} />
        <Input label="Monthly Contribution (₹) *" placeholder="10000" value={form.monthlyContribution} onChangeText={set('monthlyContribution')} keyboardType="numeric" error={errors.monthlyContribution} />
        <Input label="Duration (months) *" placeholder="10" value={form.duration} onChangeText={(v) => { set('duration')(v); }} keyboardType="numeric" error={errors.duration} />
        <Input label="Total Value (₹)" placeholder="Auto-calculated" value={form.totalValue} onChangeText={set('totalValue')} keyboardType="numeric" />
        <Input label="Commission (%)" placeholder="5" value={form.commissionPct} onChangeText={set('commissionPct')} keyboardType="numeric" />
        <Input label="Description" placeholder="Optional description" value={form.description} onChangeText={set('description')} multiline numberOfLines={2} />
        <Input label="Start Date (YYYY-MM-DD)" placeholder="2024-01-01" value={form.startDate} onChangeText={set('startDate')} />

        <Button
          title={saving ? 'Creating...' : 'Create Chit Fund'}
          onPress={handleCreate}
          loading={saving}
          style={{ marginTop: Spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, paddingTop: 56, backgroundColor: Colors.primary,
  },
  title: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  form: { padding: Spacing.lg },
});
