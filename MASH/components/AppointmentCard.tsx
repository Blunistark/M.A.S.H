import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981', // green-500
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    marginBottom: 12,
  },
  docName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  specialty: {
    fontSize: 14,
    color: '#0d9488',
    fontWeight: '600',
    marginTop: 2,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  locationSection: {
    marginTop: 10,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#0d9488',
    marginRight: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flex: 0.4,
  },
  secondaryBtnText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
});
