import axios, { AxiosError, AxiosInstance } from "axios";

import { AppError } from "@utils/AppError";
import { storageAuthTokenGet, storageAuthTokenSave } from "@storage/storageAuthToken";

type SignOut = () => void;

type PromiseType = {
  onSuccess: (token: string) => void;
  onFailure: (error: AxiosError) => void;
}

type APIInstanceProps = AxiosInstance & { //AxiosInstance é para não perder tudo o que o axios já tem do axios
  registerInterceptTokenManager: (signOut: SignOut) => () => void; //é uma função que recebe outra função
}

const api = axios.create({
  baseURL: 'http://192.168.120.120:3333',
}) as APIInstanceProps;

let failedQueued: Array<PromiseType> = []; //fila de requisições 
let isRefreshing = false;

//---------------------- intercepta as requisições e respostas
//----- request
// divide em 2 parâmetros, o primeiro acessa o config onde tem todos os dados da requisição o segundo do erro
    // api.interceptors.request.use(() => {}, (error) => {})
// api.interceptors.request.use((config) => {
//   console.log('INTERCEPTOR REQUEST =>', config)
//   return config // tem que ter o retorno
// }, (error) => {
//   console.log('INTERCEPTOR REQUEST ERROR =>', error)
//   return Promise.reject(error); //rejeita a requisição e devolve o erro para quem solicitou
// });

//----- response
// api.interceptors.response.use((response) => {
//   console.log("INTERCEPTOR RESPONSE=>", response)
//   return response // tem que ter o retorno
// }, (error) => {
//   console.log('INTERCEPTOR RESPONSE ERROR =>', error)
//   return Promise.reject(error);
// })

//fução para gerenciar a interceptação do token
api.registerInterceptTokenManager = singOut => {
  const interceptTokenManager = api.interceptors.response.use((response) => response, async (requestError) => {
    if(requestError.response?.status === 401) { //requisição não autorizada
      if(requestError.response.data?.message === 'token.expired' || requestError.response.data?.message === 'token.invalid') { //se o token é expirado ou invalido
        const { refresh_token } = await storageAuthTokenGet();//recupera o refresh_token do dispositivo

        if(!refresh_token) {// se não tiver o refresh_token desloga o usuario
          singOut();
          return Promise.reject(requestError)
        }
        
        const originalRequestConfig = requestError.config; //requisição original

        //Adicionando as requisições na fila
        if(isRefreshing) { //a primeira requisição que passar por aqui não vai passar no if
          return new Promise((resolve, reject) => {
            failedQueued.push({
              onSuccess: (token: string) => { 
                originalRequestConfig.headers = { 'Authorization': `Bearer ${token}` };
                resolve(api(originalRequestConfig));
              },
              onFailure: (error: AxiosError) => {
                reject(error)
              },
            })
          })
        }

        isRefreshing = true 

        //Buscando novo token
        return new Promise(async (resolve, reject) => {
          try {
            const { data } = await api.post('/sessions/refresh-token', { refresh_token });
            await storageAuthTokenSave({ token: data.token, refresh_token: data.refresh_token });//guarda no dispositivo do Usuario

            //verifica se tem algum dado junto com a requisição
            if(originalRequestConfig.data) {
              originalRequestConfig.data = JSON.parse(originalRequestConfig.data);//transforma em Json
            }

            originalRequestConfig.headers = { 'Authorization': `Bearer ${data.token}` };//atualiza o cabeçalho 
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

            failedQueued.forEach(request => {
              request.onSuccess(data.token);
            });

            console.log("TOKEN ATUALIZADO");

            resolve(api(originalRequestConfig));
          } catch (error: any) {
            console.log(error)
            failedQueued.forEach(request => {
              request.onFailure(error);
            })

            singOut();
            reject(error);
          } finally {
            isRefreshing = false;
            failedQueued = []
          }
        })

      }
      
      singOut();//é um erro 401 mas não está relacionado com o token  
      
    }

    if(requestError.response && requestError.response.data) {
      return Promise.reject(new AppError(requestError.response.data.message))
    } else {
      return Promise.reject(requestError)
    }
  });

  return () => {
    api.interceptors.response.eject(interceptTokenManager);
  }
}



export { api };