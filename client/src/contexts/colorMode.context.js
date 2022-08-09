import { createContext } from 'react';

export const ColorModeContext = createContext({
  colorMode: '',
  toggleColorMode: () => {},
});
