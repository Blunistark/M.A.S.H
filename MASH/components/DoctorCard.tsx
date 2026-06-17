import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Theme } from '../theme';
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
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Theme.colors.superLightGray,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.onSurfaceVariant,
  },
  metaDivider: {
    fontSize: Theme.typography.labelSm.fontSize,
    color: Theme.colors.outlineVariant,
    marginHorizontal: 6,
  },
  roomBadge: {
    backgroundColor: Theme.colors.secondaryContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.sm,
    marginTop: 6,
  },
  roomText: {
    fontSize: 11,
    color: Theme.colors.secondary,
    fontFamily: Theme.typography.fontFamilyBold,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.full,
    height: Theme.spacing.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...Theme.shadows.level1,
  },
  buttonText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
  },
}));
