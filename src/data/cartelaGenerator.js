function uniqueColumn(min, max) {
  const numbers = [];

  while (numbers.length < 5) {
    const number =
      Math.floor(Math.random() * (max - min + 1)) + min;

    if (!numbers.includes(number)) {
      numbers.push(number);
    }
  }

  numbers.sort((a, b) => a - b);

  return numbers;
}

function createCartela(id) {
  const B = uniqueColumn(1, 15);
  const I = uniqueColumn(16, 30);
  const N = uniqueColumn(31, 45);
  const G = uniqueColumn(46, 60);
  const O = uniqueColumn(61, 75);

  N[2] = "FREE";

  return {
    id,

    serial: `C${String(id).padStart(3, "0")}-${Math.floor(
      100000 + Math.random() * 900000
    )}`,

    numbers: {
      B,
      I,
      N,
      G,
      O,
    },

    status: "available",
  };
}

export function generateCartelas(count = 150) {
  const cartelas = [];

  for (let i = 1; i <= count; i++) {
    cartelas.push(createCartela(i));
  }

  return cartelas;
}