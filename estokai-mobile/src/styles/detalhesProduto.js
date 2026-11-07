import { StyleSheet } from 'react-native';
import { rem } from './typography';
import { getTheme } from './theme';
import { spacing } from './spacing';

const createStyles = (isDark, fontScale = undefined) => {
  const theme = getTheme(isDark);
  return StyleSheet.create({
    content: { padding: spacing.md, paddingBottom: spacing.xl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }, headerCopy: { flex: 1, paddingRight: spacing.md },
    eyebrow: { color: theme.primary, fontSize: rem(11, fontScale), fontWeight: '700', letterSpacing: 0.8, marginBottom: 7 }, title: { color: theme.textPrimary, fontSize: rem(27, fontScale), fontWeight: '700', flexShrink: 1 },
    backButton: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.cardBackground }, backIcon: { color: theme.textPrimary },
    imageContainer: { height: 250, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border, marginBottom: 18, backgroundColor: isDark ? '#1A1A1E' : '#F7F7F9' }, image: { width: '100%', height: '100%', resizeMode: 'cover' }, imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' }, placeholderIcon: { color: theme.textSecondary }, placeholderText: { color: theme.textSecondary, fontSize: rem(12, fontScale), marginTop: 10 },
    productHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }, productName: { color: theme.textPrimary, fontSize: rem(23, fontScale), fontWeight: '700', marginBottom: 6 }, productCode: { color: theme.textSecondary, fontSize: rem(13, fontScale) },
    priceCard: { flexDirection: fontScale > 1.25 ? 'column' : 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBackground, borderRadius: 14, padding: spacing.md, marginBottom: 28 }, priceDivider: fontScale > 1.25 ? { width: '100%', height: 1, backgroundColor: theme.border, marginVertical: spacing.md } : { width: 1, alignSelf: 'stretch', backgroundColor: theme.border, marginHorizontal: spacing.lg }, priceLabel: { color: theme.textSecondary, fontSize: rem(10, fontScale), fontWeight: '700', marginBottom: 8 }, price: { color: theme.primary, fontSize: rem(21, fontScale), fontWeight: '800' }, minimum: { color: theme.textPrimary, fontSize: rem(18, fontScale), fontWeight: '700' },
    sectionTitle: { color: theme.textSecondary, fontSize: rem(10, fontScale), fontWeight: '700', marginBottom: 10 }, infoCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: spacing.md, backgroundColor: theme.cardBackground }, detailRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border }, detailLabel: { color: theme.textSecondary, fontSize: rem(11, fontScale), marginBottom: 7 }, detailValue: { color: theme.textPrimary, fontSize: rem(14, fontScale), fontWeight: '600' },
    editButton: { height: 48, borderRadius: 10, backgroundColor: theme.primary, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, editButtonText: { color: '#FFFFFF', fontSize: rem(14, fontScale), fontWeight: '700' },
    deleteButton: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#FF4D70', marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, deleteButtonDisabled: { opacity: 0.55 }, deleteButtonText: { color: '#FF4D70', fontSize: rem(14, fontScale), fontWeight: '700' },
  });
};
export const getStyles = (isDark, fontScale = undefined) => createStyles(isDark, fontScale);
