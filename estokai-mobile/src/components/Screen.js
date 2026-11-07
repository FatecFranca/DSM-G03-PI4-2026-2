import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getStyles } from '../styles/shared';
import { getTheme } from '../styles/theme';
import BottomNavigation from './BottomNavigation';

export default function Screen({ children, activeRoute = undefined, onSelectRoute = undefined, style = undefined, variant = 'app', scrollable = false }) {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode, variant);
  const styles = getStyles(isDarkMode);

  /** @type {import('react-native-safe-area-context').Edges} */
  const safeAreaEdges = activeRoute ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right'];

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {scrollable ? (
        <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={safeAreaEdges}>
          <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.select({ ios: 'padding', android: 'height' })}
          >
            <ScrollView
              contentContainerStyle={[style, styles.keyboardScrollableContent]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={[styles.container, style]}
          edges={safeAreaEdges}>
          {children}
        </SafeAreaView>
      )}
      {activeRoute && <BottomNavigation activeRoute={activeRoute} onSelect={onSelectRoute} />}
    </View>
  );
}
