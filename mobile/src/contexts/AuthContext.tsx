import { createContext, ReactNode, useEffect, useState } from "react";

import { storageAuthTokenSave, storageAuthTokenGet, storageAuthTokenRemove } from '@storage/storageAuthToken';
import { storageUserGet, storageUserRemove, storageUserSave } from '@storage/storageUser';

import { api } from '@services/api';
import { UserDTO } from "@dtos/UserDTO";

export type AuthContextDataProps = {
  user: UserDTO;
  singIn: (email: string, password: string) => Promise<void>;
  updateUserProfile: (userUpdated: UserDTO) => Promise<void>;
  signOut: () => Promise<void>;
  isLoadingUserStorageData: boolean;
}

type AuthContextProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextDataProps>({} as AuthContextDataProps);

export function AuthContextProvider({ children }: AuthContextProviderProps)  {

  const [user, setUser] = useState<UserDTO>({} as UserDTO);
  const [isLoadingUserStorageData, setIsLoadingUserStorageData] = useState(true); 

  async function userAndTokenUpdate(userData: UserDTO, token: string) {  
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`; // função para anexar o token no cabeçalho das requisições
      
    setUser(userData); //atualiza o dados do usuario
  }

  async function storageUserAndTokenSave(userData: UserDTO, token: string, refresh_token: string) { // função para salvar os dados no dispositivo
    try {
      setIsLoadingUserStorageData(true)
      await storageUserSave(userData);//persistindo os dados do Usuario logado
      await storageAuthTokenSave({ token, refresh_token });//persistindo os dados do token
      
    } catch (error) {
      throw error
    } finally {
      setIsLoadingUserStorageData(false);
    }
  }

  async function singIn(email: string, password: string) {
    try {
      const { data } = await api.post('/sessions', { email, password }); //busca os dados do usuario
     
      if(data.user && data.token && data.refresh_token) {
        await storageUserAndTokenSave(data.user, data.token, data.refresh_token);
        userAndTokenUpdate(data.user, data.token)
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoadingUserStorageData(false);
    }
  }

  async function signOut() {
    try {
      setIsLoadingUserStorageData(true);
      setUser({} as UserDTO);
      await storageUserRemove(); //remove os dados do usuario no dispositivo
      await storageAuthTokenRemove(); //remove os dados do usuario no dispositivo
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingUserStorageData(false);
    }
  }

  async function updateUserProfile(userUpdated: UserDTO) {
    try {
      setUser(userUpdated);
      await storageUserSave(userUpdated);
    } catch (error) {
      throw error;
    }
  }

  async function loadUserData() {
    try {
      setIsLoadingUserStorageData(true);

      const userLogged = await storageUserGet(); // recupera o Usuario logado no dispositivo
      const { token } = await storageAuthTokenGet(); //busca o token do Usuario no dispositivo
      
      if(token && userLogged) {
        userAndTokenUpdate(userLogged, token);
      } 
    } catch (error) {
      throw error
    } finally {
      setIsLoadingUserStorageData(false);
    }
  }

  useEffect(() => {
    loadUserData()
  },[])

  useEffect(() => {
    const subscribe = api.registerInterceptTokenManager(signOut);

    return () => { //para limpara a memoria
      subscribe();
    }
  },[])

  return (
    <AuthContext.Provider value={{ 
      user, 
      singIn,
      updateUserProfile,
      signOut,
      isLoadingUserStorageData
    }}>
      {children}
    </AuthContext.Provider>
  )
}