import GameDataModel from '../model/gameData.model';
import { IGameData } from '../types/GameData.type';

export const selectingSpecGamePair = async (): Promise<IGameData[]> => {
  try {
    const GameCount = 2;
    const gamePair: IGameData[] = [];

    const docsCount = await GameDataModel.countDocuments();

    for (let i = 0; i < GameCount; i++) {
      const random = Math.floor(Math.random() * docsCount);

      const gameData: IGameData[] = await GameDataModel.find().skip(random).limit(1);

      if (gamePair.length <= 0) {
        gamePair.push(...gameData);
      } else {
        if (gamePair[0].appid === gameData[0].appid) {
          i -= 1;
        } else {
          gamePair.push(...gameData);
        }
      }
    }

    return gamePair;
  } catch (error) {}
};
