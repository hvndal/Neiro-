import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { palette } from '../theme/tokens';
import { GlassPill } from './GlassPill';

/** Round glass back button (Programs, Customise). Tabs have no history, so it returns to Play. */
export function BackButton() {
  return (
    <GlassPill size={44} accessibilityLabel="Back" onPress={() => router.navigate('/play')} style={{ alignSelf: 'flex-start' }}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={palette.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 5l-7 7 7 7" />
      </Svg>
    </GlassPill>
  );
}
