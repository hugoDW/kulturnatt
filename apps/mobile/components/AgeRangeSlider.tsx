import React, { useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
};

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

export function clampMinAgeRange(
  current: [number, number],
  nextMin: number,
): [number, number] {
  const [, currentMax] = current;
  return [Math.min(currentMax, nextMin), currentMax];
}

export function clampMaxAgeRange(
  current: [number, number],
  nextMax: number,
): [number, number] {
  const [currentMin] = current;
  return [currentMin, Math.max(currentMin, nextMax)];
}

export default function AgeRangeSlider({ min, max, value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const valueRef = useRef<[number, number]>(value);
  valueRef.current = value;

  function handleLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.width;
    setWidth(next);
    widthRef.current = next;
  }

  function positionToValue(position: number) {
    const trackWidth = widthRef.current - THUMB_SIZE;
    if (trackWidth <= 0) return min;
    const clamped = Math.max(0, Math.min(trackWidth, position));
    const ratio = clamped / trackWidth;
    return Math.round(min + ratio * (max - min));
  }

  function valueToPosition(amount: number) {
    const trackWidth = width - THUMB_SIZE;
    if (trackWidth <= 0) return 0;
    const ratio = (amount - min) / (max - min);
    return ratio * trackWidth;
  }

  const minResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => {
        const [, currentMax] = valueRef.current;
        const startPosition = valueToPosition(valueRef.current[0]);
        const nextPosition = startPosition + gesture.dx;
        const nextValue = clampMinAgeRange(
          valueRef.current,
          positionToValue(nextPosition),
        )[0];
        if (nextValue !== valueRef.current[0]) {
          onChange([nextValue, currentMax]);
        }
      },
    }),
  ).current;

  const maxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (
        _event: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => {
        const [currentMin] = valueRef.current;
        const startPosition = valueToPosition(valueRef.current[1]);
        const nextPosition = startPosition + gesture.dx;
        const nextValue = clampMaxAgeRange(
          valueRef.current,
          positionToValue(nextPosition),
        )[1];
        if (nextValue !== valueRef.current[1]) {
          onChange([currentMin, nextValue]);
        }
      },
    }),
  ).current;

  const minLeft = valueToPosition(value[0]);
  const maxLeft = valueToPosition(value[1]);

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{value[0]}</Text>
        <Text style={styles.valueText}>{value[1]}</Text>
      </View>

      <View style={styles.trackArea} onLayout={handleLayout}>
        <View style={styles.track} />
        {width > 0 && (
          <>
            <View
              style={[
                styles.trackFill,
                {
                  left: minLeft + THUMB_SIZE / 2,
                  width: Math.max(0, maxLeft - minLeft),
                },
              ]}
            />
            <View
              {...minResponder.panHandlers}
              style={[styles.thumb, { left: minLeft }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            />
            <View
              {...maxResponder.panHandlers}
              style={[styles.thumb, { left: maxLeft }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            />
          </>
        )}
      </View>

      <View style={styles.boundsRow}>
        <Text style={styles.boundsText}>{min}</Text>
        <Text style={styles.boundsText}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4 },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  valueText: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "800",
    color: "#25364A",
  },
  trackArea: {
    height: THUMB_SIZE,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "#E9ECEF",
  },
  trackFill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: "#6C5CE7",
  },
  thumb: {
    position: "absolute",
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#6C5CE7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  boundsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  boundsText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: "#9AA1AA",
  },
});
