import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Theme } from '../theme';

interface ClinicMapProps {
  activePath: 'lobby' | 'pharmacy' | 'cardiology' | 'pediatrics' | 'dermatology' | null;
}

export const ClinicMap: React.FC<ClinicMapProps> = ({ activePath }) => {
  // Dot position animations
  const dotX = useRef(new Animated.Value(150)).current; // Center start (Entrance)
  const dotY = useRef(new Animated.Value(280)).current; // Bottom start (Entrance)
  const dotOpacity = useRef(new Animated.Value(0)).current;

  // Path coordinates mapping (X, Y) relative to 300x320 map size
  // Entrance: (150, 280)
  // Reception: (150, 180)
  // Pharmacy (Room 102): (50, 240)
  // Dr. Patel (Room 105): (50, 120)
  // Dr. Jenkins (Room 214): (50, 40)
  // Dr. Desai (Room 302): (250, 40)
  // Elevator: (250, 180)

  useEffect(() => {
    if (!activePath) {
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
        // Entrance -> Corridor Left -> Pharmacy
        animationSequence = Animated.sequence([
          Animated.timing(dotY, { toValue: 240, duration: 1000, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotX, { toValue: 50, duration: 1200, easing: Easing.linear, useNativeDriver: false })
        ]);
        break;
      case 'pediatrics':
        // Entrance -> Reception -> Corridor Left -> Room 105
        animationSequence = Animated.sequence([
          Animated.timing(dotY, { toValue: 180, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotX, { toValue: 50, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotY, { toValue: 120, duration: 800, easing: Easing.linear, useNativeDriver: false })
        ]);
        break;
      case 'dermatology':
        // Entrance -> Reception -> Corridor Left -> Room 214
        animationSequence = Animated.sequence([
          Animated.timing(dotY, { toValue: 180, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotX, { toValue: 50, duration: 1200, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(dotY, { toValue: 40, duration: 1500, easing: Easing.linear, useNativeDriver: false })
        ]);
        break;
      case 'cardiology':
        // Entrance -> Reception -> Elevator -> Room 302
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
  }, [activePath]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 Clinic Floor Plan</Text>
      
      {/* Dynamic Map Area */}
      <View style={styles.mapGrid}>
        
        {/* CORRIDORS / PATHWAYS (Light gray tracks) */}
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

        {/* Dr. Desai Room 302 */}
        <View style={[styles.room, styles.cardiologyRoom, activePath === 'cardiology' && styles.highlightedRoom]}>
          <Text style={styles.roomLabel}>❤️ Room 302</Text>
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
        {activePath && (
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
          <View style={[styles.legendColor, { backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#bae6fd' }]} />
          <Text style={styles.legendText}>Rooms</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Theme.colors.lightGray }]} />
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

const styles = StyleSheet.create({
  container: {
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
    alignItems: 'center',
  },
  title: {
    fontSize: Theme.typography.bodyLg.fontSize,
    fontFamily: Theme.typography.fontFamilyBold,
    color: Theme.colors.onSurface,
    marginBottom: 12,
  },
  mapGrid: {
    width: 300,
    height: 320,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.lightGray,
    position: 'relative',
    overflow: 'hidden',
  },
  corridor: {
    position: 'absolute',
    backgroundColor: Theme.colors.lightGray,
    borderRadius: 4,
  },
  room: {
    position: 'absolute',
    backgroundColor: '#e0f2fe',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: Theme.roundness.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  highlightedRoom: {
    backgroundColor: Theme.colors.secondaryContainer,
    borderColor: Theme.colors.secondary,
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
    backgroundColor: Theme.colors.onSurfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm - 4,
  },
  entranceText: {
    color: Theme.colors.white,
    fontSize: 9,
    fontFamily: Theme.typography.fontFamilyBold,
  },
  navDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.secondary,
    borderWidth: 2,
    borderColor: Theme.colors.white,
    zIndex: 100,
    marginTop: -6,
    marginLeft: -6,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 16,
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
});
