import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.card,
          borderTopWidth: 2,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.deep,
        tabBarInactiveTintColor: Colors.accent,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'home' as IoniconsName} size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'search' as IoniconsName} size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'add-circle' as IoniconsName} size={size + 5} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'chatbubble-ellipses' as IoniconsName} size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name={'newspaper-variant-outline' as MCIName} size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={'person' as IoniconsName} size={size + 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}