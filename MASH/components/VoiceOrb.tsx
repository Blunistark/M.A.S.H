import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import Svg, { Defs, Path, Circle, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Audio } from 'expo-av';
import { Theme } from '../theme';

interface VoiceOrbProps {
  onPress: () => void;
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
}

// Spherical grid segmentation
const LAT_COUNT = 15;
const LNG_COUNT = 20;

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

// Scattered glowing particles around the orb perimeter
const particleData = Array.from({ length: 45 }).map((_, idx) => {
  const theta = Math.random() * Math.PI - Math.PI / 2;
  const phi = Math.random() * 2 * Math.PI;
  return {
    nx: Math.cos(theta) * Math.sin(phi),
    ny: Math.sin(theta),
    nz: Math.cos(theta) * Math.cos(phi),
    rOffset: 25 + Math.random() * 25,
    speed: 1.5 + Math.random() * 2,
    size: 1.0 + Math.random() * 2.2,
    color: idx % 3 === 0 ? '#00BFFF' : idx % 3 === 1 ? '#FF00FF' : '#ffffff',
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
      // We only request mic/metering if the state is 'listening' to avoid locks
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
                // Map [-60dB, 0dB] range to [0, 1] volume
                const minDb = -60;
                let normVol = (db - minDb) / -minDb;
                if (normVol < 0) normVol = 0;
                if (normVol > 1) normVol = 1;
                
                setVolume(v => v * 0.7 + normVol * 0.3); // smooth dampening
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
      // Clear real-time mic tracking volume
      setVolume(0);
      
      // Simulate speech/processing volume updates
      simInterval = setInterval(() => {
        const now = Date.now() / 1000;
        if (state === 'speaking') {
          // Cadence of human speech envelope
          const speakVol = 0.15 + Math.abs(Math.sin(now * 7.5) * Math.cos(now * 3.1)) * 0.45;
          setVolume(speakVol);
        } else if (state === 'processing') {
          // Fast vibration
          const procVol = 0.05 + Math.sin(now * 18) * 0.03;
          setVolume(procVol);
        } else {
          // Idle calm breathing state
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
    const soundScale = 1.0 + volume * 0.12; // scales up by 12% at peak volume
    
    const xp = centerX + x2 * scale * soundScale;
    const yp = centerY + y2 * scale * soundScale;
    
    projected[v.i][v.j] = { x: xp, y: yp, z: z2 };
  });

  // 5. Construct latitude UV grid paths
  let latPath = '';
  for (let i = 0; i <= LAT_COUNT; i++) {
    const start = projected[i][0];
    latPath += ` M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
    for (let j = 1; j < LNG_COUNT; j++) {
      const pt = projected[i][j];
      latPath += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }
    latPath += ` L ${start.x.toFixed(1)} ${start.y.toFixed(1)}`; // Close latitude ring
  }

  // 6. Construct longitude UV grid paths
  let lngPath = '';
  for (let j = 0; j < LNG_COUNT; j++) {
    const start = projected[0][j];
    lngPath += ` M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`;
    for (let i = 1; i <= LAT_COUNT; i++) {
      const pt = projected[i][j];
      lngPath += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }
  }

  // 7. Project and render perimeter particles
  const particleNodes = particleData.map((p, idx) => {
    // Pulse and expand radius offset based on sound volume
    const drift = Math.sin(time * p.speed + idx) * 5 + volume * 20;
    const pR = R + p.rOffset + drift;
    
    const px = pR * p.nx;
    const py = pR * p.ny;
    const pz = pR * p.nz;
    
    // Rotate Y
    const px1 = px * Math.cos(rotY) - pz * Math.sin(rotY);
    const pz1 = px * Math.sin(rotY) + pz * Math.cos(rotY);
    const py1 = py;
    
    // Rotate X
    const py2 = py1 * Math.cos(rotX) - pz1 * Math.sin(rotX);
    const pz2 = py1 * Math.sin(rotX) + pz1 * Math.cos(rotX);
    const px2 = px1;
    
    // Perspective Projection
    const scale = cameraDistance / (cameraDistance + pz2);
    const soundScale = 1.0 + volume * 0.12;
    
    const pxp = centerX + px2 * scale * soundScale;
    const pyp = centerY + py2 * scale * soundScale;
    
    // Volumetric depth cue: Fade particles behind the sphere
    const depthOpacity = (pz2 + 120) / 240; // 0 (back) to 1 (front)
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

  return (
    <View style={styles.container}>
      {/* Tap area to trigger Voice input / Speech recognition */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touchArea}>
        <View style={styles.canvasWrapper}>
          <Svg width={300} height={300} viewBox="0 0 300 300">
            <Defs>
              {/* Electric blue to hot magenta wireframe gradient */}
              <LinearGradient id="meshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00BFFF" stopOpacity={0.95} />
                <Stop offset="50%" stopColor="#8A2BE2" stopOpacity={0.8} />
                <Stop offset="100%" stopColor="#FF00FF" stopOpacity={0.95} />
              </LinearGradient>
              
              {/* Ambient radial halo background glow */}
              <RadialGradient id="glowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#8A2BE2" stopOpacity={0.4 + volume * 0.2} />
                <Stop offset="45%" stopColor="#00BFFF" stopOpacity={0.15 + volume * 0.1} />
                <Stop offset="100%" stopColor="#06061A" stopOpacity={0} />
              </RadialGradient>
            </Defs>

            {/* Back glowing halo */}
            <Circle
              cx="150"
              cy="150"
              r={95 + volume * 25}
              fill="url(#glowGrad)"
            />

            {/* UV Latitudes & Longitudes Wireframe Mesh */}
            <Path
              d={latPath}
              fill="none"
              stroke="url(#meshGrad)"
              strokeWidth={0.8}
              opacity={0.85 + volume * 0.15}
            />
            <Path
              d={lngPath}
              fill="none"
              stroke="url(#meshGrad)"
              strokeWidth={0.8}
              opacity={0.85 + volume * 0.15}
            />

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
