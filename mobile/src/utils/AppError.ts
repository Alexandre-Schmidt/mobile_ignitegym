//usado para padronizar as msg de erro ou requisições que são tratadas dentro da aplicação
export class AppError {
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}