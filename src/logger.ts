import col, { CologInterpolator } from "./colog";
import type { LoggerOptions } from "./types";
import { LogLevel } from "./types";
import { getTerminalLength, interpolate, isTemplateStringsArray, toCologString } from "./utilities";

type LogFunction = (...args:any[]) => Record<string, LogFunction>;
const decorationColors:Record<LogLevel, CologInterpolator> = {
  [LogLevel.VERBOSE]: col.lBlack,
  [LogLevel.INFO]: col.lBlack,
  [LogLevel.SUCCESS]: col.green,
  [LogLevel.WARNING]: col.yellow,
  [LogLevel.ERROR]: col.red
}
const noContinuousKeySymbol = Symbol("No continuous key");

export default class Logger{
  private static readonly defaultOptions:LoggerOptions = {
    headings: {
      [LogLevel.VERBOSE]: "·",
      [LogLevel.INFO]: col.cyan`i`,
      [LogLevel.SUCCESS]: col.green`✓`,
      [LogLevel.WARNING]: col.bgYellow`!`,
      [LogLevel.ERROR]: col.white.bgRed`X`
    },
    colored: true,
    indent: 27,
  };
  public static readonly instance = new Logger({});

  private readonly proxiedVerbose = this.getProxiedLogFunction(LogLevel.VERBOSE);
  private readonly proxiedInfo = this.getProxiedLogFunction(LogLevel.INFO);
  private readonly proxiedSuccess = this.getProxiedLogFunction(LogLevel.SUCCESS);
  private readonly proxiedWarning = this.getProxiedLogFunction(LogLevel.WARNING);
  private readonly proxiedError = this.getProxiedLogFunction(LogLevel.ERROR);
  public readonly verbose = this.proxiedVerbose[noContinuousKeySymbol];
  public readonly info = this.proxiedInfo[noContinuousKeySymbol];
  public readonly success = this.proxiedSuccess[noContinuousKeySymbol];
  public readonly warning = this.proxiedWarning[noContinuousKeySymbol];
  public readonly error = this.proxiedError[noContinuousKeySymbol];
  public readonly options:LoggerOptions;

  constructor(options:Partial<LoggerOptions>){
    this.options = {...Logger.defaultOptions};
    for(const [ k, v ] of Object.entries(options)){
      if(v === undefined) continue;
      Object.assign(this.options, { [k]: v });
    }
  }
  private getProxiedLogFunction(level:LogLevel){
    return new Proxy<Record<string|symbol, LogFunction>>({}, {
      get: (_, key) => {
        const continuous = key === noContinuousKeySymbol ? undefined : typeof key === "symbol" ? key.description : key;
  
        return (...args:any[]) => {
          this.log(level, args, continuous);
          return this.proxiedVerbose;
        };
      },
    });
  }
  private log(level:LogLevel, args:any[], continuous?:string|null):void{
    const [ template, ...rest ] = args;
    const header = `${this.options.headings[level]} ${decorationColors[level]`${new Date().toJSON()}`} `;
    if(!isTemplateStringsArray(template)){
      ((_:TemplateStringsArray) => {
        if(continuous === undefined){
          for(let i = 0; i < args.length; i++){
            this.log(level, [ _, args[i] ], i ? `#${i + 1}` : null);
          }
        }else{
          this.log(level, [ _, args.length <= 1 ? args[0] : args ], continuous);
        }
      })``;
      return;
    }
    const payload = interpolate(template, rest).split("\n");
    const R:string[] = [];

    for(let i = 0; i < payload.length; i++){
      if(i){
        const underrowHeader = decorationColors[level]`${(i + 1).toString()} │ `;
        const padding = Math.max(0, this.options.indent - getTerminalLength(underrowHeader));

        R.push(" ".repeat(padding) + underrowHeader + payload[i]);
      }else if(continuous){
        const underrowHeader = col.bold`${continuous}` + decorationColors[level]` ┼ `;
        const padding = Math.max(0, this.options.indent - getTerminalLength(underrowHeader));

        R.push(" ".repeat(padding) + underrowHeader + payload[i]);
      }else{
        R.push(header + payload[i]);
      }
    }
    console.log(R.join('\n'));
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