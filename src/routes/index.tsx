import { useTheme, Box } from 'native-base';
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

import { AuthRoutes } from "./auth.routes";
import { AppRoutes } from "./app.routes";

export function Routes() {
  //usado para editar o tema padrão de navegação do React Navigation que é branco
  const { colors } = useTheme();

  const theme = DefaultTheme;
  theme.colors.background = colors.gray[700];

  return (
    //usa o Box pq quando navegar de uma tela para outra não aparecer um fundo branco
    <Box flex={1} bg="gray.700"> 
      {/*o theme={theme} define a backgroud de toda aplicação*/}
      <NavigationContainer theme={theme}>
        <AppRoutes />
      </NavigationContainer>
    </Box>
  );
}