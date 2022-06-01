import fs from 'fs';
import { IAppData, IGame } from '../types/scraper.type';
import { closestGameData } from '../utils/closestGameData';
import { setNumberRange } from '../utils/findNumberRange';
import { randomNumber } from '../utils/randomNumber';
import { nanoid } from 'nanoid';

export const getDataFromJson = () => {
  try {
    return JSON.parse(fs.readFileSync('public/steamGames.json', 'utf8'));
  } catch (err) {
    throw new Error(err);
  }
};

export const pairOfGame = (gameData: IAppData[]) => {
  const gamesInPair = 2;
  let minReviewsCount = 1;
  let maxReviewsCount = 1000;
  const pairOfGames: IGame[] = [];

  for (let i = 0; i < gamesInPair; i++) {
    const randomId = nanoid();
    const randomViewsNumber = randomNumber(minReviewsCount, maxReviewsCount);

    const game = { ...closestGameData(gameData, randomViewsNumber), ...{ id: randomId } };

    pairOfGames.push(game);

    const numberRange = setNumberRange(game.reviews);

    gameData = gameData.filter((obj) => game.reviews !== obj.reviews);

    minReviewsCount = game.reviews - numberRange;
    maxReviewsCount = game.reviews + numberRange;
  }

  return pairOfGames;
};
