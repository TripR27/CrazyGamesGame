import Decimal from 'break_infinity.js';

export type Num = Decimal;
export type NumSource = Decimal | number | string;

export const num = (value: NumSource): Num => new Decimal(value);

export const ZERO: Num = num(0);
export const ONE: Num = num(1);

export const serializeNum = (value: Num): string => value.toString();

export const parseNum = (text: string): Num => Decimal.fromString(text);
