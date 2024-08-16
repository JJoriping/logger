/* eslint-disable @daldalso/sort-keys */
import { CologStyle } from "./types";
import { interpolate } from "./utilities";

type Interpolator = ((chunk:TemplateStringsArray, ...args:any[]) => string)&{
  [key in StyleKey]: Interpolator
};
type StyleKey = "default"
  | "bold"
  | "italic"
  | "underline"
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "bgBlack"
  | "bgRed"
  | "bgGreen"
  | "bgYellow"
  | "bgBlue"
  | "bgMagenta"
  | "bgCyan"
  | "bgWhite"
;

class CologUnit{
  private readonly styles:CologStyle[];

  constructor(styles:CologStyle[]){
    this.styles = styles;
  }
  public wrap(chunk:TemplateStringsArray, ...args:any[]):string{
    return `\x1B[${this.styles.join(';')}m${interpolate(chunk, args)}\x1B[0m`;
  }
}
const styleTable:Record<StyleKey, CologStyle> = {
  default: CologStyle.DEFAULT,
  bold: CologStyle.BOLD,
  italic: CologStyle.ITALIC,
  underline: CologStyle.UNDERLINE,
  black: CologStyle.BLACK,
  red: CologStyle.RED,
  green: CologStyle.GREEN,
  yellow: CologStyle.YELLOW,
  blue: CologStyle.BLUE,
  magenta: CologStyle.MAGENTA,
  cyan: CologStyle.CYAN,
  white: CologStyle.WHITE,
  bgBlack: CologStyle.BG_BLACK,
  bgRed: CologStyle.BG_RED,
  bgGreen: CologStyle.BG_GREEN,
  bgYellow: CologStyle.BG_YELLOW,
  bgBlue: CologStyle.BG_BLUE,
  bgMagenta: CologStyle.BG_MAGENTA,
  bgCyan: CologStyle.BG_CYAN,
  bgWhite: CologStyle.BG_WHITE
};
const col:Record<StyleKey, Interpolator> = {
  default: getInterpolator(CologStyle.DEFAULT),
  bold: getInterpolator(CologStyle.BOLD),
  italic: getInterpolator(CologStyle.ITALIC),
  underline: getInterpolator(CologStyle.UNDERLINE),
  black: getInterpolator(CologStyle.BLACK),
  red: getInterpolator(CologStyle.RED),
  green: getInterpolator(CologStyle.GREEN),
  yellow: getInterpolator(CologStyle.YELLOW),
  blue: getInterpolator(CologStyle.BLUE),
  magenta: getInterpolator(CologStyle.MAGENTA),
  cyan: getInterpolator(CologStyle.CYAN),
  white: getInterpolator(CologStyle.WHITE),
  bgBlack: getInterpolator(CologStyle.BG_BLACK),
  bgRed: getInterpolator(CologStyle.BG_RED),
  bgGreen: getInterpolator(CologStyle.BG_GREEN),
  bgYellow: getInterpolator(CologStyle.BG_YELLOW),
  bgBlue: getInterpolator(CologStyle.BG_BLUE),
  bgMagenta: getInterpolator(CologStyle.BG_MAGENTA),
  bgCyan: getInterpolator(CologStyle.BG_CYAN),
  bgWhite: getInterpolator(CologStyle.BG_WHITE)
};
export default col;

function getInterpolator(...styles:CologStyle[]):Interpolator{
  const unit = new CologUnit(styles);
  const R = (chunk:TemplateStringsArray) => unit.wrap(chunk);

  for(const k in styleTable){
    Object.defineProperty(R, k, {
      get(){
        return getInterpolator(...styles, styleTable[k as StyleKey]);
      }
    });
  }
  return R as Interpolator;
}