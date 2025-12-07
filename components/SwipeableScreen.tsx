import React, { useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

interface SwipeableScreenProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  backgroundColor?: string;
  showSwipeIndicator?: boolean;
}

export default function SwipeableScreen({ 
  children, 
  onSwipeRight,
  backgroundColor = '#1a0a2e',
  showSwipeIndicator = true 
}: SwipeableScreenProps) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only track right swipes (dx > 0)
        if (gestureState.dx > 0) {
          // No animation during move - just track the gesture
          return;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped right more than 50px, trigger the callback
        if (gestureState.dx > 50) {
          if (onSwipeRight) {
            onSwipeRight();
          }
        }
      },
    })
  ).current;

  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor,
          flex: 1,
        }
      ]}
      {...panResponder.panHandlers}
    >
      {showSwipeIndicator && <View style={styles.swipeIndicator} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  swipeIndicator: {
    position: 'absolute',
    left: 20,
    top: '50%',
    width: 4,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
});
