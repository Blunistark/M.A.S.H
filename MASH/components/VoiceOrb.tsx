import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import Svg, { Defs, Path, Circle, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Audio } from 'expo-av';
import { Theme } from '../theme';

interface VoiceOrbProps {
  onPress: () => void;
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
}

const PARTICLE_COUNT = 300; // High density for a rich particle cloud
const SPHERE_RADIUS = 95;   // Size of the particle orb
const CENTER = 110;         // Center coordinates in a 220x220 container

// Shades of blue, cyan, and white matching the image palette
const PALETTE = [
  '#003c8f', // Deep blue
  '#0058bc', // Professional blue
  '#0082ff', // Electric blue
  '#00b0ff', // Light sky blue
  '#62fae3', // Vibrant cyan/teal
  '#adc6ff', // Soft ice blue
  '#ffffff', // Pure white sparkle
];

// Mathematical 3D Sphere projection to 2D
const generateParticles = () => {
  const list = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute uniformly in a 3D volume, bias towards center for density
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    // Volumetric sphere distribution with center bias
    const r = SPHERE_RADIUS * Math.pow(Math.random(), 1.6);

    const x = CENTER + r * Math.sin(phi) * Math.cos(theta);
    const y = CENTER + r * Math.sin(phi) * Math.sin(theta);

    // Sizing: tiny dots matching the screenshot
    const size = Math.random() * 1.5 + 0.8;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    // Higher opacity in core, lighter towards edges
    const distanceRatio = r / SPHERE_RADIUS;
    const baseOpacity = (1.0 - distanceRatio * 0.4) * (Math.random() * 0.6 + 0.4);

    const phaseGroup = i % 4;

    list.push({ x, y, size, color, baseOpacity, phaseGroup });
  }
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ onPress, state = 'idle' }) => {
  const breathScale = useRef(new Animated.Value(1.0)).current;
  const shimmerPhase = useRef(new Animated.Value(0)).current;
  const rotationPhase = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const rippleScale = useRef(new Animated.Value(1.0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ onPress, state = 'idle' }) => {
  const [time, setTime] = useState(0);
  const [volume, setVolume] = useState(0); // 0 to 1
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalIdRef = useRef<any>(null);

  // 1. Tick animation frame loop (~60fps)
  useEffect(() => {
    const stopAllAnimations = () => {
      activeAnimations.current.forEach(anim => anim.stop());
      activeAnimations.current = [];
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

    stopAllAnimations();

    let breathAnim: Animated.CompositeAnimation;
    let shimmerAnim: Animated.CompositeAnimation;
    let rotationAnim: Animated.CompositeAnimation;
    let glowAnim: Animated.CompositeAnimation;
    let rippleAnim: Animated.CompositeAnimation | null = null;

    switch (state) {
      case 'listening':
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 0.98, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
        );
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.6, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        break;

      case 'processing':
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.04, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 1.0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })
        );
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.timing(glowOpacity, { toValue: 0.4, duration: 300, useNativeDriver: true });

        rippleScale.setValue(1.0);
        rippleOpacity.setValue(0.6);
        rippleAnim = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(rippleScale, { toValue: 1.5, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
              Animated.timing(rippleOpacity, { toValue: 0, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true })
            ]),
            Animated.parallel([
              Animated.timing(rippleScale, { toValue: 1.0, duration: 0, useNativeDriver: true }),
              Animated.timing(rippleOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true })
            ])
          ])
        );
        break;

      case 'speaking':
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.12, duration: 200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 0.95, duration: 280, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 1.06, duration: 180, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 1.0, duration: 250, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })
        );
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.5, duration: 250, useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.25, duration: 250, useNativeDriver: true })
          ])
        );
        break;

      case 'idle':
      default:
        breathAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(breathScale, { toValue: 1.02, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(breathScale, { toValue: 0.98, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );
        shimmerAnim = Animated.loop(
          Animated.timing(shimmerPhase, { toValue: 1, duration: 3500, easing: Easing.linear, useNativeDriver: true })
        );
        rotationPhase.setValue(0);
        rotationAnim = Animated.loop(
          Animated.timing(rotationPhase, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
        );
        glowAnim = Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacity, { toValue: 0.25, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowOpacity, { toValue: 0.12, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
          ])
        );

    activeAnimations.current = [breathAnim, shimmerAnim, rotationAnim, glowAnim];
    if (rippleAnim) activeAnimations.current.push(rippleAnim);

    activeAnimations.current.forEach(anim => anim.start());

    return () => {
      stopAllAnimations();
    };
  }, [state]);

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
      default:
        return shimmerPhase.interpolate({
          inputRange: [0, 0.35, 0.8, 1],
          outputRange: [baseOpacity * 0.5, baseOpacity * 1.1, baseOpacity * 0.6, baseOpacity * 0.5],
        });
    }
  };

  const getDriftX = (idx: number) => {
    const direction = idx % 2 === 0 ? 1 : -1;
    const amount = (idx % 4 + 2) * 1.2;
    return shimmerPhase.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, direction * amount, 0],
    });
  };

  const getDriftY = (idx: number) => {
    const direction = (idx + 1) % 2 === 0 ? 1 : -1;
    const amount = (idx % 3 + 2) * 1.2;
    return shimmerPhase.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, direction * amount, 0],
    });
  };

  const rotY1 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotX1 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['12deg', '372deg'] });

  const rotY2 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['120deg', '-240deg'] });
  const rotX2 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['35deg', '395deg'] });

  const rotY3 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['240deg', '600deg'] });
  const rotX3 = rotationPhase.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '335deg'] });

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
      {/* Soft blue-cyan halo glow matching screenshot */}
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
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touchArea}>
        <Animated.View style={[styles.sphere, { transform: [{ scale: breathScale }] }]}>

          {/* Volumetric background core highlight */}
          <View style={styles.centerGlow} />

          {/* Layer 1: Orbiting particles */}
          <Animated.View style={[styles.layerContainer, { transform: [{ rotateY: rotY1 }, { rotateX: rotX1 }] }]}>
            {renderParticles(layer1Particles, 0)}
          </Animated.View>

          {/* Layer 2: Orbiting particles */}
          <Animated.View style={[styles.layerContainer, { transform: [{ rotateY: rotY2 }, { rotateX: rotX2 }] }]}>
            {renderParticles(layer2Particles, 1)}
          </Animated.View>

          {/* Layer 3: Orbiting particles */}
          <Animated.View style={[styles.layerContainer, { transform: [{ rotateY: rotY3 }, { rotateX: rotX3 }] }]}>
            {renderParticles(layer3Particles, 2)}
          </Animated.View>

          {/* Processing state ripples */}
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
        </Animated.View>
      </TouchableOpacity>

      {/* Monospaced, spaced out status badge */}
      <View style={styles.statusBadge}>
        {state === 'idle' && (
          <Text style={styles.statusText}>ASK M.A.S.H ANYTHING...</Text>
        )}
        {state === 'listening' && (
          <Text style={[styles.statusText, { color: Theme.colors.secondary }]}>LISTENING...</Text>
        )}
        {state === 'processing' && (
          <Text style={[styles.statusText, { color: Theme.colors.primary }]}>THINKING...</Text>
        )}
        {state === 'speaking' && (
          <Text style={[styles.statusText, { color: Theme.colors.secondary }]}>SPEAKING...</Text>
        )}
      </View>
    </View>
  );
};

const styles = Theme.createStyleSheet(() => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
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
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(98, 250, 227, 0.12)', // Subtle light cyan glow
    shadowColor: '#0082ff',                       // Spread blue shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
    elevation: 4,
    zIndex: 1,
  },
  sphere: {
    width: 220,
    height: 220,
    borderRadius: 110,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  particle: {
    position: 'absolute',
  },
  centerGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 88, 188, 0.15)', // Soft blue volumetric core back-glow
    left: CENTER - 45,
    top: CENTER - 45,
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
  statusBadge: {
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
    width: '100%',
  },
  statusText: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 13,
    color: '#191c1e', // Match theme high contrast slate-charcoal text
    letterSpacing: 2.5,
    textAlign: 'center',
  },
}));
