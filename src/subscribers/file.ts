import { createWriteStream } from "fs";
import type { Subscriber } from "../types.js";

export default function createFileSubscriber(path:string):Subscriber{
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