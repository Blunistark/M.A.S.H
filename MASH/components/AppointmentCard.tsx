import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Theme } from '../theme';
import { Appointment } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onNavigatePress?: (room: string) => void;
  onCancelPress?: (id: string) => void;
  isConfirmedView?: boolean;
  onViewDetails?: () => void; // Callback to trigger Confirmed screen navigation
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onNavigatePress,
  onCancelPress,
  isConfirmedView = false,
  onViewDetails
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

  const isDrSmith = appointment.doctor_name.includes('Smith');
  const doctorImageUrl = isDrSmith
    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5IFHWEnpObxb75uuKR8L35XggTBHRSoEJtlAqcf5dymKb14AcajPMHzBjTk-3jJwqIfn3N3jM551a77Ci3509kCtDQi9vC3CjlmBbCBKqNKyuSb7xu_IthGbdgWV2kit9-1m8U0t63Fuq1gDg786VFqbTY0QftMN69lguUabaJ3vtF9GL79QVDbUJlhhv5-KRhOc96KrZAETY8tBYVilG4UAh7P2pcxX_AUBSvEUH6jb6BiIJjBxCKWUciYJV0TppYkodHO_XHTlU'
    : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150';

  // Render the chat preview version if onViewDetails callback is provided
  if (onViewDetails) {
    return (
      <View style={styles.previewCard}>
        <View style={styles.doctorHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🩺</Text>
          </View>
          <View>
            <Text style={styles.docName}>{appointment.doctor_name}</Text>
            <Text style={styles.specialty}>{appointment.specialty}</Text>
          </View>
        </View>

        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <View style={styles.smallIconCircle}>
              <Text style={styles.smallIcon}>📅</Text>
            </View>
            <Text style={styles.detailText}>Tomorrow, 10:00 AM</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.smallIconCircle}>
              <Text style={styles.smallIcon}>📍</Text>
            </View>
            <Text style={styles.detailText}>
              Room {appointment.room_number || '204'}, 2nd Floor
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={onViewDetails}
          activeOpacity={0.8}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback to standard view
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusIndicator} />
        <Text style={styles.title}>
          {isConfirmedView ? '📅 Appointment Scheduled' : '🗓️ Upcoming Visit'}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.standardDocRow}>
          <Image source={{ uri: doctorImageUrl }} style={styles.standardDocImage} />
          <View>
            <Text style={styles.docName}>{appointment.doctor_name}</Text>
            <Text style={styles.specialty}>{appointment.specialty}</Text>
          </View>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.dateTimeText}>📆 {formattedDate}</Text>
          <Text style={styles.dateTimeText}>⏰ {formattedTime}</Text>
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationText}>📍 Room: {appointment.room_number || '204'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {onNavigatePress && (
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            onPress={() => onNavigatePress(appointment.room_number || '204')}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryBtnText}>🧭 Navigate to Clinic</Text>
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
  previewCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.roundness.lg,
    padding: Theme.spacing.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(193, 198, 215, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 4,
    width: '100%',
    marginVertical: 4,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  standardDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  standardDocImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: Theme.colors.superLightGray,
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
    backgroundColor: Theme.colors.success,
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
    fontSize: Theme.typography.headlineSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
  },
  specialty: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyMedium,
    color: Theme.colors.outline,
    marginTop: 2,
  },
  detailsList: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.superLightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  smallIcon: {
    fontSize: 14,
  },
  detailText: {
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: Theme.typography.bodyMd.fontSize,
    color: Theme.colors.onSurface,
  },
  viewDetailsBtn: {
    backgroundColor: Theme.colors.primary, // Luminous primary blue #0058bc
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  viewDetailsText: {
    color: Theme.colors.white,
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: Theme.typography.labelMd.fontSize,
  },
  arrowIcon: {
    color: Theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.superLightGray,
    padding: 12,
    borderRadius: Theme.roundness.md,
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
    borderRadius: Theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primary,
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
}));
