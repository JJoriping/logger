export const enum LogLevel{
  VERBOSE,
  INFO,
  SUCCESS,
  WARNING,
  ERROR
}
export type LoggerOptions = {
  'colored': boolean,
  'indent': number
};

export const enum CologStyle{
  DEFAULT,
  BOLD,
  DIMMED,
  ITALIC,
  UNDERLINE,
  BLACK = 30,
  RED,
  GREEN,
  YELLOW,
  BLUE,
  MAGENTA,
  CYAN,
  WHITE,
  BG_BLACK = 40,
  BG_RED,
  BG_GREEN,
  BG_YELLOW,
  BG_BLUE,
  BG_MAGENTA,
  BG_CYAN,
  BG_WHITE,
  L_BLACK = 90,
  L_RED,
  L_GREEN,
  L_YELLOW,
  L_BLUE,
  L_MAGENTA,
  L_CYAN,
  L_WHITE,
  BG_L_BLACK = 100,
  BG_L_RED,
  BG_L_GREEN,
  BG_L_YELLOW,
  BG_L_BLUE,
  BG_L_MAGENTA,
  BG_L_CYAN,
  BG_L_WHITE
}