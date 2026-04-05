import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const router = useRouter();

    const handleRegister = () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        Alert.alert('Success', 'Registered successfully! Please wait for admin approval before logging in.');
        router.replace('/(auth)/login');
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
                        onChangeText={setName}
                    />

                    <Input
                        label="Email Address"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />

                    <View>
                        <Input
                            label="Password"
                            placeholder="Create a password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPass}
                        />
                        <TouchableOpacity style={styles.showPassBtn} onPress={() => setShowPass(!showPass)}>
                            <Text style={{ color: Colors.primary, fontSize: 13 }}>{showPass ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>

                    <Button title="Sign Up" onPress={handleRegister} style={{ marginTop: Spacing.sm }} />

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
