import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, TextInput,
} from 'react-native';
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme';

// ── Button ──────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md', loading, disabled, style,
}) => {
  const bg = {
    primary: Colors.primary, secondary: Colors.gray200,
    danger: Colors.danger, ghost: 'transparent',
  }[variant];
  const color = variant === 'secondary' ? Colors.text : variant === 'ghost' ? Colors.primary : Colors.white;
  const padding = { sm: 8, md: 14, lg: 18 }[size];
  const fontSize = { sm: 13, md: 15, lg: 16 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { backgroundColor: bg, paddingVertical: padding, opacity: disabled ? 0.6 : 1 }, style]}
    >
      {loading
        ? <ActivityIndicator color={color} size="small" />
        : <Text style={{ color, fontSize, fontWeight: '600' }}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

// ── Card ──────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ── Input ──────────────────────────────────────────────
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label, placeholder, value, onChangeText, error,
  secureTextEntry, keyboardType, multiline, numberOfLines, editable = true, style,
}) => (
  <View style={[{ marginBottom: Spacing.md }, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={editable}
      style={[styles.input, error ? styles.inputError : {}, multiline ? { height: 100, textAlignVertical: 'top' } : {}]}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ── Badge ──────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, color = Colors.primary, textColor = Colors.white }) => (
  <View style={[styles.badge, { backgroundColor: color + '20' }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ── StatusBadge ──────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { color: string }> = {
    ACTIVE: { color: Colors.success },
    APPROVED: { color: Colors.info },
    PENDING: { color: Colors.warning },
    OVERDUE: { color: Colors.danger },
    CLOSED: { color: Colors.gray500 },
    REJECTED: { color: Colors.danger },
    DISBURSED: { color: Colors.primaryLight },
    COMPLETED: { color: Colors.success },
    UPCOMING: { color: Colors.accent },
    CANCELLED: { color: Colors.danger },
    PAID: { color: Colors.success },
    PARTIAL: { color: Colors.warning },
  };
  const c = config[status]?.color ?? Colors.gray500;
  return <Badge label={status} color={c} />;
};

// ── LoadingScreen ──────────────────────────────────────────────
export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={[Typography.body, { marginTop: Spacing.sm, color: Colors.textSecondary }]}>{message}</Text>
  </View>
);

// ── EmptyState ──────────────────────────────────────────────
export const EmptyState: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title, subtitle, action,
}) => (
  <View style={styles.centered}>
    <Text style={{ fontSize: 48 }}>📭</Text>
    <Text style={[Typography.h3, { marginTop: Spacing.md, textAlign: 'center' }]}>{title}</Text>
    {subtitle && <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>{subtitle}</Text>}
    {action && <View style={{ marginTop: Spacing.lg }}>{action}</View>}
  </View>
);

// ── ErrorState ──────────────────────────────────────────────
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <View style={styles.centered}>
    <Text style={{ fontSize: 48 }}>⚠️</Text>
    <Text style={[Typography.h3, { color: Colors.danger, marginTop: Spacing.md }]}>Something went wrong</Text>
    <Text style={[Typography.body, { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>{message}</Text>
    {onRetry && <Button title="Retry" onPress={onRetry} style={{ marginTop: Spacing.lg }} />}
  </View>
);

// ── StatCard ──────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = Colors.primary, icon }) => (
  <Card style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Text style={{ fontSize: 20 }}>{icon ?? '📊'}</Text>
    </View>
    <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: Spacing.sm }]}>{title}</Text>
    <Text style={[Typography.h2, { color, marginTop: 2 }]}>{value}</Text>
    {subtitle && <Text style={[Typography.caption, { marginTop: 2 }]}>{subtitle}</Text>}
  </Card>
);

// ── SectionHeader ──────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <View style={styles.sectionHeader}>
    <Text style={Typography.h4}>{title}</Text>
    {action}
  </View>
);

// ── Divider ──────────────────────────────────────────────
export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm }, style]} />
);

// ── InfoRow ──────────────────────────────────────────────
export const InfoRow: React.FC<{ label: string; value: string; valueStyle?: TextStyle }> = ({ label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  inputLabel: { ...Typography.label, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.xs },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  statCard: { flex: 1, minWidth: 140 },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { ...Typography.label },
  infoValue: { ...Typography.body, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: Spacing.md },
});
