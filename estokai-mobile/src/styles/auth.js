import { StyleSheet } from 'react-native';
import { rem } from './typography';
import { getTheme } from './theme';
import { spacing } from './spacing';

function createStyles(isDark, variant, fontScale = undefined) {
  const theme = getTheme(isDark, variant);
  const isSignup = variant === 'cadastro';
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: theme.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      justifyContent: 'center',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isSignup ? spacing.md : spacing.lg,
    },
    headerLogo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconeLogo: {
      width: isSignup ? 36 : 32,
      height: isSignup ? 36 : 32,
      backgroundColor: isSignup ? theme.primary : theme.orange,
      borderRadius: 8,
      marginRight: spacing.sm,
    },
    textoLogo: {
      fontSize: rem(22, fontScale),
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    textoLogoLaranja: {
      color: isSignup ? theme.primary : theme.orange,
    },
    botaoTema: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.border,
      padding: isSignup ? undefined : spacing.sm,
      borderRadius: 8,
      paddingHorizontal: isSignup ? spacing.md : undefined,
      paddingVertical: isSignup ? spacing.sm : undefined,
    },
    titulo: {
      fontSize: rem(isSignup ? 26 : 28, fontScale),
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitulo: {
      fontSize: rem(14, fontScale),
      color: theme.textSecondary,
      marginBottom: isSignup ? spacing.md : spacing.lg,
    },
    card: {
      backgroundColor: theme.cardBackground,
      borderRadius: isSignup ? 12 : 16,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      width: isSignup ? undefined : '100%',
    },
    label: {
      fontSize: rem(isSignup ? 12 : 11, fontScale),
      fontWeight: 'bold',
      color: theme.textSecondary,
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      height: isSignup ? undefined : 48,
      paddingHorizontal: spacing.md,
      fontSize: rem(14, fontScale),
      color: theme.textPrimary,
      marginBottom: spacing.md,
      paddingVertical: isSignup ? spacing.sm : undefined,
    },
    inputSenhaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      height: isSignup ? undefined : 48,
      paddingHorizontal: isSignup ? undefined : spacing.md,
      marginBottom: spacing.md,
    },
    inputSenha: {
      flex: 1,
      fontSize: rem(14, fontScale),
      color: theme.textPrimary,
      paddingHorizontal: isSignup ? spacing.md : undefined,
      paddingVertical: isSignup ? spacing.sm : undefined,
    },
    botaoOlho: {
      padding: isSignup ? undefined : spacing.xs,
      paddingHorizontal: isSignup ? spacing.md : undefined,
      paddingVertical: isSignup ? spacing.sm : undefined,
    },
    botao: {
      backgroundColor: isSignup ? theme.primary : theme.orange,
      height: isSignup ? undefined : 48,
      borderRadius: 8,
      justifyContent: isSignup ? undefined : 'center',
      alignItems: 'center',
      marginTop: isSignup ? spacing.xs : spacing.sm,
      marginBottom: isSignup ? undefined : spacing.md,
      paddingVertical: isSignup ? spacing.md : undefined,
    },
    textoBotao: {
      color: theme.white,
      fontSize: rem(isSignup ? 16 : 15, fontScale),
      fontWeight: 'bold',
    },
    linkContainer: {
      alignItems: 'center',
      paddingVertical: isSignup ? undefined : spacing.sm,
      marginTop: isSignup ? spacing.md : undefined,
    },
    linkText: {
      fontSize: rem(isSignup ? 14 : 13, fontScale),
      color: theme.textSecondary,
    },
    linkAccent: {
      color: isSignup ? theme.primary : theme.orange,
      fontWeight: 'bold',
    },
  });
}

export const getAuthStyles = (isDark, variant = 'login', fontScale = undefined) => createStyles(isDark, variant, fontScale);
