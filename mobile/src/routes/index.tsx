import { useContext } from 'react';

import { useTheme, Box } from 'native-base';
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

import { useAuth } from '@hooks/useAuth';

import { AuthRoutes } from "./auth.routes";
import { AppRoutes } from "./app.routes";
import { Loading } from '@components/Loading';

export function Routes() {
  //usado para editar o tema padrão de navegação do React Navigation que é branco
  const { colors } = useTheme();

  const { user, isLoadingUserStorageData } = useAuth();

  const theme = DefaultTheme;
  theme.colors.background = colors.gray[700];

  if(isLoadingUserStorageData) {
    return <Loading /> //aparece ele até terminar de carregar os dados do Usuario no storage
  }

  return (
     //usa o Box pq quando navegar de uma tela para outra não aparecer um fundo branco
    <Box flex={1} bg="gray.700">
      {/*o theme={theme} define a backgroud de toda aplicação*/}
      <NavigationContainer theme={theme}>
        {user.id ? <AppRoutes /> : <AuthRoutes />}
      </NavigationContainer>
    </Box>
  );
}