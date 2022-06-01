import { IAppData } from '../types/scraper.type';

export const closestGameData = (gameData: IAppData[], randomViewsNumber) => {
  return gameData.reduce((a: IAppData, b: IAppData) => {
    return Math.abs(b.reviews - randomViewsNumber) < Math.abs(a.reviews - randomViewsNumber) ? b : a;
  });
};
