import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Center, ScrollView, VStack, Skeleton, Text, Heading, useToast } from 'native-base';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as yup from 'yup';


import defaulUserPhotoImg from '@assets/userPhotoDefault.png'; 

import { api } from '@services/api';
import { AppError } from '@utils/AppError';

import { useAuth } from '@hooks/useAuth';

import { ScreenHeader } from '@components/ScreenHeader';
import { UserPhoto } from '@components/UserPhoto';
import { Input } from '@components/Input';
import { Button } from '@components/Button';


const PHOTO_SIZE = 33;

type FormDataProps = {
  name: string;
  email: string;
  password: string;
  old_password: string;
  confirm_password: string;
}

const profileSchema = yup.object({
  name: yup
    .string()
    .required('Informe o nome'),
  password: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 dígitos.')
    .nullable()//para habilitar que o campo pode ser nulo
    .transform((value) => !!value ? value : null), // verifica o valor atual do input, verifica se tem valor, se não, coloca como nulo. Resolvendo o BO do Vazio e undefined
  confirm_password: yup
    .string()
    .nullable()
    .transform((value) => !!value ? value : null)
    .oneOf([yup.ref('password'), null], 'A confirmação de senha não confere.')//verifica se a senha é a mesma digitada no password
    .when('password', {// verifica se tem conteúdo dentro do password, se sim, pede para inserir o confirm_password pq ele depende do password
      is: (Field: any) => Field !== null, 
      then: yup
        .string()
        .nullable()
        .required('Informe a confirmação da senha.')
        .transform((value) => !!value ? value : null)
    }),
})

export function Profile() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [photoIsLoading, setPhotoIsLoading] = useState(false);

  const toast = useToast();
  const { user, updateUserProfile } = useAuth();
  const { control, handleSubmit, formState: { errors } } = useForm<FormDataProps>({ 
    defaultValues: { // da para passar pro react hook form valores padrões
      name: user.name,
      email: user.email
    },
    resolver: yupResolver(profileSchema) 
  });

  async function handleUserPhotoSelected(){
    setPhotoIsLoading(true);
    
    try {
      // Acessa o album do usuario
      const photoSelected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,//tipo de conteudo que quer selecionar
        quality: 1, //qualidade da imagem
        aspect: [4, 4], //proporção da imagem 4x4 por exemplo
        allowsEditing: true, //abre a possibilidade de editar a imagem
      });
      //Para verificar se cancelou a seleção da imagem
      if(photoSelected.cancelled) {
        return;
      }

      if(photoSelected.uri) {

        const photoInfo = await FileSystem.getInfoAsync(photoSelected.uri);
        
        if(photoInfo.size && (photoInfo.size  / 1024 / 1024 ) > 5){ // se existe e se é maior que 5MB
          
          return toast.show({
            title: 'Essa imagem é muito grande. Escolha uma de até 5MB.',
            placement: 'top',
            bgColor: 'red.500'
          })
        }

        const fileExtension = photoSelected.uri.split('.').pop();//pega a extensão da imagem

        const photoFile = {
          name: `${user.name}.${fileExtension}`.toLowerCase(), //definindo o nome da imagem, colocando em minusculo tbm
          uri: photoSelected.uri,
          type: `${photoSelected.type}/${fileExtension}`
        } as any;

        const userPhotoUploadForm = new FormData();//precisa criar um formulário, pois agora vamos mandar um arquivo para o back e não simplesmente dados

        userPhotoUploadForm.append('avatar', photoFile);//o primeiro parâmetro do append é o nome do campo e o segundo é o que quer enviar

        //enviando o arquivo para o back
        const avatarUpdtedResponse = await api.patch('/users/avatar', userPhotoUploadForm, {//primeiro parametro é o caminho, o segundo o formulario e o terceiro um objeto que define um novo cabeçalho
          headers: {
            'Content-Type': 'multipart/form-data'//o conteúdo é um multipart multipart/form-data
          }
        });

        const userUpdated = user;

        userUpdated.avatar = avatarUpdtedResponse.data.avatar;

        await updateUserProfile(userUpdated);

        toast.show({
          title: 'Foto atualizada!',
          placement: 'top',
          bgColor: 'green.500'
        })
      }
  
    } catch (error) {
      console.log(error)
    } finally {
      setPhotoIsLoading(false)
    }
  }

  async function handleProfileUpdate(data: FormDataProps) {
    try {
      setIsUpdating(true);

      const userUpdated = user;
      userUpdated.name = data.name;

      await api.put('/users', data);

      await updateUserProfile(userUpdated);

      toast.show({
        title: 'Perfil atualizado com sucesso!',
        placement: 'top',
        bgColor: 'green.500'
      });
    } catch (error) {
      const isAppError = error instanceof AppError;
      const title = isAppError ? error.message : 'Não foi possível atualizar os dados. Tente novamente mais tarde.';

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500'
      })
    } finally {
      setIsUpdating(false);
    }
  }
 
  return (
    <VStack flex={1}>
      <ScreenHeader title='Perfil' />

      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <Center mt={6} px={10}>
          {
            photoIsLoading ?
              <Skeleton 
                w={PHOTO_SIZE}
                h={PHOTO_SIZE}
                rounded="full"
                startColor="gray.500"
                endColor="gray.400"
              />
            :
              <UserPhoto 
                source={
                  user.avatar  
                  ? { uri: `${api.defaults.baseURL}/avatar/${user.avatar}` } 
                  : defaulUserPhotoImg
                }
                alt="Foto do usuário"
                size={PHOTO_SIZE}
              />
          }
          
          <TouchableOpacity onPress={handleUserPhotoSelected}>
            <Text color="green.500" fontWeight="bold" fontSize="md" mt={2} mb={8}>
              Alterar Foto
            </Text>
          </TouchableOpacity>

          <Controller 
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <Input 
                bg="gray.600" 
                placeholder='Nome'
                onChangeText={onChange}
                value={value}
                errorMessage={errors.name?.message}
              />
            )}
          />

          <Controller 
            control={control}
            name="email"
            render={({ field: { value, onChange } }) => (
              <Input 
                bg="gray.600" // no componente o Bg é gray.700 e como aqui tem que ser o gray.600, vc sobreescreve
                placeholder="E-mail"
                isDisabled
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          
        
          <Heading color="gray.200" fontSize="md" mb={2} alignSelf="flex-start" mt={12} fontFamily="heading">
            Alterar senha
          </Heading>

          <Controller 
            control={control}
            name="old_password"
            render={({ field: { onChange } }) => (
              <Input 
                bg="gray.600"
                placeholder="Senha antiga"
                secureTextEntry
                onChangeText={onChange}
              />
            )}
          />

          <Controller 
            control={control}
            name="password"
            render={({ field: { onChange } }) => (
              <Input 
                bg="gray.600"
                placeholder="Nova senha"
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.password?.message}
              />
            )}
          />

          <Controller 
            control={control}
            name="confirm_password"
            render={({ field: { onChange } }) => (
              <Input 
                bg="gray.600"
                placeholder="Confirme a nova senha"
                secureTextEntry
                onChangeText={onChange}
                errorMessage={errors.confirm_password?.message}
              />
            )}
          />

          <Button 
            title="Atualizar" 
            mt={4} 
            onPress={handleSubmit(handleProfileUpdate)}
            isLoading={isUpdating}
          />
        </Center>
      </ScrollView>
    </VStack>
  );
}