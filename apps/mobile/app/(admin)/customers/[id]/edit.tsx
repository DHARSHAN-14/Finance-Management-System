import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { customerApi } from '../../../../services/api';
import { Button, Input } from '../../../../components/ui';
import { Colors, Spacing } from '../../../../constants/theme';

export default function EditCustomer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    occupation: '', monthlyIncome: '', aadhaarNo: '', panNo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    customerApi.getById(id).then(({ data }) => {
      const c = data.data;
      setForm({
        name: c.name || '', email: c.email || '', phone: c.phone || '',
        address: c.address || '', occupation: c.occupation || '',
        monthlyIncome: c.monthlyIncome?.toString() || '',
        aadhaarNo: c.aadhaarNo || '', panNo: c.panNo || '',
      });
    });
  }, [id]);

  const set = (f: string) => (v: string) => setForm((p) => ({ ...p, [f]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Valid phone required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await customerApi.update(id, {
        ...form,
        monthlyIncome: form.monthlyIncome ? parseFloat(form.monthlyIncome) : undefined,
      });
      Alert.alert('Success', 'Customer updated');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update');
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
        <Text style={styles.title}>Edit Customer</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.form}>
        <Input label="Full Name *" value={form.name} onChangeText={set('name')} error={errors.name} />
        <Input label="Phone *" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
        <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" />
        <Input label="Address" value={form.address} onChangeText={set('address')} multiline numberOfLines={2} />
        <Input label="Occupation" value={form.occupation} onChangeText={set('occupation')} />
        <Input label="Monthly Income (₹)" value={form.monthlyIncome} onChangeText={set('monthlyIncome')} keyboardType="numeric" />
        <Input label="Aadhaar No" value={form.aadhaarNo} onChangeText={set('aadhaarNo')} />
        <Input label="PAN No" value={form.panNo} onChangeText={set('panNo')} />
        <Button title={saving ? 'Saving...' : 'Update Customer'} onPress={handleSave} loading={saving} style={{ marginTop: Spacing.sm }} />
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
