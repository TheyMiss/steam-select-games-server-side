export const sortPlayersHighestNumber = (object): { uid: string; username: string; points: number }[] => {
  let arr: { uid: string; username: string; points: number }[] = [];

  Object.keys(object).forEach((key) => {
    arr.push(object[key]);
  });

  arr = arr.sort((a, b) => b.points - a.points);

  return arr;
};
