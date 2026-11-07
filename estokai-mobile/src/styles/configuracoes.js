import { StyleSheet } from 'react-native';
import { rem } from './typography';
import { getTheme } from './theme';
import { spacing } from './spacing';

const accent = '#8B5CF6';

const createStyles = (isDark, fontScale = undefined) => {
  const theme = getTheme(isDark);
  return StyleSheet.create({
    scrollContent: { flexGrow: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
    content: { width: '100%', maxWidth: 520, alignSelf: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerCopy: { flex: 1, paddingRight: spacing.md },
    eyebrow: { color: theme.primary, fontSize: rem(11, fontScale), fontWeight: '700', marginBottom: 12 },
    title: { color: theme.textPrimary, fontSize: rem(28, fontScale), fontWeight: '700', lineHeight: rem(34, fontScale), marginBottom: 8 },
    subtitle: { color: theme.textSecondary, fontSize: rem(13, fontScale), lineHeight: rem(20, fontScale), marginBottom: 32 },
    backButton: {
      width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border, borderRadius: 14,
    },
    backIcon: { color: theme.textPrimary },
    sectionLabel: { color: theme.textSecondary, fontSize: rem(10, fontScale), fontWeight: '700', marginBottom: 10, marginLeft: 2 },
    card: {
      backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border,
      borderRadius: 14, padding: 14, marginBottom: 36,
    },
    cardTitle: { color: theme.textPrimary, fontSize: rem(16, fontScale), fontWeight: '700', marginBottom: 8 },
    cardDescription: { color: theme.textSecondary, fontSize: rem(12, fontScale), lineHeight: rem(18, fontScale), marginBottom: 20 },
    themeOptions: { flexDirection: 'row', gap: 10 },
    themeOption: {
      flex: 1, minHeight: 82, borderRadius: 11, borderWidth: 1, borderColor: theme.border,
      backgroundColor: isDark ? '#28282E' : '#F5F5F7', padding: 12, justifyContent: 'space-between',
    },
    themeOptionSelected: { borderColor: accent, backgroundColor: isDark ? '#2C2141' : '#F0EAFE' },
    themeOptionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    themeOptionLabel: { color: theme.textPrimary, fontSize: rem(13, fontScale), fontWeight: '700' },
    themeOptionCaption: { color: theme.textSecondary, fontSize: rem(11, fontScale) },
    themeOptionCaptionSelected: { color: accent, fontWeight: '700' },
    optionIcon: { color: isDark ? '#C4A3FF' : accent },
    selectedIcon: { color: isDark ? '#C4A3FF' : theme.primary },
    textScaleSection: { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 20, paddingTop: 18 },
    textScaleControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    textScaleButton: { width: 38, height: 38, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    textScaleButtonDisabled: { opacity: 0.35 }, textScaleIcon: { color: theme.textPrimary }, textScaleValue: { color: theme.textPrimary, fontSize: rem(14, fontScale), fontWeight: '700' },
    logoutCard: {
      minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border,
      borderRadius: 14, padding: 14, marginBottom: 36,
    },
    logoutTitle: { color: '#FF4D70', fontSize: rem(15, fontScale), fontWeight: '700', marginBottom: 8 },
    logoutDescription: { color: theme.textSecondary, fontSize: rem(12, fontScale) },
    logoutIcon: { color: '#FF4D70', transform: [{ rotate: '45deg' }] },
    infoCard: {
      backgroundColor: isDark ? '#121216' : '#F7F7F8', borderWidth: 1, borderColor: theme.border,
      borderRadius: 11, padding: 14,
    },
    infoTitle: { color: theme.textSecondary, fontSize: rem(10, fontScale), fontWeight: '700', marginBottom: 9 },
    infoDescription: { color: theme.textSecondary, fontSize: rem(12, fontScale) },
  });
};

export const getStyles = (isDark, fontScale = undefined) => createStyles(isDark, fontScale);
