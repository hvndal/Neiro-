import { Tabs } from 'expo-router/js-tabs';
import { WebTabBar } from '../../components/WebTabBar';

// Web preview layout (not a shipping target). Native platforms use the system tab bar in _layout.tsx.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <WebTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="play" />
      <Tabs.Screen name="study" />
      <Tabs.Screen name="programs" />
      <Tabs.Screen name="customise" />
    </Tabs>
  );
}
