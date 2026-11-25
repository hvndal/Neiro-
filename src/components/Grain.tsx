import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const TILE = 512; // assets/grain.png is 512×512 and tiles seamlessly

/**
 * Film grain over a wash. The texture is mean-grey, so `overlay` leaves the colour balance alone.
 * Tiles are laid out by hand because `resizeMode="repeat"` is not reliable across iOS, Android and web.
 */
export function Grain({ opacity = 0.3 }: { opacity?: number }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const cols = Math.ceil(size.w / TILE);
  const rows = Math.ceil(size.h / TILE);
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <Image
          key={`${r}-${c}`}
          accessible={false}
          source={require('../../assets/grain.png')}
          style={{ position: 'absolute', left: c * TILE, top: r * TILE, width: TILE, height: TILE }}
        />,
      );
    }
  }
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity, mixBlendMode: 'overlay' }]}
    >
      {tiles}
    </View>
  );
}
