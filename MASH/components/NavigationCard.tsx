import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../theme';

interface NavigationCardProps {
  destination: string;
  room: string;
  directions: string[];
  onStartNavPress: () => void;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({
  destination,
  room,
  directions,
  onStartNavPress
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Indoor Wayfinding</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🚶 2 min walk</Text>
        </View>
      </View>

      <Text style={styles.destination}>To: {destination}</Text>
      <Text style={styles.room}>Location: {room}</Text>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Directions:</Text>
      {directions.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.navButton}
        onPress={onStartNavPress}
        activeOpacity={0.8}
      >
        <Text style={styles.navButtonText}>🗺️ Open Real-time Map Wayfinding</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = Theme.createStyleSheet(() => ({
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.roundness.lg, // 24px
    padding: Theme.spacing.cardPadding, // 24px
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
    shadowColor: Theme.colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    width: '100%',
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
  },
  badge: {
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.sm,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
  },
  badgeText: {
    fontSize: Theme.typography.labelSm.fontSize,
    color: Theme.colors.secondary,
    fontFamily: Theme.typography.fontFamilyBold,
  },
  destination: {
    fontSize: Theme.typography.bodyLg.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
  },
  room: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyMedium,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.lightGray,
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.outline,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    paddingRight: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.superLightGray,
    textAlign: 'center',
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurfaceVariant,
    marginRight: 8,
    lineHeight: 22,
  },
  stepText: {
    fontSize: Theme.typography.bodyMd.fontSize,
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
  },
  navButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.full, // pill
    height: Theme.spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...Theme.shadows.level1,
  },
  navButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
  },
}));
