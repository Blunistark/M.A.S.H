import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../theme';
import { Prescription } from '../types';

interface PrescriptionCardProps {
  prescription: Prescription;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription }) => {
  const getStatusStyle = () => {
    switch (prescription.status) {
      case 'fulfilled':
        return { bg: Theme.colors.secondaryContainer, text: Theme.colors.secondary, label: 'Fulfilled & Ready' };
      case 'pushed_to_pharma':
        return { bg: '#e0f2fe', text: Theme.colors.primary, label: 'Processing at Pharmacy' };
      case 'alternative_requested':
        return { bg: '#fef3c7', text: '#92400e', label: 'Alternative Requested' };
      default:
        return { bg: Theme.colors.superLightGray, text: Theme.colors.onSurfaceVariant, label: 'Pending' };
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
      
      {!!prescription.doctor_comments && (
        <Text style={styles.comments}>💬 "{prescription.doctor_comments}"</Text>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Prescribed Items:</Text>
      {prescription.items.map((item: any, index: number) => (
        <View key={index} style={styles.itemRow}>
          <View style={styles.itemDetails}>
            <Text style={styles.medName}>🔹 {item.medicine_name}</Text>
            <Text style={styles.medDosage}>{item.dosage}</Text>
          </View>
          <View style={styles.itemMeta}>
            <Text style={styles.medQty}>Qty: {item.quantity}</Text>
            <View style={[styles.stockBadge, { backgroundColor: item.inStock !== false ? Theme.colors.secondaryContainer : Theme.colors.errorContainer }]}>
              <Text style={[styles.stockText, { color: item.inStock !== false ? Theme.colors.secondary : Theme.colors.error }]}>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.roundness.sm,
  },
  badgeText: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
  },
  doctorName: {
    fontSize: Theme.typography.bodyMd.fontSize,
    color: Theme.colors.onSurfaceVariant,
    fontFamily: Theme.typography.fontFamilyMedium,
  },
  comments: {
    fontSize: Theme.typography.labelMd.fontSize,
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: Theme.colors.superLightGray,
    padding: 10,
    borderRadius: Theme.roundness.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.lightGray,
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.outline,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.superLightGray,
  },
  itemDetails: {
    flex: 1,
  },
  medName: {
    fontSize: Theme.typography.bodyMd.fontSize,
    fontFamily: Theme.typography.fontFamilySemiBold,
    color: Theme.colors.onSurface,
  },
  medDosage: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.onSurfaceVariant,
    marginLeft: 14,
    marginTop: 2,
  },
  itemMeta: {
    alignItems: 'flex-end',
  },
  medQty: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyMedium,
    color: Theme.colors.onSurfaceVariant,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.sm,
    marginTop: 4,
  },
  stockText: {
    fontSize: Theme.typography.labelSm.fontSize - 2,
    fontFamily: Theme.typography.fontFamilyBold,
  },
});
