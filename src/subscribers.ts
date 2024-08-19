import type { WriteStream } from "fs";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { LogLevel, type Subscriber } from "./types";

type DirectorySubscriberStrategy = ({
  'type': "size",
  'maxBytes': number
}|{
  'type': "time",
  'interval': "hourly"|"daily"|"weekly"|"monthly"|"yearly"
})&{
  /**
   * @deprecated Not yet implemented!
   */
  'compressFormerLogs'?: boolean,
  /**
   * @default 10000
   */
  'checkInterval'?: number
};
const dateKeyByInterval:Record<string, (date:Date) => number> = {
  hourly: date => date.getHours(),
  daily: date => date.getDate(),
  weekly: date => (date.getTime() - new Date().getTimezoneOffset() * 60000 - 259200000) / 604800000,
  monthly: date => date.getMonth(),
  yearly: date => date.getFullYear()
};

export function createStandardSubscriber():Subscriber{
  return (level, value) => {
    switch(level){
      case LogLevel.ERROR: console.error(value); break;
      case LogLevel.WARNING: console.warn(value); break;
      case LogLevel.INFO: console.info(value); break;
      default: console.log(value); break;
    }
  };
}
export function createFileSubscriber(path:string):Subscriber{
  const stream = createWriteStream(path, { flags: "a" });
  const R:Subscriber = (_, value) => {
    stream.write(value);
    stream.write("\n");
  };
  R.destructor = () => {
    stream.end();
  };
  return R;
}
export function createDirectorySubscriber(path:string, strategy:DirectorySubscriberStrategy):Subscriber{
  if(!existsSync(path)){
    mkdirSync(path);
  }
  const checkInterval = strategy.checkInterval ?? 10000;
  let timer:NodeJS.Timer;
  let stream:WriteStream;
  let currentDateKey:number;
  switch(strategy.type){
    case "size":
      timer = global.setInterval(() => {
        console.log(stream.bytesWritten);
        if(stream.bytesWritten < strategy.maxBytes){
          return;
        }
        stream.end();
        switchToNextStream();
      }, checkInterval);
      break;
    case "time":
      timer = global.setInterval(() => {
        if(currentDateKey === dateKeyByInterval[strategy.interval](new Date())){
          return;
        }
        stream.end();
        switchToNextStream();
      }, checkInterval);
      break;
  }
  const R:Subscriber = (_, value) => {
    stream.write(value);
    stream.write("\n");
  };
  R.destructor = () => {
    stream.end();
  };
  switchToNextStream();
  return R;

  function switchToNextStream():void{
    const chunk = new Date().toJSON().match(/^\d{2}(\d{2})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.\d{3}Z$/);
    if(!chunk) throw Error(`Unexpected date format: ${new Date().toJSON()}`);
    const name = chunk[1] + chunk[2] + chunk[3] + "-" + chunk[4] + chunk[5] + chunk[6] + ".log";

    stream = createWriteStream(resolve(path, name), { flags: "a" });
    if(strategy.type === "time"){
      currentDateKey = dateKeyByInterval[strategy.interval](new Date());
    }else{
      currentDateKey = -1;
    }
  }
}