const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Valores circulam sempre em centavos (inteiros); a divisão serve só para exibir. */
export const formatBRL = (cents) => brl.format(cents / 100);
