import AsyncStorage from "@react-native-async-storage/async-storage";

import { UserDTO } from '@dtos/UserDTO';
import { USER_STORAGE } from '@storage/storageConfig';

export async function storageUserSave(user: UserDTO) {// função para armazenar no nosso storage
  await AsyncStorage.setItem(USER_STORAGE, JSON.stringify(user))
}

export async function storageUserGet() {// função para buscar do nosso storage
  const storage = await AsyncStorage.getItem(USER_STORAGE);

  const user: UserDTO = storage ? JSON.parse(storage) : {}; //verifica se tem conteúdo dentro do storage, se tiver da um parse

  return user
}

export async function storageUserRemove() {
  await AsyncStorage.removeItem(USER_STORAGE);
}