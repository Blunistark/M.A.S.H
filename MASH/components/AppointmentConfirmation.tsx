import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Theme } from '../theme';
import { Appointment } from '../types';

interface AppointmentConfirmationProps {
  appointment: Appointment;
  onGetDirections: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  appointment,
  onGetDirections,
  onReschedule,
  onCancel,
}) => {
  const dateObj = new Date(appointment.scheduled_time);
  const formattedDate = dateObj.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isTomorrow = true;
  const timeDisplay = isTomorrow ? `Tomorrow, ${formattedTime}` : `${formattedDate}, ${formattedTime}`;

  const doctorImageUrl = appointment.doctor_name.includes('Smith')
    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5IFHWEnpObxb75uuKR8L35XggTBHRSoEJtlAqcf5dymKb14AcajPMHzBjTk-3jJwqIfn3N3jM551a77Ci3509kCtDQi9vC3CjlmBbCBKqNKyuSb7xu_IthGbdgWV2kit9-1m8U0t63Fuq1gDg786VFqbTY0QftMN69lguUabaJ3vtF9GL79QVDbUJlhhv5-KRhOc96KrZAETY8tBYVilG4UAh7P2pcxX_AUBSvEUH6jb6BiIJjBxCKWUciYJV0TppYkodHO_XHTlU'
    : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Confirmation Header */}
      <View style={styles.header}>
        <View style={styles.checkBadge}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Confirmed!</Text>
        <Text style={styles.subtitle}>Your health is our priority. See you tomorrow.</Text>
      </View>

      {/* Appointment Details Card */}
      <View style={styles.card}>
        {/* Doctor Row */}
        <View style={styles.doctorRow}>
          <Image source={{ uri: doctorImageUrl }} style={styles.doctorImage} />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{appointment.doctor_name}</Text>
            <Text style={styles.doctorSpecialty}>{appointment.specialty}</Text>
          </View>
        </View>

        {/* Details Row List */}
        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.rowIcon}>📅</Text>
            </View>
            <View>
              <Text style={styles.rowLabel}>Date & Time</Text>
              <Text style={styles.rowValue}>{timeDisplay}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.rowIcon}>📍</Text>
            </View>
            <View>
              <Text style={styles.rowLabel}>Location</Text>
              <Text style={styles.rowValue}>
                Room {appointment.room_number || '204'}, 2nd Floor
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions Stack */}
      <View style={styles.actionsStack}>
        {/* Get Directions (Warm Amber Button) */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onGetDirections}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnIcon}>🧭</Text>
          <Text style={styles.primaryBtnText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Reschedule (Outline Gold-Amber Button) */}
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onReschedule}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineBtnIcon}>🔁</Text>
          <Text style={styles.outlineBtnText}>Reschedule</Text>
        </TouchableOpacity>

        {/* Cancel (Ghost Red Button) */}
        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.ghostBtnIcon}>✕</Text>
          <Text style={styles.ghostBtnText}>Cancel Appointment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = Theme.createStyleSheet(() => ({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 24, // Compact
    paddingBottom: 110, // safe buffer above bottom navigation
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkBadge: {
    width: 56, // Compact (56x56)
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.secondaryContainer, // Translucent pink container background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    color: Theme.colors.secondary, // Deep pink/rose check icon
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: Platform.OS === 'ios' ? 0 : -2,
  },
  title: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.displayLg.fontSize,
    lineHeight: Theme.typography.displayLg.lineHeight,
    color: Theme.colors.onSurface, // High-contrast onSurface
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily,
    fontSize: Theme.typography.bodyMd.fontSize,
    color: Theme.colors.onSurfaceVariant, // Soft pink-gray text
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: Theme.colors.surface, // Clean white card surface
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.cardPadding,
    borderWidth: 1,
    borderColor: Theme.colors.outline, // Subtle pink card border
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 24,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightGray,
  },
  doctorImage: {
    width: 64, // Shrunk/compact
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 14,
  },
  doctorName: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.headlineMd.fontSize,
    color: Theme.colors.onSurface,
  },
  doctorSpecialty: {
    fontFamily: Theme.typography.fontFamilySemiBold,
    fontSize: Theme.typography.labelSm.fontSize,
    color: Theme.colors.secondary, // Deep pink/rose accent
    marginTop: 2,
  },
  detailsList: {
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  iconContainer: {
    width: 36, // Compact
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.superLightGray, // Soft light pink background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  rowIcon: {
    fontSize: 16,
  },
  rowLabel: {
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: Theme.typography.labelSm.fontSize,
    color: Theme.colors.onSurfaceVariant,
  },
  rowValue: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.bodyLg.fontSize,
    color: Theme.colors.onSurface,
    marginTop: 1,
  },
  actionsStack: {
    gap: 12, // Tighter gap
  },
  primaryBtn: {
    height: 48, // Shrunk/compact
    borderRadius: 24,
    backgroundColor: Theme.colors.primary, // Pink primary
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
  outlineBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Theme.colors.outline, // Pink outline
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  outlineBtnText: {
    color: Theme.colors.secondary, // Soft deep pink/rose
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
  ghostBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnIcon: {
    fontSize: 14,
    color: Theme.colors.error, // Warning red
    marginRight: 6,
  },
  ghostBtnText: {
    color: Theme.colors.error,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
}));
