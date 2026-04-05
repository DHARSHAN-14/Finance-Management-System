import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { paymentApi, customerApi } from '../../../services/api';
import { Button, Input, Card } from '../../../components/ui';
import { Colors, Spacing, Typography, Radius } from '../../../constants/theme';

const METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

export default function NewPayment() {
  const { customerId: prefill } = useLocalSearchParams<{ customerId?: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [form, setForm] = useState({
    customerId: prefill || '',
    amount: '',
    method: 'CASH',
    referenceNo: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    customerApi.list({ limit: 100, isActive: 'true' })
      .then(({ data }) => setCustomers(data.data));
    if (prefill) {
      customerApi.getById(prefill).then(({ data }) => setSelectedCustomer(data.data));
    }
  }, []);

  const set = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = 'Select a customer';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await paymentApi.record({
        customerId: form.customerId,
        amount: parseFloat(form.amount),
        method: form.method,
        referenceNo: form.referenceNo || undefined,
        notes: form.notes || undefined,
      });
      Alert.alert('Success', 'Payment recorded and auto-allocated to pending installments');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to record payment');
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
        <Text style={styles.title}>Record Payment</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        {/* Customer */}
        <Text style={styles.label}>Customer *</Text>
        {selectedCustomer ? (
          <TouchableOpacity
            style={styles.customerSelected}
            onPress={() => { setSelectedCustomer(null); set('customerId')(''); }}
          >
            <View style={{ flex: 1 }}>
              <Text style={Typography.h4}>{selectedCustomer.name}</Text>
              <Text style={Typography.bodySmall}>{selectedCustomer.phone}</Text>
            </View>
            <Text style={{ color: Colors.danger }}>✕</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView style={styles.customerList} nestedScrollEnabled>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.customerItem}
                onPress={() => { setSelectedCustomer(c); set('customerId')(c.id); }}
              >
                <Text style={Typography.body}>{c.name}</Text>
                <Text style={[Typography.bodySmall, { color: Colors.textSecondary }]}>{c.phone}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {errors.customerId && <Text style={styles.errorText}>{errors.customerId}</Text>}

        <Input label="Amount (₹) *" placeholder="8884" value={form.amount} onChangeText={set('amount')} keyboardType="numeric" error={errors.amount} />

        {/* Payment Method */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodGrid}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => set('method')(m)}
              style={[styles.methodBtn, form.method === m && styles.methodBtnActive]}
            >
              <Text style={{ fontSize: 18 }}>
                {m === 'CASH' ? '💵' : m === 'UPI' ? '📱' : m === 'BANK_TRANSFER' ? '🏦' : '📝'}
              </Text>
              <Text style={[styles.methodLabel, form.method === m && { color: Colors.primary }]}>{m.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.method !== 'CASH' && (
          <Input label="Reference No" placeholder="UPI/NEFT/Cheque reference" value={form.referenceNo} onChangeText={set('referenceNo')} />
        )}

        <Input label="Notes" placeholder="Optional notes" value={form.notes} onChangeText={set('notes')} multiline numberOfLines={2} />

        <Card style={styles.infoCard}>
          <Text style={[Typography.bodySmall, { color: Colors.info }]}>
            💡 Payment will be auto-allocated to the earliest pending/overdue installments.
          </Text>
        </Card>

        <Button title={saving ? 'Recording...' : 'Record Payment'} onPress={handleSave} loading={saving} />
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
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: Spacing.xs },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 4 },
  customerList: { maxHeight: 200, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, marginBottom: Spacing.md },
  customerItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  customerSelected: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: Colors.primary, borderRadius: 10, padding: Spacing.md, marginBottom: Spacing.md,
  },
  methodGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  methodBtn: {
    flex: 1, minWidth: '22%', alignItems: 'center', padding: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, gap: 4,
  },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  methodLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  infoCard: { marginBottom: Spacing.md, backgroundColor: Colors.info + '10' },
});
