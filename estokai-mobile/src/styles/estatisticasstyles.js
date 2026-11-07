import { StyleSheet } from 'react-native';
import { rem } from './typography';
import { getTheme } from './theme';
import { spacing } from './spacing';

const createStyles = (isDark, fontScale = undefined) => {
  const theme = getTheme(isDark, 'app');
  return StyleSheet.create({
    scrollContainer: {
      // Mantém o conteúdo final acessível acima da navegação sobreposta.
      paddingBottom: 112,
    },
    rowCards: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    periodContainer: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
      borderRadius: 10,
      padding: 3,
      marginBottom: spacing.md,
    },
    periodButton: {
      minHeight: 36,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: 7,
    },
    periodButtonActive: {
      backgroundColor: theme.primary,
    },
    periodText: {
      color: theme.textSecondary,
      fontSize: rem(12, fontScale),
      fontWeight: '700',
    },
    periodTextActive: {
      color: theme.white,
    },
    chartTitle: {
      fontSize: rem(16, fontScale),
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: spacing.xxs,
    },
    chartSub: {
      fontSize: rem(11, fontScale),
      color: theme.textSecondary,
      marginBottom: spacing.md,
    },
    chartLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendHistoric: {
      width: 18,
      borderTopWidth: 3,
      borderColor: theme.success,
      marginRight: spacing.xs,
    },
    legendForecast: {
      width: 18,
      borderTopWidth: 2,
      borderColor: '#22D3EE',
      borderStyle: 'dashed',
      marginRight: spacing.xs,
    },
    legendText: {
      fontSize: rem(11, fontScale),
      color: theme.textSecondary,
    },
    forecastUnavailable: {
      color: theme.textSecondary,
      fontSize: rem(11, fontScale),
      marginBottom: spacing.sm,
    },
    lineChartContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      overflow: 'hidden',
      paddingVertical: spacing.xs,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: rem(12, fontScale),
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    loader: {
      marginTop: spacing.sm,
    },
    produtoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    produtoInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    produtoRank: {
      fontSize: rem(13, fontScale),
      fontWeight: 'bold',
      color: theme.primary,
      marginRight: spacing.md,
      width: 12,
    },
    produtoNome: {
      fontSize: rem(14, fontScale),
      fontWeight: '600',
      color: theme.textPrimary,
    },
    produtoQtd: {
      fontSize: rem(14, fontScale),
      fontWeight: 'bold',
      color: theme.primary,
    },
  });
};

export const getStyles = (isDark, fontScale = undefined) => createStyles(isDark, fontScale);
