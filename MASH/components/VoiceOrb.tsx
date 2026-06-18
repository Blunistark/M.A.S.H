import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import Svg, { Defs, Circle, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Audio } from 'expo-av';
import { Theme } from '../theme';

interface VoiceOrbProps {
  onPress: () => void;
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
}

<<<<<<< HEAD
// Spherical grid segmentation (dense for rich point-cloud representation)
const LAT_COUNT = 22;
const LNG_COUNT = 32;
=======
const PARTICLE_COUNT = 300; // High density for a rich particle cloud
const SPHERE_RADIUS = 95;   // Size of the particle orb
const CENTER = 110;         // Center coordinates in a 220x220 container
>>>>>>> 3f2016b2a9532c19ce8e3ec1eadefda1d9934699

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

<<<<<<< HEAD
// Scattered glowing particles around the orb perimeter (increased count and size range)
const particleData = Array.from({ length: 65 }).map((_, idx) => {
  const theta = Math.random() * Math.PI - Math.PI / 2;
  const phi = Math.random() * 2 * Math.PI;
  return {
    nx: Math.cos(theta) * Math.sin(phi),
    ny: Math.sin(theta),
    nz: Math.cos(theta) * Math.cos(phi),
    rOffset: 20 + Math.random() * 30,
    speed: 1.2 + Math.random() * 2.2,
    size: 0.8 + Math.random() * 1.8,
    color: idx % 3 === 0 ? '#00E5FF' : idx % 3 === 1 ? '#FF00FF' : '#ffffff',
  };
});
=======
export const VoiceOrb: React.FC<VoiceOrbProps> = ({ onPress, state = 'idle' }) => {
  const breathScale = useRef(new Animated.Value(1.0)).current;
  const shimmerPhase = useRef(new Animated.Value(0)).current;
  const rotationPhase = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const rippleScale = useRef(new Animated.Value(1.0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
>>>>>>> 3f2016b2a9532c19ce8e3ec1eadefda1d9934699

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

<<<<<<< HEAD
    async function startRecording() {
      if (state !== 'listening') {
        if (recordingRef.current) {
          stopRecording();
        }
        return;
      }
=======
    let breathAnim: Animated.CompositeAnimation;
    let shimmerAnim: Animated.CompositeAnimation;
    let rotationAnim: Animated.CompositeAnimation;
    let glowAnim: Animated.CompositeAnimation;
    let rippleAnim: Animated.CompositeAnimation | null = null;
>>>>>>> 3f2016b2a9532c19ce8e3ec1eadefda1d9934699

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

<<<<<<< HEAD
        recordingRef.current = recording;

        intervalIdRef.current = setInterval(async () => {
          try {
            if (recordingRef.current) {
              const status = await recordingRef.current.getStatusAsync();
              if (status.canRecord && status.metering !== undefined) {
                const db = status.metering;
                const minDb = -60;
                let normVol = (db - minDb) / -minDb;
                if (normVol < 0) normVol = 0;
                if (normVol > 1) normVol = 1;
                
                setVolume(v => v * 0.7 + normVol * 0.3);
              }
            }
          } catch (e) {
            // Ignore polling errors
          }
        }, 50);

      } catch (err) {
        console.warn('VoiceOrb: Failed to start recording session', err);
      }
    }

    startRecording();
=======
    activeAnimations.current.forEach(anim => anim.start());
>>>>>>> 3f2016b2a9532c19ce8e3ec1eadefda1d9934699

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

<<<<<<< HEAD
  // 3. Fallback / AI speaking state simulated volume reactivity
  useEffect(() => {
    let simInterval: any = null;
    if (state !== 'listening') {
      setVolume(0);
      
      simInterval = setInterval(() => {
        const now = Date.now() / 1000;
        if (state === 'speaking') {
          const speakVol = 0.15 + Math.abs(Math.sin(now * 7.5) * Math.cos(now * 3.1)) * 0.45;
          setVolume(speakVol);
        } else if (state === 'processing') {
          const procVol = 0.05 + Math.sin(now * 18) * 0.03;
          setVolume(procVol);
        } else {
          setVolume(0);
        }
      }, 30);
    }
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [state]);
=======
  const getDriftX = (idx: number) => {
    const direction = idx % 2 === 0 ? 1 : -1;
    const amount = (idx % 4 + 2) * 1.2;
    return shimmerPhase.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, direction * amount, 0],
    });
  };
