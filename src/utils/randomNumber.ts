export const randomNumber = (minRiviews: number, maxRiviews: number) => {
  return Math.floor(Math.random() * maxRiviews) + minRiviews;
};
