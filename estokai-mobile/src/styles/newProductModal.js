import { StyleSheet } from 'react-native';
import { rem } from './typography';
import { getTheme } from './theme';

const createStyles = (isDark, fontScale = undefined) => {
  const theme = getTheme(isDark);
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: 'rgba(0,0,0,0.45)' },
    modal: { width: '100%', maxWidth: 400, height: '92%', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBackground },
    handle: { alignSelf: 'center', width: 58, height: 4, borderRadius: 4, marginBottom: 18, backgroundColor: isDark ? '#4A4A50' : '#D6D9E0' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, title: { color: theme.textPrimary, fontSize: rem(20, fontScale), fontWeight: '700' }, closeIcon: { color: theme.textSecondary },
    content: { paddingBottom: 18 }, sectionTitle: { color: theme.primary, fontSize: rem(10, fontScale), fontWeight: '700', marginTop: 4, marginBottom: 13 }, label: { color: theme.textSecondary, fontSize: rem(9, fontScale), fontWeight: '700', marginBottom: 7, marginTop: 10 }, required: { color: '#FF4D70' },
    input: { height: 36, borderRadius: 7, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 11, color: theme.textPrimary, fontSize: rem(11, fontScale), backgroundColor: isDark ? '#1C1C20' : '#F9FAFC' }, descriptionInput: { height: 76, paddingTop: 10, paddingBottom: 10 }, placeholder: { color: theme.textSecondary },
    imagePicker: { height: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 7, backgroundColor: isDark ? '#1C1C20' : '#F9FAFC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', overflow: 'hidden' }, primaryIcon: { color: theme.primary }, imagePickerText: { color: theme.primary, fontWeight: '700', fontSize: rem(10, fontScale), marginLeft: 5 }, imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    supplierRow: { flexDirection: 'row', gap: 7 }, supplierSelect: { flex: 1, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderWidth: 1, borderColor: theme.border, borderRadius: 7, backgroundColor: isDark ? '#1C1C20' : '#F9FAFC' }, supplierSelectText: { color: theme.textSecondary, fontSize: rem(10, fontScale) }, addSupplierButton: { width: 36, height: 36, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary }, supplierMenu: { borderWidth: 1, borderColor: theme.border, borderRadius: 7, marginTop: 5, overflow: 'hidden', backgroundColor: theme.cardBackground }, supplierOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: theme.border }, supplierOptionText: { color: theme.textPrimary, fontSize: rem(11, fontScale) },
    emptyText: { color: theme.textSecondary, fontSize: rem(10, fontScale), marginTop: 14 }, linkedList: { marginTop: 10, gap: 6 }, linkedSupplier: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 9, borderRadius: 7, backgroundColor: isDark ? '#1C1C20' : '#F9FAFC' }, linkedSupplierText: { color: theme.textPrimary, fontSize: rem(11, fontScale) },
    footer: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14 }, createButton: { height: 42, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09C96B' }, createButtonText: { color: '#FFFFFF', fontSize: rem(11, fontScale), fontWeight: '700' }, footerHelp: { textAlign: 'center', color: theme.textSecondary, fontSize: rem(8, fontScale), marginTop: 10 },
  });
};
export const getStyles = (isDark, fontScale = undefined) => createStyles(isDark, fontScale);
