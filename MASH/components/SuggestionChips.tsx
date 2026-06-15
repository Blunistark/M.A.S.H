import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View } from 'react-native';

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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#e0f2fe', // light sky blue
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chipText: {
    color: '#0369a1', // dark sky blue text
    fontSize: 14,
    fontWeight: '600',
  },
});
