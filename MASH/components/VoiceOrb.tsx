import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity, Easing } from 'react-native';
import { Theme } from '../theme';

interface VoiceOrbProps {
  onPress: () => void;
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
}

const PARTICLE_COUNT = 500;
const SPHERE_RADIUS = 85; // Diameter of ~170px for a shrunken/compact layout
const CENTER = 90; // Center offset in 180x180 box

// Premium Light Pink & Rose Gold Sparkle Palette
const PALETTE = [
  '#ff8da1', // Primary pink
  '#d65a80', // Deep pink/rose
  '#ffc0cb', // Soft baby pink
  '#ffb7c5', // Light pink
  '#fff0f2', // Warm white-pink
  '#ffffff', // Pure white sparkle
];

// Mathematical 3D Sphere projection to 2D
const generateParticles = () => {
  const list = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute uniformly on a 3D sphere surface
    const z = Math.random() * 2 - 1;
    const theta = Math.random() * 2 * Math.PI;

    // Project 3D onto 2D plane
    const isShell = Math.random() > 0.15;
    const rCoeff = isShell ? Math.sqrt(1 - z * z) : Math.random() * Math.sqrt(1 - z * z);
    const r = SPHERE_RADIUS * rCoeff;

    const x = CENTER + r * Math.cos(theta);
    const y = CENTER + r * Math.sin(theta);

    const size = Math.random() * 2.5 + 1.2;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const baseOpacity = Math.random() * 0.65 + 0.25;
    const phaseGroup = i % 4;

    list.push({ x, y, size, color, baseOpacity, phaseGroup });
  }
  return list;
};

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ onPress, state = 'idle' }) => {
  const breathScale = useRef(new Animated.Value(1.0)).current;
  const shimmerPhase = useRef(new Animated.Value(0)).current;
  const rotationPhase = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.2)).current;
  const rippleScale = useRef(new Animated.Value(1.0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const statusPulse = useRef(new Animated.Value(0.4)).current;

  const particles = useRef(generateParticles()).current;
  const activeAnimations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Helper to stop all currently running animations
    const stopAllAnimations = () => {
      activeAnimations.current.forEach(anim => anim.stop());
      activeAnimations.current = [];
    };

    stopAllAnimations();

    let breathAnim: Animated.CompositeAnimation;
    let shimmerAnim: Animated.CompositeAnimation;
    let rotationAnim: Animated.CompositeAnimation;
    let glowAnim: Animated.CompositeAnimation;
    let rippleAnim: Animated.CompositeAnimation | null = null;

    // Define animation sequences depending on the state
    switch (state) {
      case 'listening':
        // Faster breathing, faster rotation, brighter glow
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.12, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 1.02, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
        );
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.6, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.35, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        break;

      case 'processing':
        // Steady quick heartbeat/pulsing, rapid shimmer, wave ripple
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.05, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 1.01, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
        );
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.timing(glowOpacity, { toValue: 0.45, duration: 400, useNativeDriver: true });

        // Wave/ripple expanding outward
        rippleScale.setValue(1.0);
        rippleOpacity.setValue(0.7);
        rippleAnim = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(rippleScale, { toValue: 1.7, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(rippleOpacity, { toValue: 0, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true })
            ]),
            Animated.parallel([
              Animated.timing(rippleScale, { toValue: 1.0, duration: 0, useNativeDriver: true }),
              Animated.timing(rippleOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true })
            ])
          ])
        );
        break;

      case 'speaking':
        // Responsive random wave simulations
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.15, duration: 250, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 0.98, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 1.08, duration: 200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 1.0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })
        );
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.55, duration: 300, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.25, duration: 300, useNativeDriver: true })
          ])
        );
        break;

      case 'idle':
      default:
        // Slow breathing, slow rotation, soft ambient glow
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.03, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 0.97, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
        );
        rotationPhase.setValue(0);
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 15000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.3, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.15, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        break;
    }

    // Status dot pulse
    const badgeDot = Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(statusPulse, { toValue: 0.4, duration: 1200, easing: Easing.linear, useNativeDriver: true })
      ])
    );

    activeAnimations.current = [breathAnim, shimmerAnim, rotationAnim, glowAnim, badgeDot];
    if (rippleAnim) activeAnimations.current.push(rippleAnim);

    // Start all active animations
    activeAnimations.current.forEach(anim => anim.start());

    return () => {
      stopAllAnimations();
      badgeDot.stop();
    };
  }, [state]);

  // Calculate animated opacity for a particle based on its phase group
  const getParticleOpacity = (baseOpacity: number, group: number) => {
    switch (group) {
      case 0:
        return shimmerPhase.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [baseOpacity * 0.4, baseOpacity * 1.1, baseOpacity * 0.4],
        });
      case 1:
        return shimmerPhase.interpolate({
          inputRange: [0, 0.25, 0.75, 1],
          outputRange: [baseOpacity * 0.9, baseOpacity * 0.4, baseOpacity * 1.2, baseOpacity * 0.9],
        });
      case 2:
        return shimmerPhase.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [baseOpacity * 1.2, baseOpacity * 0.3, baseOpacity * 1.2],
        });
      default: // 3
        return shimmerPhase.interpolate({
          inputRange: [0, 0.35, 0.8, 1],
          outputRange: [baseOpacity * 0.5, baseOpacity * 1.1, baseOpacity * 0.6, baseOpacity * 0.5],
        });
    }
  };

  // Generate drift offset values for 60fps micro-movements on individual particles
  const getDriftX = (idx: number) => {
    const direction = idx % 2 === 0 ? 1 : -1;
    const amount = (idx % 4 + 2) * 1.5; // Up to 9px drift
    return shimmerPhase.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, direction * amount, 0],
    });
  };

  const getDriftY = (idx: number) => {
    const direction = (idx + 1) % 2 === 0 ? 1 : -1;
    const amount = (idx % 3 + 2) * 1.5;
    return shimmerPhase.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, direction * amount, 0],
    });
  };

  // Rotation interpolations for Layer 1 (Background), Layer 2 (Midground), Layer 3 (Foreground)
  const rotY1 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotX1 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '375deg'] });

  const rotY2 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['120deg', '-240deg'] });
  const rotX2 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '405deg'] });

  const rotY3 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['240deg', '600deg'] });
  const rotX3 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '330deg'] });

  // Group particles into layers
  const layer1Particles = particles.filter((_, idx) => idx % 3 === 0);
  const layer2Particles = particles.filter((_, idx) => idx % 3 === 1);
  const layer3Particles = particles.filter((_, idx) => idx % 3 === 2);

  const renderParticles = (particlesList: typeof particles, startIndex: number) => {
    return particlesList.map((p, listIdx) => {
      const idx = startIndex + listIdx * 3;
      return (
        <Animated.View
          key={idx}
          style={[
            styles.particle,
            {
              left: p.x - p.size / 2,
              top: p.y - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: getParticleOpacity(p.baseOpacity, p.phaseGroup),
              transform: [
                { translateX: getDriftX(idx) },
                { translateY: getDriftY(idx) }
              ]
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Animated ambient background sphere glow */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: breathScale }]
          }
        ]}
      />

      {/* Main Touch Area */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchArea}>
        {/* Animated breathing sphere container */}
        <Animated.View style={[styles.sphere, { transform: [{ scale: breathScale }] }]}>

          {/* Layer 1: Background orbiting particles */}
          <Animated.View style={[styles.layerContainer, { transform: [{ rotateY: rotY1 }, { rotateX: rotX1 }] }]}>
            {renderParticles(layer1Particles, 0)}
          </Animated.View>

          {/* Layer 2: Midground orbiting particles */}
          <Animated.View style={[styles.layerContainer, { transform: [{ rotateY: rotY2 }, { rotateX: rotX2 }] }]}>
            {renderParticles(layer2Particles, 1)}
          </Animated.View>

          {/* Layer 3: Foreground orbiting particles */}
          <Animated.View style={[styles.layerContainer, { transform: [{ rotateY: rotY3 }, { rotateX: rotX3 }] }]}>
            {renderParticles(layer3Particles, 2)}
          </Animated.View>

          {/* Shimmering center light reflection */}
          <View style={styles.centerGlow} />

          {/* Ripple wave effect for processing state */}
          {state === 'processing' && (
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                }
              ]}
            />
          )}

          {/* Extremely subtle mic placeholder overlay - ONLY displayed in idle state */}
          {state === 'idle' && (
            <View style={styles.micOverlay}>
              <View style={styles.micHead} />
              <View style={styles.micStand} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Subdued compact status badge below orb */}
      <View style={styles.statusBadge}>
        {state === 'idle' && (
          <>
            <Animated.View style={[styles.statusDot, { opacity: statusPulse }]} />
            <Text style={styles.statusText}>Tap to start</Text>
          </>
        )}
        {state === 'listening' && (
          <>
            <Animated.View style={[styles.statusDot, { backgroundColor: Theme.colors.secondary, opacity: statusPulse }]} />
            <Text style={[styles.statusText, { color: Theme.colors.secondary }]}>Listening...</Text>
          </>
        )}
        {state === 'processing' && (
          <>
            <Animated.View style={[styles.statusDot, { backgroundColor: Theme.colors.primary, opacity: statusPulse }]} />
            <Text style={[styles.statusText, { color: Theme.colors.primary }]}>Thinking...</Text>
          </>
        )}
        {state === 'speaking' && (
          <>
            <Animated.View style={[styles.statusDot, { backgroundColor: Theme.colors.success, opacity: statusPulse }]} />
            <Text style={[styles.statusText, { color: Theme.colors.success }]}>Speaking...</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 260,
    height: 260,
  },
  touchArea: {
    zIndex: 10,
  },
  layerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  ambientGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 141, 161, 0.08)', // Very soft pink ambient glow
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 3,
    zIndex: 1,
  },
  sphere: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  particle: {
    position: 'absolute',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  centerGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    left: CENTER - 16,
    top: CENTER - 16,
    filter: 'blur(10px)',
  },
  rippleRing: {
    position: 'absolute',
    width: SPHERE_RADIUS * 2,
    height: SPHERE_RADIUS * 2,
    borderRadius: SPHERE_RADIUS,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    left: CENTER - SPHERE_RADIUS,
    top: CENTER - SPHERE_RADIUS,
  },
  micOverlay: {
    position: 'absolute',
    left: CENTER - 8,
    top: CENTER - 10,
    alignItems: 'center',
    opacity: 0.18, // Extremely subtle so the particle cluster shines
  },
  micHead: {
    width: 8,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  micStand: {
    width: 14,
    height: 6,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#ffffff',
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    marginTop: -3,
  },
  statusBadge: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primary, // Soft pink pulsing dot
    marginRight: 6,
  },
  statusText: {
    fontFamily: Theme.typography.fontFamilyMedium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant, // Shrunk secondary gray
  },
});
