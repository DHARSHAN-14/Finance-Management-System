import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';

interface DatePickerInputProps {
    label?: string;
    value: Date | null;
    onChange: (date: Date) => void;
    placeholder?: string;
    error?: string;
    mode?: 'date' | 'time' | 'datetime';
    minimumDate?: Date;
    maximumDate?: Date;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
    label, value, onChange, placeholder = 'Select date', error, mode = 'date',
    minimumDate, maximumDate,
}) => {
    const [show, setShow] = useState(false);

    const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        setShow(Platform.OS === 'ios');
        if (selectedDate) onChange(selectedDate);
    };

    const formatDisplay = (date: Date | null) => {
        if (!date) return placeholder;
        if (mode === 'time') {
            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        if (mode === 'datetime') {
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
                ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                style={[styles.inputBtn, error ? styles.inputError : {}]}
                onPress={() => setShow(true)}
                activeOpacity={0.7}
            >
                <View style={styles.calendarIcon}>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                </View>
                <Text style={[styles.inputText, !value && styles.placeholderText]}>
                    {formatDisplay(value)}
                </Text>
                <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {show && (
                <DateTimePicker
                    value={value || new Date()}
                    mode={mode === 'datetime' ? 'date' : mode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: Spacing.md },
    label: {
        fontSize: 13, fontWeight: '500', color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    inputBtn: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: Colors.border,
        borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14,
        backgroundColor: Colors.white,
    },
    inputError: { borderColor: Colors.danger },
    calendarIcon: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: Colors.primary + '12',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    inputText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
    placeholderText: { color: Colors.textMuted },
    chevron: { fontSize: 10, color: Colors.textMuted, marginLeft: 8 },
    errorText: { fontSize: 12, color: Colors.danger, marginTop: 4, fontWeight: '500' },
});
