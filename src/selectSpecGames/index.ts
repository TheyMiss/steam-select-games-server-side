import { getDataFromJson, pairOfGame } from './selectSpecGames';

export const selectingSpecGamePair = () => {
  const gameData = getDataFromJson();
  return pairOfGame(gameData);
};
