import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NotesListScreen from '@screens/notes/NotesListScreen';
import NoteDetailScreen from '@screens/notes/NoteDetailScreen';
import NoteEditorScreen from '@screens/notes/NoteEditorScreen';
import SettingsScreen from '@screens/notes/SettingsScreen';
import ChangePasswordScreen from '@screens/notes/ChangePasswordScreen';
import { COLORS, TYPOGRAPHY } from '@constants';

export type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
  NoteEditor: { noteId?: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  ChangePassword: undefined;
};

export type MainTabParamList = {
  NotesTab: undefined;
  SettingsTab: undefined;
};

const NotesStack = createStackNavigator<NotesStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const NotesNavigator: React.FC = () => {
  return (
    <NotesStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A1628' },
      }}
    >
      <NotesStack.Screen name="NotesList" component={NotesListScreen} />
      <NotesStack.Screen name="NoteDetail" component={NoteDetailScreen} />
      <NotesStack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
    </NotesStack.Navigator>
  );
};

const SettingsNavigator: React.FC = () => {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A1628' },
      }}
    >
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
    </SettingsStack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<MainTabParamList, keyof MainTabParamList> }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: string;

          if (route.name === 'NotesTab') {
            iconName = 'note-multiple-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = 'cog-outline';
          } else {
            iconName = 'help';
          }

          return (
            <MaterialCommunityIcons name={iconName as any} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.primaryBackground,
          borderTopColor: COLORS.elevatedSurface,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...TYPOGRAPHY.caption,
          marginTop: 4,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="NotesTab"
        component={NotesNavigator}
        options={{
          title: 'Notes',
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
