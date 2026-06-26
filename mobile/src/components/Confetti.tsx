import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLORS = ['#FF4D6D', '#FBBF24', '#2DD4BF', '#8B5CF6', '#2563EB', '#34D399', '#F9A8D4', '#F97316'];

/** Lightweight confetti burst built purely with Animated — no extra deps. */
export function Confetti({ count = 70 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * width,
      size: 7 + Math.random() * 9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 700,
      duration: 2400 + Math.random() * 2000,
      sway: (Math.random() * 2 - 1) * 70,
      spin: (Math.random() < 0.5 ? 1 : -1) * (1 + Math.random() * 2),
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const anims = pieces.map((p) =>
      Animated.timing(p.anim, {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    Animated.stagger(8, anims).start();
  }, [pieces]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {pieces.map((p, i) => {
        const translateY = p.anim.interpolate({ inputRange: [0, 1], outputRange: [-50, height + 50] });
        const translateX = p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.sway, 0] });
        const rotate = p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin * 360}deg`] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ layer: { overflow: 'hidden', zIndex: 10 } });
