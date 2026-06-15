import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Prescription } from '../types';

interface PrescriptionCardProps {
  prescription: Prescription;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription }) => {
  const getStatusStyle = () => {
    switch (prescription.status) {
      case 'fulfilled':
        return { bg: '#d1fae5', text: '#065f46', label: 'Fulfilled & Ready' };
      case 'pushed_to_pharma':
        return { bg: '#e0f2fe', text: '#0369a1', label: 'Processing at Pharmacy' };
      case 'alternative_requested':
        return { bg: '#fef3c7', text: '#92400e', label: 'Alternative Requested' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: 'Pending' };
    }
  };

  const status = getStatusStyle();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>💊 Prescription Status</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.doctorName}>From: {prescription.doctor_name}</Text>
      
      {prescription.doctor_comments && (
        <Text style={styles.comments}>💬 "{prescription.doctor_comments}"</Text>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Prescribed Items:</Text>
      {prescription.items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <View style={styles.itemDetails}>
            <Text style={styles.medName}>🔹 {item.medicine_name}</Text>
            <Text style={styles.medDosage}>{item.dosage}</Text>
          </View>
          <View style={styles.itemMeta}>
            <Text style={styles.medQty}>Qty: {item.quantity}</Text>
            <View style={[styles.stockBadge, { backgroundColor: item.inStock !== false ? '#d1fae5' : '#fee2e2' }]}>
              <Text style={[styles.stockText, { color: item.inStock !== false ? '#065f46' : '#991b1b' }]}>
                {item.inStock !== false ? 'In Stock' : 'Low Stock'}
              </Text>
            </View>
          </View>
        </View>
      ))}
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
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  doctorName: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  comments: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 6,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
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
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemDetails: {
    flex: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  medDosage: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 14,
    marginTop: 2,
  },
  itemMeta: {
    alignItems: 'flex-end',
  },
  medQty: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  stockText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});
