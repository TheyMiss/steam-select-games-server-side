export interface IAppData {
  name: string;
  image: string;
  price: string;
  reviews: number;
}

export interface IGame extends IAppData {
  id: string;
}
