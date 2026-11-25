import { Tabs } from 'expo-router/js-tabs';
import { FloatingTabBar } from '../../components/FloatingTabBar';

// First launch lands on Play (first screen listed; pink preloaded). No onboarding, no account (handover §3).
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="play" />
      <Tabs.Screen name="study" />
      <Tabs.Screen name="programs" />
      <Tabs.Screen name="customise" />
    </Tabs>
  );
}
