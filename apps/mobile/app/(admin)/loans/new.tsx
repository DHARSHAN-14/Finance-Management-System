import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { loanApi, customerApi } from '../../../services/api';
import { Button, Input, Card } from '../../../components/ui';
import { Colors, Spacing, Typography, Shadow, Radius } from '../../../constants/theme';
import { LiveClock } from '../../../components/LiveClock';

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
    } catch { }
    finally { setPreviewLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(loadPreview, 600);
    return () => clearTimeout(timer);
  }, [form.principalAmount, form.interestRate, form.tenure]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = 'Select a customer';
    if (!form.principalAmount || parseFloat(form.principalAmount) <= 0) e.principalAmount = 'Enter a valid amount';
    if (!form.interestRate || parseFloat(form.interestRate) <= 0) e.interestRate = 'Enter a valid rate';
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Loan</Text>
        <LiveClock variant="compact" />
      </View>

      <View style={styles.form}>
        {/* Customer Selection */}
        <Text style={styles.sectionLabel}>SELECT CUSTOMER</Text>
        {selectedCustomer ? (
          <TouchableOpacity
            style={styles.customerChip}
            onPress={() => { setSelectedCustomer(null); set('customerId')(''); }}
            activeOpacity={0.8}
          >
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{(selectedCustomer.name ?? 'U')[0]}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.customerName}>{selectedCustomer.name}</Text>
              <Text style={styles.customerPhone}>{selectedCustomer.phone}</Text>
            </View>
            <View style={styles.removeChip}>
              <Text style={{ color: Colors.danger, fontWeight: '700', fontSize: 12 }}>Change</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.customerList}>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.customerItem}
                onPress={() => { setSelectedCustomer(c); set('customerId')(c.id); }}
                activeOpacity={0.7}
              >
                <View style={[styles.customerAvatar, { width: 38, height: 38, borderRadius: 11 }]}>
                  <Text style={[styles.customerAvatarText, { fontSize: 14 }]}>{(c.name ?? 'U')[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{c.name}</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 1 }}>{c.phone}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {customers.length === 0 && (
              <Text style={{ padding: 14, textAlign: 'center', color: Colors.textMuted }}>No active customers found</Text>
            )}
          </View>
        )}
        {errors.customerId && <Text style={styles.errorText}>{errors.customerId}</Text>}

        {/* Loan Parameters */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>LOAN DETAILS</Text>

        <View style={styles.inputRow}>
          <View style={{ flex: 2 }}>
            <Input label="Principal Amount (₹) *" placeholder="100000" value={form.principalAmount} onChangeText={set('principalAmount')} keyboardType="numeric" error={errors.principalAmount} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Input label="Rate (%) *" placeholder="12" value={form.interestRate} onChangeText={set('interestRate')} keyboardType="numeric" error={errors.interestRate} />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Input label="Tenure (months) *" placeholder="12" value={form.tenure} onChangeText={set('tenure')} keyboardType="numeric" error={errors.tenure} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Input label="Processing Fee (₹)" placeholder="1000" value={form.processingFee} onChangeText={set('processingFee')} keyboardType="numeric" />
          </View>
        </View>

        <Input label="Purpose" placeholder="Business expansion, Home renovation..." value={form.purpose} onChangeText={set('purpose')} multiline numberOfLines={2} />

        {/* EMI Preview Card */}
        {preview && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>EMI Preview</Text>
            <View style={styles.previewGrid}>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Monthly EMI</Text>
                <Text style={[styles.previewValue, { color: Colors.primary, fontSize: 22 }]}>{fmt(preview.emi)}</Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Total Payable</Text>
                <Text style={styles.previewValue}>{fmt(preview.totalPayable)}</Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Total Interest</Text>
                <Text style={[styles.previewValue, { color: Colors.danger }]}>{fmt(preview.totalInterest)}</Text>
              </View>
            </View>
          </View>
        )}

        <Button
          title={saving ? 'Creating...' : 'Create Loan Application'}
          onPress={handleCreate}
          loading={saving}
          style={styles.submitBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: 56, paddingBottom: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.white + '18', borderRadius: 10 },
  backText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  headerTitle: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  form: { padding: Spacing.lg, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1, marginBottom: 12,
  },

  // Customer selection
  customerChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    borderWidth: 2, borderColor: Colors.primary + '30',
    ...Shadow.sm,
  },
  customerAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  customerAvatarText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  customerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  customerPhone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  removeChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: Colors.danger + '12', borderRadius: 8,
  },
  customerList: {
    maxHeight: 220, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.white,
  },
  customerItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray50,
  },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 6, fontWeight: '500' },

  inputRow: { flexDirection: 'row' },

  // EMI Preview
  previewCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 18, padding: 18, marginBottom: 10,
    borderWidth: 1.5, borderColor: Colors.primary + '20',
  },
  previewTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 14, letterSpacing: 0.3 },
  previewGrid: { flexDirection: 'row', gap: 8 },
  previewItem: { flex: 1, alignItems: 'center' },
  previewLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  previewValue: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },

  submitBtn: { marginTop: 10, borderRadius: 14, height: 54 },
});
