import col from "./colog";
import type { LoggerOptions } from "./types";
import { LogLevel } from "./types";
import { interpolate } from "./utilities";

const headings:Record<LogLevel, string> = {
  [LogLevel.VERBOSE]: "· " + col.bgWhite` `,
  [LogLevel.INFO]: col.cyan`i ` + col.bgCyan` `,
  [LogLevel.SUCCESS]: col.green`✓ ` + col.bgGreen` `,
  [LogLevel.WARNING]: col.yellow`⚠ ` + col.bgYellow` `,
  [LogLevel.ERROR]: col.red`✗ ` + col.bgRed` `
};

export default class Logger{
  public static readonly instance = new Logger({});

  public readonly options:LoggerOptions;

  constructor(options:Partial<LoggerOptions>){
    this.options = options;
  }
  private log(level:LogLevel, template:TemplateStringsArray, args:any[]):this{
    const R = `${headings[level]} ${interpolate(template, args)}`;
    console.log(R);
    return this;
  }

  public verbose(template:TemplateStringsArray, ...args:any[]):this{
    return this.log(LogLevel.VERBOSE, template, args);
  }
  public info(template:TemplateStringsArray, ...args:any[]):this{
    return this.log(LogLevel.INFO, template, args);
  }
  public success(template:TemplateStringsArray, ...args:any[]):this{
    return this.log(LogLevel.SUCCESS, template, args);
  }
  public warning(template:TemplateStringsArray, ...args:any[]):this{
    return this.log(LogLevel.WARNING, template, args);
  }
  public error(template:TemplateStringsArray, ...args:any[]):this{
    return this.log(LogLevel.ERROR, template, args);
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