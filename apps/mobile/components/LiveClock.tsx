import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';

interface LiveClockProps {
    variant?: 'compact' | 'full' | 'hero';
    textColor?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({ variant = 'full', textColor }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
    });

    const dateStr = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

    const shortDateStr = now.toLocaleDateString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short',
    });

    if (variant === 'compact') {
        return (
            <View style={styles.compactContainer}>
                <Text style={[styles.compactTime, textColor ? { color: textColor } : {}]}>{timeStr}</Text>
                <Text style={[styles.compactDate, textColor ? { color: textColor + 'AA' } : {}]}>{shortDateStr}</Text>
            </View>
        );
    }

    if (variant === 'hero') {
        const hours = now.getHours();
        const greeting = hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : 'Good Evening';
        const emoji = hours < 12 ? '🌅' : hours < 17 ? '☀️' : '🌙';

        return (
            <View style={styles.heroContainer}>
                <Text style={[styles.heroGreeting, textColor ? { color: textColor } : {}]}>{greeting} {emoji}</Text>
                <Text style={[styles.heroTime, textColor ? { color: textColor } : {}]}>{timeStr.toUpperCase()}</Text>
                <Text style={[styles.heroDate, textColor ? { color: textColor + 'BB' } : {}]}>{dateStr}</Text>
            </View>
        );
    }

    // Full variant
    return (
        <View style={styles.fullContainer}>
            <View style={styles.fullTimeRow}>
                <View style={styles.clockDot} />
                <Text style={styles.fullTime}>{timeStr.toUpperCase()}</Text>
            </View>
            <Text style={styles.fullDate}>{dateStr}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    // Compact
    compactContainer: { alignItems: 'flex-end' },
    compactTime: { fontSize: 13, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
    compactDate: { fontSize: 10, color: Colors.white + 'AA', marginTop: 1 },

    // Hero
    heroContainer: { marginBottom: 4 },
    heroGreeting: { fontSize: 14, color: Colors.white + 'CC', fontWeight: '500' },
    heroTime: { fontSize: 26, fontWeight: '800', color: Colors.white, marginTop: 2, letterSpacing: 1 },
    heroDate: { fontSize: 12, color: Colors.white + 'BB', marginTop: 2 },

    // Full
    fullContainer: {
        backgroundColor: Colors.white + '12',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    fullTimeRow: { flexDirection: 'row', alignItems: 'center' },
    clockDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#4ADE80', marginRight: 8,
    },
    fullTime: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
    fullDate: { fontSize: 11, color: Colors.white + 'AA', marginTop: 3, marginLeft: 16 },
});
