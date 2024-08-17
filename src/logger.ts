import col, { CologInterpolator } from "./colog";
import type { LoggerOptions } from "./types";
import { LogLevel } from "./types";
import { getTerminalLength, interpolate } from "./utilities";

const headings:Record<LogLevel, string> = {
  [LogLevel.VERBOSE]: "·",
  [LogLevel.INFO]: col.cyan`i`,
  [LogLevel.SUCCESS]: col.green`✓`,
  [LogLevel.WARNING]: col.bgYellow`!`,
  [LogLevel.ERROR]: col.white.bgRed`X`
};
const verticalBarColors:Record<LogLevel, CologInterpolator> = {
  [LogLevel.VERBOSE]: col.lBlack,
  [LogLevel.INFO]: col.lBlack,
  [LogLevel.SUCCESS]: col.lBlack,
  [LogLevel.WARNING]: col.yellow,
  [LogLevel.ERROR]: col.red
}

export default class Logger{
  private static readonly defaultOptions:LoggerOptions = {
    colored: true,
    indent: 27
  };
  public static readonly instance = new Logger({});

  public readonly options:LoggerOptions;

  constructor(options:Partial<LoggerOptions>){
    this.options = {...Logger.defaultOptions};
    for(const [ k, v ] of Object.entries(options)){
      if(v === undefined) continue;
      Object.assign(this.options, { [k]: v });
    }
  }
  private log(level:LogLevel, template:TemplateStringsArray, args:any[]):void{
    const header = `${headings[level]} ${col.lBlack`${new Date().toJSON()}`} `;
    const payload = interpolate(template, args).split("\n");
    const R:string[] = [];

    for(let i = 0; i < payload.length; i++){
      if(i){
        const underrowHeader = (i + 1).toString() + verticalBarColors[level]` │ `;
        const padding = Math.max(0, this.options.indent - getTerminalLength(underrowHeader));

        R.push(" ".repeat(padding) + underrowHeader + payload[i]);
      }else{
        R.push(header + payload[i]);
      }
    }
    console.log(R.join('\n'));
  }

  public verbose(template:TemplateStringsArray, ...args:any[]):Logger['verbose']{
    this.log(LogLevel.VERBOSE, template, args);
    return this.verbose.bind(this);
  }
  public info(template:TemplateStringsArray, ...args:any[]):Logger['info']{
    this.log(LogLevel.INFO, template, args);
    return this.info.bind(this);
  }
  public success(template:TemplateStringsArray, ...args:any[]):Logger['success']{
    this.log(LogLevel.SUCCESS, template, args);
    return this.success.bind(this);
  }
  public warning(template:TemplateStringsArray, ...args:any[]):Logger['warning']{
    this.log(LogLevel.WARNING, template, args);
    return this.warning.bind(this);
  }
  public error(template:TemplateStringsArray, ...args:any[]):Logger['error']{
    this.log(LogLevel.ERROR, template, args);
    return this.error.bind(this);
  }

  public setOptions(options:Partial<LoggerOptions>):this{
    Object.assign(this.options, options);
    return this;
  }
}
export const log = Logger.instance.verbose.bind(Logger.instance);
export const info = Logger.instance.info.bind(Logger.instance);
export const success = Logger.instance.success.bind(Logger.instance);
export const warning = Logger.instance.warning.bind(Logger.instance);
export const error = Logger.instance.error.bind(Logger.instance);