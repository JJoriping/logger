/* eslint-disable @daldalso/sort-keys */
import { CologStyle } from "./types.js";

export type CologInterpolator = ((chunk:TemplateStringsArray, ...args:any[]) => string)&{
  [key in StyleKey]: CologInterpolator
};
type StyleColorBase = "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
;
type StyleKey = "default"
  | "bold"
  | "dimmed"
  | "italic"
  | "underline"
  | StyleColorBase
  | `bg${Capitalize<StyleColorBase>}`
  | `l${Capitalize<StyleColorBase>}`
  | `bgL${Capitalize<StyleColorBase>}`
;

class CologUnit{
  private readonly styles:CologStyle[];

  constructor(styles:CologStyle[]){
    this.styles = styles;
  }
  public wrap(chunk:TemplateStringsArray, ...args:any[]):string{
    const styles = this.styles.join(';');
    let payload = "";

    for(let i = 0; i < chunk.length; i++){
      if(i in chunk) payload += chunk[i];
      if(i in args) payload += args[i];
    }
    payload = payload.replace(/\x1B\[0m/g, `\x1B[${styles}m`);
    return `\x1B[${styles}m${payload}\x1B[0m`;
  }
}
const styleTable:Record<StyleKey, CologStyle> = {
  default: CologStyle.DEFAULT,
  bold: CologStyle.BOLD,
  dimmed: CologStyle.DIMMED,
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
  bgWhite: CologStyle.BG_WHITE,
  lBlack: CologStyle.L_BLACK,
  lRed: CologStyle.L_RED,
  lGreen: CologStyle.L_GREEN,
  lYellow: CologStyle.L_YELLOW,
  lBlue: CologStyle.L_BLUE,
  lMagenta: CologStyle.L_MAGENTA,
  lCyan: CologStyle.L_CYAN,
  lWhite: CologStyle.L_WHITE,
  bgLBlack: CologStyle.BG_L_BLACK,
  bgLRed: CologStyle.BG_L_RED,
  bgLGreen: CologStyle.BG_L_GREEN,
  bgLYellow: CologStyle.BG_L_YELLOW,
  bgLBlue: CologStyle.BG_L_BLUE,
  bgLMagenta: CologStyle.BG_L_MAGENTA,
  bgLCyan: CologStyle.BG_L_CYAN,
  bgLWhite: CologStyle.BG_L_WHITE
};
const col:Record<StyleKey, CologInterpolator> = {
  default: getInterpolator(CologStyle.DEFAULT),
  bold: getInterpolator(CologStyle.BOLD),
  dimmed: getInterpolator(CologStyle.DIMMED),
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
  bgWhite: getInterpolator(CologStyle.BG_WHITE),
  lBlack: getInterpolator(CologStyle.L_BLACK),
  lRed: getInterpolator(CologStyle.L_RED),
  lGreen: getInterpolator(CologStyle.L_GREEN),
  lYellow: getInterpolator(CologStyle.L_YELLOW),
  lBlue: getInterpolator(CologStyle.L_BLUE),
  lMagenta: getInterpolator(CologStyle.L_MAGENTA),
  lCyan: getInterpolator(CologStyle.L_CYAN),
  lWhite: getInterpolator(CologStyle.L_WHITE),
  bgLBlack: getInterpolator(CologStyle.BG_L_BLACK),
  bgLRed: getInterpolator(CologStyle.BG_L_RED),
  bgLGreen: getInterpolator(CologStyle.BG_L_GREEN),
  bgLYellow: getInterpolator(CologStyle.BG_L_YELLOW),
  bgLBlue: getInterpolator(CologStyle.BG_L_BLUE),
  bgLMagenta: getInterpolator(CologStyle.BG_L_MAGENTA),
  bgLCyan: getInterpolator(CologStyle.BG_L_CYAN),
  bgLWhite: getInterpolator(CologStyle.BG_L_WHITE)
};
export default col;

function getInterpolator(...styles:CologStyle[]):CologInterpolator{
  const unit = new CologUnit(styles);
  const R = (chunk:TemplateStringsArray, ...args:any[]) => unit.wrap(chunk, ...args);

  for(const k in styleTable){
    Object.defineProperty(R, k, {
      get(){
        return getInterpolator(...styles, styleTable[k as StyleKey]);
      }
    });
  }
  return R as CologInterpolator;
}