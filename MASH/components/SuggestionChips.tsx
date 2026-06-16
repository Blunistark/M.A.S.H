import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { Theme } from '../theme';

interface SuggestionChipsProps {
  onChipPress: (text: string) => void;
}

const CHIPS = [
  { text: '📅 Book Appointment', query: 'Book an appointment' },
  { text: '🩺 Find My Doctor', query: 'Who is my doctor?' },
  { text: '💊 Check Prescription', query: 'Check my prescription status' },
  { text: '📍 Hospital Map', query: 'Where is the pharmacy?' },
  { text: '⏰ Reschedule Appt', query: 'Reschedule my appointment' }
];

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onChipPress }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CHIPS.map((chip, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            onPress={() => onChipPress(chip.query)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{chip.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    justifyContent: 'center',
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: Theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.roundness.md, // 12px
    marginRight: 10,
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
    shadowColor: Theme.colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    color: Theme.colors.onSurface,
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyMedium,
  },
});
