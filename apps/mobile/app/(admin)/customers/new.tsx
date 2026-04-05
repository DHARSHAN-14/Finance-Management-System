import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { customerApi } from '../../../services/api';
import { Button, Input } from '../../../components/ui';
import { Colors, Spacing, Typography } from '../../../constants/theme';

export default function CustomerForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    occupation: '', monthlyIncome: '', aadhaarNo: '', panNo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      customerApi.getById(id)
        .then(({ data }) => {
          const c = data.data;
          setForm({
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            occupation: c.occupation || '',
            monthlyIncome: c.monthlyIncome?.toString() || '',
            aadhaarNo: c.aadhaarNo || '',
            panNo: c.panNo || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = (field: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (form.phone.length < 10) e.phone = 'Enter valid phone number';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        monthlyIncome: form.monthlyIncome ? parseFloat(form.monthlyIncome) : undefined,
      };
      if (isEdit) {
        await customerApi.update(id, payload);
        Alert.alert('Success', 'Customer updated');
      } else {
        await customerApi.create(payload);
        Alert.alert('Success', 'Customer created');
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save customer');
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
        <Text style={styles.title}>{isEdit ? 'Edit Customer' : 'New Customer'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        <Input label="Full Name *" placeholder="Rajan Kumar" value={form.name} onChangeText={set('name')} error={errors.name} />
        <Input label="Phone *" placeholder="9876543210" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
        <Input label="Email" placeholder="rajan@example.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" error={errors.email} />
        <Input label="Address" placeholder="12, Gandhi Street, City" value={form.address} onChangeText={set('address')} multiline numberOfLines={2} />
        <Input label="Occupation" placeholder="Businessman" value={form.occupation} onChangeText={set('occupation')} />
        <Input label="Monthly Income (₹)" placeholder="50000" value={form.monthlyIncome} onChangeText={set('monthlyIncome')} keyboardType="numeric" />
        <Input label="Aadhaar No" placeholder="1234-5678-9012" value={form.aadhaarNo} onChangeText={set('aadhaarNo')} />
        <Input label="PAN No" placeholder="ABCDE1234F" value={form.panNo} onChangeText={set('panNo')} />

        <Button title={saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'} onPress={handleSave} loading={saving} style={{ marginTop: Spacing.sm }} />
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
