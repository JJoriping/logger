export const enum LogLevel{
  VERBOSE,
  INFO,
  SUCCESS,
  WARNING,
  ERROR
}
export type LoggerOptions = {
  colored?: boolean
};

export const enum CologStyle{
  DEFAULT,
  BOLD,
  ITALIC = 3,
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
  BG_WHITE
}