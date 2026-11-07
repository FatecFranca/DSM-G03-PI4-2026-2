// React Native usa unidades numéricas; esta função é o equivalente a rem no app.
let currentFontScale = 1;
export const setCurrentFontScale = (fontScale) => { currentFontScale = fontScale; };
export const rem = (size, fontScale = currentFontScale) => Math.round(size * fontScale * 100) / 100;
