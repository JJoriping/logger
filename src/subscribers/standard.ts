import type { Subscriber } from "../types.js";
import { LogLevel } from "../types.js";

export default function createStandardSubscriber():Subscriber{
  return (level, value) => {
    switch(level){
      case LogLevel.ERROR: console.error(value); break;
      case LogLevel.WARNING: console.warn(value); break;
      case LogLevel.INFO: console.info(value); break;
      default: console.log(value); break;
    }
  };
}