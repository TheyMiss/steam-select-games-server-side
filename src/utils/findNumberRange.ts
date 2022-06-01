export const setNumberRange = (number: number) => {
  let numberRange: number;

  if (number.toString().length <= 4) {
    numberRange = 50;
  }

  if (number.toString().length <= 5) {
    numberRange = 200;
  }

  if (number.toString().length <= 6) {
    numberRange = 1000;
  }

  return numberRange;
};
