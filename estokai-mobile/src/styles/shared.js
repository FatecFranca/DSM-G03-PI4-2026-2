import { StyleSheet } from 'react-native';
import { rem } from './typography';
import { getTheme } from './theme';
import { spacing } from './spacing';

const createStyles = (isDark, fontScale = undefined) => {
  const theme = getTheme(isDark, 'app');
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    keyboardScrollableContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    tagCatalogo: {
      fontSize: rem(11, fontScale),
      fontWeight: 'bold',
      color: theme.primary,
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    titulo: {
      fontSize: rem(26, fontScale),
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitulo: {
      fontSize: rem(13, fontScale),
      color: theme.textSecondary,
      marginBottom: spacing.md,
    },
    botaoTema: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.sm,
      borderRadius: 8,
    },
    botaoConfiguracoes: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    botaoSair: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.sm,
      borderRadius: 8,
      marginLeft: spacing.sm,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: rem(14, fontScale),
      color: theme.textPrimary,
      marginLeft: spacing.sm,
    },
    filtrosContainer: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    filtroBotao: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: spacing.sm,
      backgroundColor: theme.cardBackground,
    },
    filtroBotaoAtivo: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filtroTexto: {
      fontSize: rem(13, fontScale),
      color: theme.textSecondary,
      fontWeight: '600',
    },
    filtroTextoAtivo: {
      color: theme.white,
    },
    textoBotaoNovo: {
      color: theme.white,
      fontSize: rem(15, fontScale),
      fontWeight: 'bold',
    },
    listaContainer: {
      // A lista rola por trás da barra; este respiro permite revelar o último card inteiro.
      paddingBottom: 112,
    },
    paginationContainer: {
      padding: spacing.md,
      marginBottom: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
    },
    paginationActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    paginationButton: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    paginationButtonDisabled: {
      opacity: 0.4,
    },
    paginationButtonText: {
      color: theme.primary,
      fontSize: rem(13, fontScale),
      fontWeight: '700',
    },
    paginationInfo: {
      color: theme.textSecondary,
      fontSize: rem(12, fontScale),
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    cardHeader: {
      flexDirection: fontScale > 1.15 ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: fontScale > 1.15 ? 'stretch' : 'center',
      marginBottom: spacing.sm,
    },
    cardHeaderTitle: {
      flex: 1,
      minWidth: 0,
      marginRight: fontScale > 1.15 ? 0 : spacing.sm,
    },
    cardHeaderAccessory: {
      flexShrink: 0,
      alignSelf: fontScale > 1.15 ? 'flex-end' : 'auto',
      marginTop: fontScale > 1.15 ? spacing.sm : 0,
    },
    nomeProduto: {
      fontSize: rem(16, fontScale),
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    textoBadge: {
      color: theme.white,
      fontSize: rem(11, fontScale),
      fontWeight: 'bold',
    },
    detalheProduto: {
      fontSize: rem(12, fontScale),
      color: theme.textSecondary,
      marginBottom: spacing.md,
    },
    footerCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: spacing.sm,
    },
    colunaInfo: {
      flex: 1,
    },
    labelInfo: {
      fontSize: rem(10, fontScale),
      color: theme.textSecondary,
      fontWeight: 'bold',
      marginBottom: spacing.xxs,
    },
    valorInfo: {
      fontSize: rem(15, fontScale),
      fontWeight: 'bold',
      color: theme.primary,
    },
    bottomNavArea: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      elevation: 10,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    bottomNav: {
      flexDirection: 'row',
      backgroundColor: theme.navBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      justifyContent: 'space-around',
      alignItems: 'center',
      flexShrink: 0,
    },
    navItem: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    navText: {
      fontSize: rem(12, Math.min(fontScale || 1, 1.15)),
      marginTop: spacing.xs,
      color: theme.navInactive,
      fontWeight: '400',
    },
    navTextAtivo: {
      color: theme.primary,
      fontWeight: 'bold',
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    badge: {
      backgroundColor: theme.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 6,
    },
    valorData: {
      fontSize: rem(14, fontScale),
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    miniCard: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: spacing.md,
      width: '48%',
      borderWidth: 1,
      borderColor: theme.border,
    },
    labelCard: {
      fontSize: rem(10, fontScale),
      fontWeight: 'bold',
      color: theme.textSecondary,
      marginBottom: spacing.sm,
      letterSpacing: 0.5,
    },
    valorCard: {
      fontSize: rem(22, fontScale),
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: spacing.xxs,
    },
    subvalorCard: {
      fontSize: rem(11, fontScale),
      color: theme.textSecondary,
    },
    subvalorVerde: {
      fontSize: rem(11, fontScale),
      fontWeight: 'bold',
      color: theme.success,
    },
    metricCardDetail: {
      color: theme.textSecondary,
      fontSize: rem(10, fontScale),
      marginTop: spacing.xxs,
    },
    headerCopy: { flex: 1, paddingRight: spacing.md },
  });
};

export const getStyles = (isDark, fontScale = undefined) => createStyles(isDark, fontScale);
