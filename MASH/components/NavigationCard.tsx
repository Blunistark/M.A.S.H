import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#f0fdfa', // teal-50
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  badgeText: {
    fontSize: 11,
    color: '#0d9488',
    fontWeight: '600',
  },
  destination: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  room: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingRight: 10,
  },
  stepNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginRight: 8,
    lineHeight: 18,
  },
  stepText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  navButton: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
