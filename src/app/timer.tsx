import { Switch, Text } from 'react-native';
import { Group, Row, Sheet } from '../components/Sheet';
import { player, usePlayer } from '../state/player';
import { fonts, palette } from '../theme/tokens';

const OPTIONS: { label: string; minutes: number | null }[] = [
  { label: 'off', minutes: null },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: 'all night', minutes: 480 },
];

/** Sleep timer sheet (native form sheet, fits its content). The countdown runs while sound plays. */
export default function Timer() {
  const { sleepMinutes, sleepFade } = usePlayer();
  return (
    <Sheet title="sleep timer" subtitle={sleepFade ? 'the sound fades out over the last minute' : 'the sound stops when the time is up'}>
      <Group>
        {OPTIONS.map((o, i) => (
          <Row key={o.label} label={o.label} selected={sleepMinutes === o.minutes} last={i === OPTIONS.length - 1} onPress={() => player.setSleep(o.minutes)} />
        ))}
      </Group>
      <Group>
        <Row
          label="fade out"
          last
          right={
            <Switch
              accessibilityLabel="fade out"
              value={sleepFade}
              onValueChange={player.setSleepFade}
              trackColor={{ true: palette.ink, false: 'rgba(21,23,29,0.2)' }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </Group>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: palette.muted, textAlign: 'center' }}>neiro keeps playing with the screen locked</Text>
    </Sheet>
  );
}
