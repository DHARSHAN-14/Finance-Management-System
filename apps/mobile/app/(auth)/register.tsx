import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { authApi } from '../../services/api';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string }>({});
    const router = useRouter();

    const handleRegister = async () => {
        const e: { name?: string; email?: string; phone?: string; password?: string } = {};
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone.replace(/\s/g, '');

        if (!normalizedName) e.name = 'Name is required';
        else if (normalizedName.length < 2) e.name = 'Enter a valid name';

        if (!normalizedEmail) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) e.email = 'Enter a valid email';

        if (!normalizedPhone) e.phone = 'Phone number is required';
        else if (!/^\d{10,15}$/.test(normalizedPhone)) e.phone = 'Enter a valid phone number';

        if (!password) e.password = 'Password is required';
        else if (password.length < 6) e.password = 'Minimum 6 characters';

        setFieldErrors(e);
        if (Object.keys(e).length > 0) return;

        try {
            setSubmitting(true);
            await authApi.register({
                name: normalizedName,
                email: normalizedEmail,
                phone: normalizedPhone,
                password,
            });

            Alert.alert('Success', 'Registered successfully! Please wait for admin approval before logging in.');
            router.replace('/(auth)/login');
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'Registration failed';
            Alert.alert('Registration failed', message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.appName}>SK Associates</Text>
                </View>

                <View style={styles.form}>
                    <Text style={Typography.h2}>Create Account</Text>
                    <Text style={[Typography.body, { color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl }]}>
                        Sign up for a new account
                    </Text>

                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        value={name}
                        onChangeText={(v) => { setName(v); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined })); }}
                        error={fieldErrors.name}
                    />

                    <Input
                        label="Email Address"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={(v) => { setEmail(v); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })); }}
                        keyboardType="email-address"
                        error={fieldErrors.email}
                    />

                    <Input
                        label="Phone Number"
                        placeholder="9876543210"
                        value={phone}
                        onChangeText={(v) => { setPhone(v); if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined })); }}
                        keyboardType="phone-pad"
                        error={fieldErrors.phone}
                    />

                    <View>
                        <Input
                            label="Password"
                            placeholder="Create a password"
                            value={password}
                            onChangeText={(v) => { setPassword(v); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined })); }}
                            secureTextEntry={!showPass}
                            error={fieldErrors.password}
                        />
                        <TouchableOpacity style={styles.showPassBtn} onPress={() => setShowPass(!showPass)}>
                            <Text style={{ color: Colors.primary, fontSize: 13 }}>{showPass ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>

                    <Button title="Sign Up" onPress={handleRegister} loading={submitting} disabled={submitting} style={{ marginTop: Spacing.sm }} />

                    <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
                        <Text style={{ color: Colors.textSecondary }}>Already have an account? <Text style={{ color: Colors.primary, fontWeight: '500' }}>Sign In</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: Colors.background, padding: Spacing.lg },
    header: { alignItems: 'center', marginTop: 40, marginBottom: Spacing.xl },
    appName: { fontSize: 24, fontWeight: '700', color: Colors.primary },
    form: {
        backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.lg,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    showPassBtn: { position: 'absolute', right: 0, top: 0, padding: 4 },
    loginBtn: { alignItems: 'center', marginTop: Spacing.lg, padding: Spacing.sm },
});
