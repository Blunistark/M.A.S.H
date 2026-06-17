import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../theme';

interface SuggestionChipsProps {
  onChipPress: (text: string) => void;
}

const CHIPS = [
  { text: 'Book Appointment', icon: '📅', query: 'Book an appointment' },
  { text: 'Find My Doctor', icon: '🩺', query: 'Who is my doctor?' },
  { text: 'Reschedule Visit', icon: '🔁', query: 'Reschedule my appointment' },
  { text: 'Check Prescription', icon: '💊', query: 'Check my prescription status' }
];

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onChipPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {CHIPS.map((chip, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            onPress={() => onChipPress(chip.query)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipIcon}>{chip.icon}</Text>
            <Text style={styles.chipText}>{chip.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = Theme.createStyleSheet(() => ({
  container: {
    paddingHorizontal: Theme.spacing.containerPadding,
    marginVertical: 8, // Compact spacing
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8, // Tighter gap
  },
  chip: {
    backgroundColor: Theme.colors.surface, // Clean white card surface background
    borderWidth: 1,
    borderColor: Theme.colors.outline, // Thin pink border
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Theme.roundness.full, // Pill-shape buttons
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%', // Tighter 2-column fit
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    color: Theme.colors.secondary, // Deep pink/rose text
    fontSize: 11, // Shrunk/compact label size
    fontFamily: Theme.typography.fontFamilyBold,
  },
}));
