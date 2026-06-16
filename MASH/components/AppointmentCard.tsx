import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../theme';
import { Appointment } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onNavigatePress?: (room: string) => void;
  onCancelPress?: (id: string) => void;
  isConfirmedView?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onNavigatePress,
  onCancelPress,
  isConfirmedView = false
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

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusIndicator} />
        <Text style={styles.title}>
          {isConfirmedView ? '📅 Appointment Scheduled' : '🗓️ Upcoming Visit'}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.docName}>{appointment.doctor_name}</Text>
        <Text style={styles.specialty}>{appointment.specialty}</Text>

        <View style={styles.timeSection}>
          <Text style={styles.dateTimeText}>📆 {formattedDate}</Text>
          <Text style={styles.dateTimeText}>⏰ {formattedTime}</Text>
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationText}>📍 Room: {appointment.room_number || 'Room 302'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {onNavigatePress && (
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            onPress={() => onNavigatePress(appointment.room_number || 'Room 302')}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryBtnText}>🗺️ Navigate to Clinic</Text>
          </TouchableOpacity>
        )}

        {onCancelPress && (
          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            onPress={() => onCancelPress(appointment.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightGray,
    paddingBottom: 10,
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.success, // teal green
    marginRight: 8,
  },
  title: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    marginBottom: 16,
  },
  docName: {
    fontSize: Theme.typography.bodyLg.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
  },
  specialty: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilySemiBold,
    color: Theme.colors.secondary, // Teal
    marginTop: 2,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.superLightGray,
    padding: 12,
    borderRadius: Theme.roundness.md, // 12px
    marginTop: 12,
  },
  dateTimeText: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyMedium,
    color: Theme.colors.onSurfaceVariant,
  },
  locationSection: {
    marginTop: 12,
  },
  locationText: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilySemiBold,
    color: Theme.colors.onSurfaceVariant,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    height: Theme.spacing.buttonHeight,
    borderRadius: Theme.roundness.full, // pill shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primary, // Luminous blue
    marginRight: 6,
    ...Theme.shadows.level1,
  },
  primaryBtnText: {
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
  secondaryBtn: {
    backgroundColor: Theme.colors.lightGray,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
    flex: 0.4,
  },
  secondaryBtnText: {
    color: Theme.colors.onSurfaceVariant,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
});
