import col, { CologInterpolator } from "./colog";
import toCologString, { CologContext } from "./to-colog-string";
import type { DeepPartial, LoggerOptions } from "./types";
import { LogLevel } from "./types";
import { deepAssign, getTerminalLength, isTemplateStringsArray } from "./utilities";

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
    styles: {
      functionBodyMaxLength: 50,
      inlineArrayMaxLength: 100,
      inlineObjectMaxLength: 100,
      arrayMaxItemCount: 100,
      objectMaxItemCount: 100,
      stringMaxLength: 5000,
      arrayBufferMaxLength: 1024,
      stringTailLength: 10,
      arrayBufferTailLength: 16,
      maxDepth: 3,
    }
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
        if(!args.length) args.push(col.lBlack`(empty)`);
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
    const promiseMap = new Map<Promise<unknown>, string>();
    let chunk = "";
    for(let i = 0; i < template.length; i++){
      if(i in template) chunk += template[i];
      if(i in rest){
        chunk += toCologString(rest[i], { circularMap: new Map(), stack: [], promiseMap, styles: this.options.styles });
      }
    }
    const render = () => {
      const payload = chunk.split("\n");
      const R:string[] = [];
  
      for(let i = 0; i < payload.length; i++){
        if(i){
          const underrowHeader = decorationColors[level]`${(i + 1).toString()} │ `;
          const padding = Math.max(0, this.options.indent - getTerminalLength(underrowHeader));
  
          R.push(" ".repeat(padding) + underrowHeader + payload[i]);
        }else if(continuous){
          let actualContinuous = continuous;
          if(actualContinuous.length + 5 > this.options.indent){
            actualContinuous = actualContinuous.slice(0, this.options.indent - 6) + "…";
          }
          const underrowHeader = col.bold`${actualContinuous}` + decorationColors[level]` ┼ `;
          const padding = this.options.indent - getTerminalLength(underrowHeader);
  
          R.push(" ".repeat(padding) + underrowHeader + payload[i]);
        }else{
          R.push(header + payload[i]);
        }
      }
      this.print(R.join('\n'));
    };
    if(promiseMap.size){
      const promises:Promise<unknown>[] = [];
      const promiseStatusMap:Record<string, {
        'state': "pending"|"resolved"|"rejected",
        'value'?: unknown
      }> = {};
      const handle = () => {
        const context:CologContext = { stack: [], circularMap: new Map(), promiseMap: new Map(), styles: this.options.styles };

        chunk = chunk.replace(/\x1B\[\d+p/g, v => {
          const status = promiseStatusMap[v];

          switch(status?.state){
            case "pending": return col.lBlack`(pending)`;
            case "resolved": return col.lBlack`(resolved)\n` + toCologString(status.value, context);
            case "rejected": return col.red`(rejected)\n` + toCologString(status.value, context);
            default: return col.red`(unknown)`;
          }
        });
        render();
      };

      for(const [ k, v ] of promiseMap.entries()){
        promiseStatusMap[v] = { state: "pending" };
        promises.push(k.then(
          res => { promiseStatusMap[v].state = "resolved"; promiseStatusMap[v].value = res; },
          res => { promiseStatusMap[v].state = "rejected"; promiseStatusMap[v].value = res; }
        ));
      }
      Promise.race([ ...promiseMap.keys(), Promise.resolve() ]).then(handle, handle);
    }else{
      render();
    }
  }
  private print(value:string):void{
    let actualValue = value;
    if(!this.options.colored){
      actualValue = actualValue.replace(/\x1B\[.+?m/g, "");
    }
    console.log(actualValue);
  }

  public setOptions(options:DeepPartial<LoggerOptions>):this{
    deepAssign(this.options, options);
    return this;
  }
}
export const log = Logger.instance.verbose.bind(Logger.instance);
export const info = Logger.instance.info.bind(Logger.instance);
export const success = Logger.instance.success.bind(Logger.instance);
export const warning = Logger.instance.warning.bind(Logger.instance);
export const error = Logger.instance.error.bind(Logger.instance);