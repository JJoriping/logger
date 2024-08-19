import type col from "./colog.js";

export type DeepPartial<T> = T extends {}
  ? { [key in keyof T]?: DeepPartial<T[key]> }
  : T
;
export enum LogLevel{
  VERBOSE,
  INFO,
  SUCCESS,
  WARNING,
  ERROR
}
export type LoggerOptions = {
  'headings': Record<LogLevel, string>,
  /**
   * The format string of the header for each logged value.
   * 
   * You can use the variables below.
   * 
   * | Variable | Description |
   * |:--------:|-------------|
   * | `$H`     | Heading     |
   * | `$T`     | Timestamp   |
   * 
   * @default "$H $T "
   */
  'headerFormat': string,
  'indent': number,
  'decorationColors': Record<LogLevel, Array<keyof typeof col>>,
  'styles': {
    'functionBodyMaxLength': number,
    'inlineArrayMaxLength': number
    'inlineObjectMaxLength': number
    'arrayMaxItemCount': number
    'objectMaxItemCount': number
    'stringMaxLength': number
    'arrayBufferMaxLength': number
    'stringTailLength': number
    'arrayBufferTailLength': number
    'maxDepth': number
  }
};
export type SubscriptionInfo = {
  'id': number,
  'callback': Subscriber,
  'options': {
    'colored': boolean
  }
};
export interface Subscriber{
  (level:LogLevel, value:string):void;
  destructor?:() => void;
}
export enum CologStyle{
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