>>>>>>> 3f2016b2a9532c19ce8e3ec1eadefda1d9934699

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

<<<<<<< HEAD
  baseGrid.forEach(v => {
    // Generate organic 3D wave displacement
    const wave = Math.sin(2.2 * v.nx + time * 3.8) * Math.cos(2.0 * v.ny + time * 2.5) +
                 Math.sin(3.0 * v.nz - time * 3.0) * Math.cos(v.nx + time * 4.2) +
                 Math.sin(1.5 * v.ny - time * 1.8) * Math.cos(2.5 * v.nz + time * 1.2);
                 
    const deformedR = R + wave * deformationAmp;
    
    // 3D Point
    const px = deformedR * v.nx;
    const py = deformedR * v.ny;
    const pz = deformedR * v.nz;
    
    // Rotate Y
    const x1 = px * Math.cos(rotY) - pz * Math.sin(rotY);
    const z1 = px * Math.sin(rotY) + pz * Math.cos(rotY);
    const y1 = py;
    
    // Rotate X
    const y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
    const z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
    const x2 = x1;
    
    // Perspective Projection
    const scale = cameraDistance / (cameraDistance + z2);
    const soundScale = 1.0 + volume * 0.12;
    
    const xp = centerX + x2 * scale * soundScale;
    const yp = centerY + y2 * scale * soundScale;
    
    projected[v.i][v.j] = { x: xp, y: yp, z: z2 };
  });

  // 5. Render grid intersection dots (front side only, with depth cueing size & opacity)
  const gridDots: React.ReactNode[] = [];
  for (let i = 0; i <= LAT_COUNT; i++) {
    for (let j = 0; j < LNG_COUNT; j++) {
      const pt = projected[i][j];
      if (pt && pt.z < 0) {
        // Volumetric depth ratio: 1.0 at closest center, 0 at edges
        const depthRatio = Math.max(0, Math.min(1, -pt.z / R));
        const size = 0.5 + depthRatio * 1.0 + volume * 0.5;
        const opacity = (0.22 + depthRatio * 0.78) * (0.85 + volume * 0.15);
        
        gridDots.push(
          <Circle
            key={`dot-${i}-${j}`}
            cx={pt.x}
            cy={pt.y}
            r={size}
            fill="url(#meshGrad)"
            opacity={opacity}
          />
        );
      }
    }
  }

  // 6. Project and render perimeter particles
  const particleNodes = particleData.map((p, idx) => {
    const drift = Math.sin(time * p.speed + idx) * 5 + volume * 20;
    const pR = R + p.rOffset + drift;
    
    const px = pR * p.nx;
    const py = pR * p.ny;
    const pz = pR * p.nz;
    
    const px1 = px * Math.cos(rotY) - pz * Math.sin(rotY);
    const pz1 = px * Math.sin(rotY) + pz * Math.cos(rotY);
    const py1 = py;
    
    const py2 = py1 * Math.cos(rotX) - pz1 * Math.sin(rotX);
    const pz2 = py1 * Math.sin(rotX) + pz1 * Math.cos(rotX);
    const px2 = px1;
    
    const scale = cameraDistance / (cameraDistance + pz2);
    const soundScale = 1.0 + volume * 0.12;
    
    const pxp = centerX + px2 * scale * soundScale;
    const pyp = centerY + py2 * scale * soundScale;
    
    const depthOpacity = (pz2 + 120) / 240;
    const pulseOpacity = 0.35 + Math.sin(time * 4 + idx) * 0.25;
    const finalOpacity = Math.max(0.08, Math.min(1.0, depthOpacity * pulseOpacity + volume * 0.35));
    
    return (
      <Circle
        key={idx}
        cx={pxp}
        cy={pyp}
        r={p.size}
        fill={p.color}
        opacity={finalOpacity}
      />
    );
  });
