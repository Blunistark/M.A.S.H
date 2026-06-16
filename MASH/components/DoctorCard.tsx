import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onBookPress?: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookPress }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{ uri: doctor.image_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150' }}
          style={styles.image}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{doctor.full_name}</Text>
          <Text style={styles.specialty}>{doctor.specialty}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⭐️ {doctor.rating || '4.8'}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>{doctor.experience_years || '10'} yrs exp</Text>
          </View>

          <View style={styles.roomBadge}>
            <Text style={styles.roomText}>📍 {doctor.room_number || 'Room 101'}</Text>
          </View>
        </View>
      </View>

      {onBookPress && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => onBookPress(doctor)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Select Doctor & View Slots</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
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
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f1f5f9',
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a', // slate-900
  },
  specialty: {
    fontSize: 14,
    color: '#0d9488', // teal-600
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b', // slate-500
  },
  metaDivider: {
    fontSize: 12,
    color: '#cbd5e1',
    marginHorizontal: 6,
  },
  roomBadge: {
    backgroundColor: '#f0fdf4', // light green
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roomText: {
    fontSize: 11,
    color: '#166534', // dark green
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#0d9488', // teal-600
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
