import { TouchableOpacity } from 'react-native';
import { Heading, HStack, Text, VStack, Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '@hooks/useAuth';

import { api } from '@services/api';

import defaulUserPhotoImg from '@assets/userPhotoDefault.png'; 

import { UserPhoto } from './UserPhoto';

export function HomeHeader() {

  const { user, signOut } = useAuth();

  return (
    <HStack bg="gray.600" pt={16} pb={5} px={8} alignItems="center">
      <UserPhoto 
        source={
          user.avatar  
          ? { uri: `${api.defaults.baseURL}/avatar/${user.avatar}` } //armazenamento local é o locaLhost:3333/avatar/nomeDaImagem.jpeg
          : defaulUserPhotoImg
        }
        size={16}
        alt="Imagem do usuário"
        mr={4}
      />
      
      <VStack flex={1}>
        <Text color="gray.100" fontSize="md">
          Olá,
        </Text>

        <Heading color="gray.100" fontSize="md" fontFamily="heading">
          {user.name}
        </Heading>
      </VStack>


      <TouchableOpacity onPress={signOut}>
        <Icon //usar o Icon pq assim da para usar as cores tema
          as={MaterialIcons} //coloca qual biblioteca usar
          name="logout" //nome do ícone
          color="gray.200"
          size={7}
        />
      </TouchableOpacity>
    </HStack>
  );
}