// request
export interface ILoginRequest {
  username: string; 
  password: string;
}

// response
export interface IUserResponse {
  id: string;
  name: string;
  username: string;
}
  
export interface ILoginResponse {
  user: IUserResponse;
  token: string;
}