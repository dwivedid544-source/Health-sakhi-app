import React, { useRef } from 'react';
import { StyleSheet, Animated, PanResponder } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { COLORS } from '../theme/theme';

export default function DraggableIntroAIBtn({ onPress }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Drag thresholds to avoid accidental taps
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        // Trigger press if gesture movement is tiny
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          onPress();
        }
      }
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.floatingFAB,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <Sparkles size={26} color={COLORS.white} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingFAB: {
    position: 'absolute',
    bottom: 120, // offset slightly higher to avoid overlap with bottom tab bar or navigation triggers
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EC4899', // Pink colour
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 9999,
  },
});
