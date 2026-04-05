import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loanApi } from '../../../../services/api';
import { Button, Input, Card } from '../../../../components/ui';
import { Colors, Spacing, Typography } from '../../../../constants/theme';

export default function DisburseLoan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ disbursedAmount: '', startDate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (f: string) => (v: string) => setForm((p) => ({ ...p, [f]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.disbursedAmount || parseFloat(form.disbursedAmount) <= 0) e.disbursedAmount = 'Enter disbursed amount';
    if (!form.startDate) e.startDate = 'Enter start date (YYYY-MM-DD)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDisburse = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await loanApi.disburse(id, {
        disbursedAmount: parseFloat(form.disbursedAmount),
        startDate: new Date(form.startDate).toISOString(),
      });
      Alert.alert('Success', 'Loan disbursed and EMI schedule generated');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to disburse');
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
        <Text style={styles.title}>Disburse Loan</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        <Card style={{ marginBottom: Spacing.lg, backgroundColor: Colors.info + '10' }}>
          <Text style={[Typography.bodySmall, { color: Colors.info }]}>
            💡 Disbursing will generate the full EMI schedule and activate the loan. This cannot be undone.
          </Text>
        </Card>

        <Input
          label="Disbursed Amount (₹) *"
          placeholder="98000"
          value={form.disbursedAmount}
          onChangeText={set('disbursedAmount')}
          keyboardType="numeric"
          error={errors.disbursedAmount}
        />
        <Input
          label="Start Date *"
          placeholder="2024-01-01"
          value={form.startDate}
          onChangeText={set('startDate')}
          error={errors.startDate}
        />

        <Button
          title={saving ? 'Disbursing...' : 'Confirm Disbursal'}
          onPress={handleDisburse}
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
