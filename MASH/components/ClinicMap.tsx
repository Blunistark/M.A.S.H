import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Theme } from '../theme';

interface ClinicMapProps {
  activePath: 'lobby' | 'pharmacy' | 'cardiology' | 'pediatrics' | 'dermatology' | null;
  navigationActive?: boolean;
}

export const ClinicMap: React.FC<ClinicMapProps> = ({ activePath, navigationActive = false }) => {
  // Dot position animations (using 300x320 coordinate grid system)
  const dotX = useRef(new Animated.Value(150)).current; // Start entrance center
  const dotY = useRef(new Animated.Value(280)).current; // Start entrance bottom
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!navigationActive || !activePath) {
      dotOpacity.setValue(0);
      return;
    }

    // Reset dot to entrance
    dotX.setValue(150);
    dotY.setValue(280);
    dotOpacity.setValue(1);

    let animationSequence: Animated.CompositeAnimation;

    switch (activePath) {
      case 'pharmacy':
        // Entrance -> Corridor Left -> Pharmacy Room 102
        animationSequence = Animated.sequence([
          Animated.timing(dotY, { toValue: 240, duration: 1000, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotX, { toValue: 50, duration: 1200, easing: Easing.linear, useNativeDriver: false })
        ]);
        break;
      case 'pediatrics':
        // Entrance -> Reception Corridor -> Corridor Left -> Room 105
        animationSequence = Animated.sequence([
          Animated.timing(dotY, { toValue: 180, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotX, { toValue: 50, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotY, { toValue: 120, duration: 800, easing: Easing.linear, useNativeDriver: false })
        ]);
        break;
      case 'dermatology':
        // Entrance -> Reception Corridor -> Corridor Left -> Room 214
        animationSequence = Animated.sequence([
          Animated.timing(dotY, { toValue: 180, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotX, { toValue: 50, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotY, { toValue: 40, duration: 1500, easing: Easing.linear, useNativeDriver: false })
        ]);
        break;
      case 'cardiology':
        // Entrance -> Reception Corridor -> Corridor Right -> Room 302/204
        animationSequence = Animated.sequence([
          Animated.timing(dotY, { toValue: 180, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotX, { toValue: 250, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotY, { toValue: 40, duration: 1500, easing: Easing.linear, useNativeDriver: false })
        ]);
        break;
      default: // lobby
        animationSequence = Animated.timing(dotY, {
          toValue: 180,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: false
        });
    }

    // Loop the path animation indefinitely
    const loop = Animated.loop(
      Animated.sequence([
        animationSequence,
        Animated.delay(1000),
        Animated.timing(dotOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.delay(200),
        Animated.timing(dotX, { toValue: 150, duration: 0, useNativeDriver: false }),
        Animated.timing(dotY, { toValue: 280, duration: 0, useNativeDriver: false }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 300, useNativeDriver: false })
      ])
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [activePath, navigationActive]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 Clinic Floor Plan</Text>
      
      {/* Dynamic Map Area */}
      <View style={styles.mapGrid}>
        
        {/* CORRIDORS / PATHWAYS (Dark tracks) */}
        <View style={[styles.corridor, { top: 170, left: 40, width: 220, height: 20 }]} /> {/* Main Horiz */}
        <View style={[styles.corridor, { top: 40, left: 140, width: 20, height: 240 }]} /> {/* Main Vert */}
        <View style={[styles.corridor, { top: 40, left: 40, width: 20, height: 140 }]} /> {/* Left Vert */}
        <View style={[styles.corridor, { top: 40, left: 240, width: 20, height: 140 }]} /> {/* Right Vert */}

        {/* ROOMS */}
        {/* Pharmacy Room 102 */}
        <View style={[styles.room, styles.pharmacyRoom, activePath === 'pharmacy' && styles.highlightedRoom]}>
          <Text style={styles.roomLabel}>💊 Room 102</Text>
          <Text style={styles.roomSub}>Pharmacy</Text>
        </View>

        {/* Dr. Patel Room 105 */}
        <View style={[styles.room, styles.pediatricsRoom, activePath === 'pediatrics' && styles.highlightedRoom]}>
          <Text style={styles.roomLabel}>🧸 Room 105</Text>
          <Text style={styles.roomSub}>Pediatrics</Text>
        </View>

        {/* Dr. Jenkins Room 214 */}
        <View style={[styles.room, styles.dermatologyRoom, activePath === 'dermatology' && styles.highlightedRoom]}>
          <Text style={styles.roomLabel}>🧴 Room 214</Text>
          <Text style={styles.roomSub}>Dermatology</Text>
        </View>

        {/* Dr. Smith Room 204 */}
        <View style={[styles.room, styles.cardiologyRoom, activePath === 'cardiology' && styles.highlightedRoom]}>
          <Text style={styles.roomLabel}>❤️ Room 204</Text>
          <Text style={styles.roomSub}>Cardiology</Text>
        </View>

        {/* Reception / Lobby */}
        <View style={[styles.room, styles.receptionRoom, activePath === 'lobby' && styles.highlightedRoom]}>
          <Text style={styles.roomLabel}>🛎️ Reception</Text>
          <Text style={styles.roomSub}>Main Desk</Text>
        </View>

        {/* Entrance */}
        <View style={styles.entranceBadge}>
          <Text style={styles.entranceText}>🚪 ENTRANCE</Text>
        </View>

        {/* ANIMATED NAVIGATOR DOT */}
        {navigationActive && activePath && (
          <Animated.View
            style={[
              styles.navDot,
              {
                left: dotX,
                top: dotY,
                opacity: dotOpacity
              }
            ]}
          />
        )}
      </View>

      {/* Map Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.outline }]} />
          <Text style={styles.legendText}>Rooms</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Theme.colors.outline }]} />
          <Text style={styles.legendText}>Corridors</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Theme.colors.secondary, borderRadius: 4 }]} />
          <Text style={styles.legendText}>Your Route</Text>
        </View>
      </View>
    </View>
  );
};

const styles = Theme.createStyleSheet(() => ({
  container: {
    backgroundColor: Theme.colors.surface, // Clean white card surface background
    borderRadius: Theme.roundness.lg,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.cardPadding,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.typography.bodyLg.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
    marginBottom: 8,
  },
  mapGrid: {
    width: 300,
    height: 320,
    backgroundColor: Theme.colors.superLightGray, // Deep background soft pink
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    position: 'relative',
    overflow: 'hidden',
  },
  corridor: {
    position: 'absolute',
    backgroundColor: Theme.colors.outline, // Corridor track lines
    borderRadius: 4,
  },
  room: {
    position: 'absolute',
    backgroundColor: Theme.colors.surface, // White rooms
    borderWidth: 1,
    borderColor: Theme.colors.outline, // Outline
    borderRadius: Theme.roundness.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  highlightedRoom: {
    backgroundColor: 'rgba(98, 250, 227, 0.15)', // Translucent cyan container highlight
    borderColor: Theme.colors.secondary, // Medical teal border
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  roomLabel: {
    fontSize: 10,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
  },
  roomSub: {
    fontSize: 8,
    fontFamily: Theme.typography.fontFamily,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  // Rooms placements
  pharmacyRoom: {
    left: 10,
    top: 220,
    width: 90,
    height: 50,
  },
  pediatricsRoom: {
    left: 10,
    top: 100,
    width: 90,
    height: 50,
  },
  dermatologyRoom: {
    left: 10,
    top: 15,
    width: 90,
    height: 50,
  },
  cardiologyRoom: {
    right: 10,
    top: 15,
    width: 90,
    height: 50,
  },
  receptionRoom: {
    left: 105,
    top: 155,
    width: 90,
    height: 50,
  },
  entranceBadge: {
    position: 'absolute',
    bottom: 5,
    alignSelf: 'center',
    left: 110,
    backgroundColor: Theme.colors.superLightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm - 4,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  entranceText: {
    color: Theme.colors.onSurfaceVariant,
    fontSize: 9,
    fontFamily: Theme.typography.fontFamilyBold,
  },
  navDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.secondary, // Glowing pink tracking dot
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 100,
    marginTop: -6,
    marginLeft: -6,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-around',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: Theme.typography.labelSm.fontSize,
    fontFamily: Theme.typography.fontFamilyMedium,
    color: Theme.colors.onSurfaceVariant,
  },
}));
