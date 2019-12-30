import { toLeft, toRight } from 'ember-animated/transitions/move-over';

export const transitionDuration = 500;

export const transitions = [
  { from: 'colors', to: 'contrast', use: toLeft, reverse: toRight },
  { from: 'colors', to: 'kuler', use: toLeft, reverse: toRight },
  { from: 'kuler', to: 'palettes', use: toRight, reverse: toLeft },
  { from: 'palettes', to: 'colors', use: toLeft, reverse: toRight },
  { from: 'palettes', to: 'contrast', use: toLeft, reverse: toRight }
];
