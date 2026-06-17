import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import Svg, { Defs, Circle, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Audio } from 'expo-av';
import { Theme } from '../theme';

interface VoiceOrbProps {
  onPress: () => void;
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
}

// Spherical grid segmentation (dense for rich point-cloud representation)
const LAT_COUNT = 22;
const LNG_COUNT = 32;

// Base sphere coordinates (latitude-longitude grid)
const baseGrid: { nx: number; ny: number; nz: number; i: number; j: number }[] = [];
for (let i = 0; i <= LAT_COUNT; i++) {
  const lat = (i / LAT_COUNT) * Math.PI - Math.PI / 2;
  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  
  for (let j = 0; j < LNG_COUNT; j++) {
    const lng = (j / LNG_COUNT) * 2 * Math.PI;
    const cosLng = Math.cos(lng);
    const sinLng = Math.sin(lng);
    
    baseGrid.push({
      nx: cosLat * sinLng,
      ny: sinLat,
      nz: cosLat * cosLng,
      i,
      j,
    });
  }
}

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

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ onPress, state = 'idle' }) => {
  const [time, setTime] = useState(0);
  const [volume, setVolume] = useState(0); // 0 to 1
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalIdRef = useRef<any>(null);

  // 1. Tick animation frame loop (~60fps)
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTime(t => t + 0.016);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 2. Manage Microphone Recording & Audio Metering with expo-av
  useEffect(() => {
    let isMounted = true;

    async function startRecording() {
      if (state !== 'listening') {
        if (recordingRef.current) {
          stopRecording();
        }
        return;
      }

      try {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          console.log('VoiceOrb: Audio permission not granted');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          {
            android: {
              extension: '.m4a',
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
            },
            ios: {
              extension: '.m4a',
              outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
              audioQuality: Audio.IOSAudioQuality.MEDIUM,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {},
          },
          () => {},
          50 // updateMeteringIntervalMillis
        );

        if (!isMounted) {
          await recording.stopAndUnloadAsync();
          return;
        }

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

    return () => {
      isMounted = false;
      stopRecording();
    };
  }, [state]);

  const stopRecording = async () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
  };

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

  // Base configurations
  const R = 75; // Sphere base radius
  const cameraDistance = 300;
  const centerX = 150;
  const centerY = 150;

  // Rotation parameters (rotates faster with sound)
  const baseRotSpeed = state === 'idle' ? 0.35 : 0.7;
  const rotY = time * baseRotSpeed + volume * 0.8;
  const rotX = time * 0.12;

  // Amplitude of surface deformations
  let baseAmp = 3;
  if (state === 'listening') baseAmp = 12;
  else if (state === 'speaking') baseAmp = 10;
  else if (state === 'processing') baseAmp = 5;

  const deformationAmp = baseAmp + volume * 24;

  // 4. Transform and project grid vertices
  const projected: { x: number; y: number; z: number }[][] = [];
  for (let i = 0; i <= LAT_COUNT; i++) {
    projected[i] = [];
  }

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

            {/* Scattered escaping particles perimeter */}
            {particleNodes}
          </Svg>
        </View>
      </TouchableOpacity>

      {/* Monospaced, spaced out status badge */}
      <View style={styles.statusBadge}>
        {state === 'idle' && (
          <Text style={styles.statusText}>M.A.S.H</Text>
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
  canvasWrapper: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
    width: '100%',
  },
  statusText: {
    fontFamily: Theme.typography.fontFamilyBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
}));