=======
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
>>>>>>> 3f2016b2a9532c19ce8e3ec1eadefda1d9934699

  // 7. Smoky nebula offsets (4 drifting layers)
  const glowCyanX = 130 + Math.sin(time * 1.5) * 20;
  const glowCyanY = 120 + Math.cos(time * 1.2) * 15;

  const glowMagentaX = 170 + Math.cos(time * 1.8) * 20;
  const glowMagentaY = 180 + Math.sin(time * 1.4) * 15;

  const glowPurpleX = 150 + Math.sin(time * 0.8) * 12;
  const glowPurpleY = 150 + Math.cos(time * 1.0) * 12;

  const glowCoreX = 150 + Math.sin(time * 2.2 + volume * 2) * 8;
  const glowCoreY = 150 + Math.cos(time * 2.5 + volume * 2) * 8;

  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touchArea}>
        <View style={styles.canvasWrapper}>
          <Svg width={300} height={300} viewBox="0 0 300 300">
            <Defs>
              {/* Electric blue to hot magenta global gradient */}
              <LinearGradient id="meshGrad" x1="75" y1="75" x2="225" y2="225" gradientUnits="userSpaceOnUse">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity={0.95} />
                <Stop offset="50%" stopColor="#8A2BE2" stopOpacity={0.8} />
                <Stop offset="100%" stopColor="#FF00FF" stopOpacity={0.95} />
              </LinearGradient>
              
              {/* Dynamic smoky radial gradients */}
              <RadialGradient id="glowCyan" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity={0.45 + volume * 0.3} />
                <Stop offset="40%" stopColor="#00BFFF" stopOpacity={0.25 + volume * 0.15} />
                <Stop offset="70%" stopColor="#8A2BE2" stopOpacity={0.08 + volume * 0.05} />
                <Stop offset="100%" stopColor="#06061A" stopOpacity={0} />
              </RadialGradient>

              <RadialGradient id="glowMagenta" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FF007F" stopOpacity={0.45 + volume * 0.3} />
                <Stop offset="40%" stopColor="#FF00FF" stopOpacity={0.25 + volume * 0.15} />
                <Stop offset="70%" stopColor="#8A2BE2" stopOpacity={0.08 + volume * 0.05} />
                <Stop offset="100%" stopColor="#06061A" stopOpacity={0} />
              </RadialGradient>

              <RadialGradient id="glowPurple" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#7F00FF" stopOpacity={0.35 + volume * 0.2} />
                <Stop offset="60%" stopColor="#4B0082" stopOpacity={0.12 + volume * 0.05} />
                <Stop offset="100%" stopColor="#06061A" stopOpacity={0} />
              </RadialGradient>

              <RadialGradient id="glowCore" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6 + volume * 0.4} />
                <Stop offset="25%" stopColor="#00E5FF" stopOpacity={0.25 + volume * 0.15} />
                <Stop offset="60%" stopColor="#7F00FF" stopOpacity={0.05} />
                <Stop offset="100%" stopColor="#06061A" stopOpacity={0} />
              </RadialGradient>
            </Defs>

            {/* Overlapping smoky nebula backgrounds */}
            <Circle
              cx={glowPurpleX}
              cy={glowPurpleY}
              r={120 + volume * 20}
              fill="url(#glowPurple)"
            />
            <Circle
              cx={glowCyanX}
              cy={glowCyanY}
              r={105 + volume * 25}
              fill="url(#glowCyan)"
            />
            <Circle
              cx={glowMagentaX}
              cy={glowMagentaY}
              r={95 + volume * 25}
              fill="url(#glowMagenta)"
            />
            <Circle
              cx={glowCoreX}
              cy={glowCoreY}
              r={70 + volume * 30}
              fill="url(#glowCore)"
            />

            {/* Dense 3D Vertices/Dots */}
            {gridDots}
=======
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
>>>>>>> 3f2016b2a9532c19ce8e3ec1eadefda1d9934699

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
