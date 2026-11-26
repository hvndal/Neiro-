import { NativeTabs } from 'expo-router/native-tabs';
import { NowPlaying } from '../../components/NowPlaying';
import { usePlayer } from '../../state/player';
import { fonts, palette } from '../../theme/tokens';

/**
 * The system tab bar, not a drawn one: on iOS 26 it is the real floating Liquid Glass bar (adaptive tint,
 * minimise on scroll, SF Symbols, Dynamic Type); on Android it is a Material navigation bar.
 * First launch lands on Play (first trigger). No onboarding, no account (handover §3).
 */
export default function TabsLayout() {
  const { started } = usePlayer();
  return (
    <NativeTabs tintColor={palette.ink} labelStyle={{ fontFamily: fonts.bold }}>
      <NativeTabs.Trigger name="play">
        <NativeTabs.Trigger.Label>play</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'dial.low', selected: 'dial.medium.fill' }} md="graphic_eq" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="study">
        <NativeTabs.Trigger.Label>study</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'timer', selected: 'timer' }} md="timer" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="programs">
        <NativeTabs.Trigger.Label>programs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} md="format_list_bulleted" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="customise">
        <NativeTabs.Trigger.Label>customise</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'slider.horizontal.3', selected: 'slider.horizontal.3' }} md="tune" />
      </NativeTabs.Trigger>
      {started && (
        <NativeTabs.BottomAccessory>
          <NowPlaying />
        </NativeTabs.BottomAccessory>
      )}
    </NativeTabs>
  );
}
