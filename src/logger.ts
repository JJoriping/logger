/* eslint-disable @daldalso/sort-keys */
import type { CologInterpolator } from "./colog.js";
import col from "./colog.js";
import createStandardSubscriber from "./subscribers/standard.js";
import type { CologContext } from "./to-colog-string.js";
import toCologString from "./to-colog-string.js";
import type { DeepPartial, LoggerOptions, Subscriber, SubscriptionInfo } from "./types.js";
import { LogLevel } from "./types.js";
import { deepAssign, getTerminalLength, isTemplateStringsArray } from "./utilities.js";

type LogFunction = (...args:any[]) => Record<string, LogFunction>;

const noContinuousKeySymbol = Symbol("No continuous key");

export default class Logger{
  private static readonly defaultOptions:LoggerOptions = {
    headings: {
      [LogLevel.VERBOSE]: "·",
      [LogLevel.INFO]: col.cyan`i`,
      [LogLevel.SUCCESS]: col.green`✓`,
      [LogLevel.WARNING]: col.black.bgYellow`!`,
      [LogLevel.ERROR]: col.white.bgRed`X`
    },
    headerFormat: "$H ",
    decorationColors: {
      [LogLevel.VERBOSE]: [ "lBlack" ],
      [LogLevel.INFO]: [ "lBlack" ],
      [LogLevel.SUCCESS]: [ "green" ],
      [LogLevel.WARNING]: [ "yellow" ],
      [LogLevel.ERROR]: [ "red" ]
    },
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
      maxDepth: 3
    }
  };
  public static readonly instance = new Logger({});
  static{
    Logger.instance.addSubscriber(createStandardSubscriber(), { colored: true });
  }

  private readonly subscriptions:Record<number, SubscriptionInfo> = {};
  private readonly proxiedVerbose = this.getProxiedLogFunction(LogLevel.VERBOSE);
  private readonly proxiedInfo = this.getProxiedLogFunction(LogLevel.INFO);
  private readonly proxiedSuccess = this.getProxiedLogFunction(LogLevel.SUCCESS);
  private readonly proxiedWarning = this.getProxiedLogFunction(LogLevel.WARNING);
  private readonly proxiedError = this.getProxiedLogFunction(LogLevel.ERROR);
  public readonly log = this.proxiedVerbose[noContinuousKeySymbol];
  public readonly info = this.proxiedInfo[noContinuousKeySymbol];
  public readonly success = this.proxiedSuccess[noContinuousKeySymbol];
  public readonly warning = this.proxiedWarning[noContinuousKeySymbol];
  public readonly error = this.proxiedError[noContinuousKeySymbol];
  public readonly options:LoggerOptions;

  private subscriptionIdCounter:number = 0;

  public constructor(options:DeepPartial<LoggerOptions> = {}){
    this.options = deepAssign(structuredClone(Logger.defaultOptions), options);
  }
  private getProxiedLogFunction(level:LogLevel):Record<string|symbol, LogFunction>{
    return new Proxy<Record<string|symbol, LogFunction>>({}, {
      get: (_, key) => {
        const continuous = key === noContinuousKeySymbol ? undefined : typeof key === "symbol" ? key.description : key;

        return (...args:any[]) => {
          this.out(level, args, continuous);
          return this.proxiedVerbose;
        };
      }
    });
  }
  private out(level:LogLevel, args:any[], continuous?:string|null):void{
    const [ template, ...rest ] = args;
    const decorationColor = this.options.decorationColors[level].reduce((pv, v) => pv[v], col) as CologInterpolator;
    const headerVariables:Record<string, string> = {
      H: this.options.headings[level],
      T: decorationColor`${new Date().toJSON()}`
    };
    const header = this.options.headerFormat.replace(/\$(\w+)\b/g, (_, g1) => {
      if(!(g1 in headerVariables)){
        throw Error(`Unknown header variable: ${g1}`);
      }
      return headerVariables[g1];
    });
    const headerLength = getTerminalLength(header);
    if(!isTemplateStringsArray(template)){
      ((_:TemplateStringsArray) => {
        if(!args.length) args.push(col.lBlack`(empty)`);
        if(continuous === undefined){
          for(let i = 0; i < args.length; i++){
            this.out(level, [ _, args[i] ], i ? `#${i}` : null);
          }
        }else{
          this.out(level, [ _, args.length <= 1 ? args[0] : args ], continuous);
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
      const payload = chunk.split('\n');
      const R:string[] = [];
      const indent = this.options.indent ?? headerLength;

      for(let i = 0; i < payload.length; i++){
        if(i){
          const underrowHeader = decorationColor`${(i + 1).toString()} │ `;
          const padding = Math.max(0, indent - getTerminalLength(underrowHeader));

          R.push(" ".repeat(padding) + underrowHeader + payload[i]);
        }else if(continuous){
          let underrowHeader:string;
          let padding:number;

          if(continuous.length + 5 > indent){
            underrowHeader = decorationColor`⤷ ` + col.bold`${continuous}` + decorationColor`: `;
            padding = 0;
          }else{
            underrowHeader = col.bold`${continuous}` + decorationColor` ┼ `;
            padding = indent - getTerminalLength(underrowHeader);
          }
          R.push(" ".repeat(padding) + underrowHeader + payload[i]);
        }else{
          R.push(header + payload[i]);
        }
      }
      this.print(level, R.join('\n'));
    };
    if(promiseMap.size){
      const promises:Array<Promise<unknown>> = [];
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
          res => {
            promiseStatusMap[v].state = "resolved"; promiseStatusMap[v].value = res;
          },
          error => {
            promiseStatusMap[v].state = "rejected"; promiseStatusMap[v].value = error;
          }
        ));
      }
      Promise.race([ ...promiseMap.keys(), Promise.resolve() ]).then(handle, handle);
    }else{
      render();
    }
  }
  private print(level:LogLevel, value:string):void{
    for(const v of Object.values(this.subscriptions)){
      let actualValue = value;
      if(!v.options.colored){
        actualValue = actualValue.replace(/\x1B\[.+?m/g, "");
      }
      v.callback(level, actualValue);
    }
  }

  public addSubscriber(callback:Subscriber, options:SubscriptionInfo['options']):SubscriptionInfo{
    const id = ++this.subscriptionIdCounter;

    return this.subscriptions[id] = {
      id,
      callback,
      options
    };
  }
  public removeSubscriber(id:number):void{
    this.subscriptions[id]?.callback.destructor?.();
    delete this.subscriptions[id];
  }
  public setOptions(options:DeepPartial<LoggerOptions>):this{
    deepAssign(this.options, options);
    return this;
  }
}
export const log = Logger.instance.log.bind(Logger.instance);
export const info = Logger.instance.info.bind(Logger.instance);
export const success = Logger.instance.success.bind(Logger.instance);
export const warning = Logger.instance.warning.bind(Logger.instance);
export const error = Logger.instance.error.bind(Logger.instance);