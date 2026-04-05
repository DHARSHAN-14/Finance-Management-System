import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { loanApi } from '../../../services/api';
import { customerApi } from '../../../services/api';
import { Button, Input, Card } from '../../../components/ui';
import { Colors, Spacing, Typography } from '../../../constants/theme';

function fmt(n: number) { return '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

export default function NewLoan() {
  const { customerId: prefillCustomer } = useLocalSearchParams<{ customerId?: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const [form, setForm] = useState({
    customerId: prefillCustomer || '',
    principalAmount: '',
    interestRate: '12',
    tenure: '12',
    processingFee: '0',
    purpose: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    customerApi.list({ limit: 100, isActive: 'true' })
      .then(({ data }) => setCustomers(data.data));
    if (prefillCustomer) {
      customerApi.getById(prefillCustomer).then(({ data }) => setSelectedCustomer(data.data));
    }
  }, []);

  const set = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const loadPreview = async () => {
    const p = parseFloat(form.principalAmount);
    const r = parseFloat(form.interestRate);
    const t = parseInt(form.tenure);
    if (!p || !r || !t) return;
    setPreviewLoading(true);
    try {
      const { data } = await loanApi.emiPreview(p, r, t);
      setPreview(data.data);
    } catch {}
    finally { setPreviewLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(loadPreview, 600);
    return () => clearTimeout(timer);
  }, [form.principalAmount, form.interestRate, form.tenure]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = 'Select a customer';
    if (!form.principalAmount || parseFloat(form.principalAmount) <= 0) e.principalAmount = 'Enter valid amount';
    if (!form.interestRate || parseFloat(form.interestRate) <= 0) e.interestRate = 'Enter valid rate';
    if (!form.tenure || parseInt(form.tenure) <= 0) e.tenure = 'Enter valid tenure';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await loanApi.create({
        customerId: form.customerId,
        principalAmount: parseFloat(form.principalAmount),
        interestRate: parseFloat(form.interestRate),
        tenure: parseInt(form.tenure),
        processingFee: parseFloat(form.processingFee) || 0,
        purpose: form.purpose,
      });
      Alert.alert('Success', 'Loan application created successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create loan');
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
        <Text style={styles.title}>New Loan</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        {/* Customer Picker */}
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

        <Input label="Principal Amount (₹) *" placeholder="100000" value={form.principalAmount} onChangeText={set('principalAmount')} keyboardType="numeric" error={errors.principalAmount} />
        <Input label="Interest Rate (% p.a.) *" placeholder="12" value={form.interestRate} onChangeText={set('interestRate')} keyboardType="numeric" error={errors.interestRate} />
        <Input label="Tenure (months) *" placeholder="12" value={form.tenure} onChangeText={set('tenure')} keyboardType="numeric" error={errors.tenure} />
        <Input label="Processing Fee (₹)" placeholder="1000" value={form.processingFee} onChangeText={set('processingFee')} keyboardType="numeric" />
        <Input label="Purpose" placeholder="Business expansion, Home renovation..." value={form.purpose} onChangeText={set('purpose')} multiline numberOfLines={2} />

        {/* EMI Preview */}
        {preview && (
          <Card style={styles.preview}>
            <Text style={[Typography.h4, { color: Colors.primary, marginBottom: Spacing.sm }]}>EMI Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Monthly EMI</Text>
              <Text style={[styles.previewValue, { color: Colors.primary, fontSize: 22 }]}>{fmt(preview.emi)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Payable</Text>
              <Text style={styles.previewValue}>{fmt(preview.totalPayable)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Interest</Text>
              <Text style={[styles.previewValue, { color: Colors.danger }]}>{fmt(preview.totalInterest)}</Text>
            </View>
          </Card>
        )}

        <Button title={saving ? 'Creating...' : 'Create Loan Application'} onPress={handleCreate} loading={saving} style={{ marginTop: Spacing.sm }} />
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
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  preview: { marginBottom: Spacing.md, backgroundColor: Colors.primary + '08', borderWidth: 1, borderColor: Colors.primary + '30' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  previewLabel: { color: Colors.textSecondary, fontSize: 14 },
  previewValue: { fontWeight: '700', fontSize: 16, color: Colors.text },
});
