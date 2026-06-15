import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity, Easing, Platform } from 'react-native';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceOrbProps {
  state: OrbState;
  onPress: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ state, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const ripple1Anim = useRef(new Animated.Value(0)).current;
  const ripple2Anim = useRef(new Animated.Value(0)).current;

  // Soundwave animations for speaking state
  const barHeights = useRef([
    new Animated.Value(15),
    new Animated.Value(35),
    new Animated.Value(20),
    new Animated.Value(40),
    new Animated.Value(15),
  ]).current;

  useEffect(() => {
    // 1. Idle Breathing Animation
    let breathing: Animated.CompositeAnimation | null = null;
    if (state === 'idle') {
      breathing = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      breathing.start();
    } else {
      scaleAnim.setValue(1);
    }

    // 2. Listening Ripple Animation
    let rippleLoop: Animated.CompositeAnimation | null = null;
    if (state === 'listening') {
      ripple1Anim.setValue(0);
      ripple2Anim.setValue(0);
      rippleLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(ripple1Anim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(900),
            Animated.timing(ripple2Anim, {
              toValue: 1,
              duration: 1800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      rippleLoop.start();
    }

    // 3. Processing Rotation Animation
    let rotationLoop: Animated.CompositeAnimation | null = null;
    if (state === 'processing') {
      rotateAnim.setValue(0);
      rotationLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotationLoop.start();
    }

    // 4. Speaking Equalizer Animation
    let speakingLoop: Animated.CompositeAnimation | null = null;
    if (state === 'speaking') {
      const animateBar = (bar: Animated.Value, min: number, max: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: Math.random() * (max - min) + min,
              duration: Math.random() * 150 + 100,
              easing: Easing.linear,
              useNativeDriver: false, // height cannot use native driver
            }),
            Animated.timing(bar, {
              toValue: Math.random() * (max - min) + min,
              duration: Math.random() * 150 + 100,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const animations = barHeights.map((bar, i) => {
        const heights = [
          [10, 45],
          [20, 65],
          [10, 50],
          [25, 70],
          [10, 40],
        ];
        return animateBar(bar, heights[i][0], heights[i][1]);
      });

      speakingLoop = Animated.parallel(animations);
      speakingLoop.start();
    } else {
      // Reset heights
      barHeights.forEach((bar) => bar.setValue(15));
    }

    // Cleanup
    return () => {
      if (breathing) breathing.stop();
      if (rippleLoop) rippleLoop.stop();
      if (rotationLoop) rotationLoop.stop();
      if (speakingLoop) speakingLoop.stop();
    };
  }, [state]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getOrbColor = () => {
    switch (state) {
      case 'listening':
        return '#06b6d4'; // teal-400
      case 'processing':
        return '#0d9488'; // teal-600
      case 'speaking':
        return '#0891b2'; // cyan-600
      default:
        return '#14b8a6'; // teal-500
    }
  };

  const getRippleStyle = (anim: Animated.Value) => {
    return {
      transform: [
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 2],
          }),
        },
      ],
      opacity: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 0],
      }),
    };
  };

  return (
    <View style={styles.container}>
      {/* Ripple Rings for Listening */}
      {state === 'listening' && (
        <>
          <Animated.View style={[styles.ripple, getRippleStyle(ripple1Anim), { borderColor: '#06b6d4' }]} />
          <Animated.View style={[styles.ripple, getRippleStyle(ripple2Anim), { borderColor: '#22d3ee' }]} />
        </>
      )}

      {/* Main Orb Button */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchTarget}>
        <Animated.View
          style={[
            styles.orb,
            {
              backgroundColor: getOrbColor(),
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {state === 'idle' && (
            <View style={styles.innerContent}>
              {/* Mic Icon Symbol (drawn with CSS styles to avoid package dependency) */}
              <View style={styles.micIconHead} />
              <View style={styles.micIconStand} />
              <Text style={styles.tapText}>TAP TO TALK</Text>
            </View>
          )}

          {state === 'listening' && (
            <View style={styles.innerContent}>
              <View style={[styles.micIconHead, { backgroundColor: '#fff' }]} />
              <View style={[styles.micIconStand, { backgroundColor: '#fff' }]} />
              <Text style={[styles.tapText, styles.activeText]}>LISTENING...</Text>
            </View>
          )}

          {state === 'processing' && (
            <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: rotation }] }]}>
              <View style={[styles.spinnerDot, { top: 0, left: 26 }]} />
              <View style={[styles.spinnerDot, { bottom: 0, left: 26 }]} />
              <View style={[styles.spinnerDot, { top: 26, left: 0 }]} />
              <View style={[styles.spinnerDot, { top: 26, right: 0 }]} />
              <Text style={[styles.tapText, { position: 'absolute', bottom: -15, width: 120, textAlign: 'center' }]}>PROCESSING</Text>
            </Animated.View>
          )}

          {state === 'speaking' && (
            <View style={styles.equalizerContainer}>
              {barHeights.map((barHeight, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.equalizerBar,
                    {
                      height: barHeight,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
  },
  touchTarget: {
    zIndex: 10,
  },
  orb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  ripple: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIconHead: {
    width: 18,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  micIconStand: {
    width: 26,
    height: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#ffffff',
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    marginTop: -8,
    alignItems: 'center',
  },
  tapText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 12,
  },
  activeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // Spinner / Processing Style
  spinnerContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    top: 0,
  },
  // Equalizer / Speaking Style
  equalizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 60,
    height: 80,
  },
  equalizerBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
});
