/* eslint-disable @daldalso/multiline-expression-spacing */
import col from "./colog";
import Logger, { error, info, log, success, warning } from "./logger";
import { createDirectorySubscriber, createFileSubscriber } from "./subscribers";
import { LogLevel } from "./types";

// Log levels
{
  log`Starting...`;
  info`Update available: ${col.underline.lCyan`v1.2.3`}`;
  success`Initialization completed!`;
  warning`Processing might fail due to the lack of memory`;
  error`Error while processing: ${new RangeError("foo")}`;
}

// Values
{
  log("String");
  log`${1234} ${true} ${123n}`;
  log(Symbol("hi"));
  log`${undefined} ${null}`;
  log(foo);
  log((a:number) => a + 1);
  log(console.log);
  log(Logger);
  log(/foo/g);
  log(new Date());
  log([ "Short Array", true ]);
  log([ "Long Array", [ 123, "Hello!\n\nNice to meet you.\nHow are you?", () => /bar/ ] ]);
  log({ type: "Short Object" });
  log({ type: "Long Object", 'isn\'t': "is not", [Symbol("hi")]: new Date() });

  const circularArray:any[] = [ "Circular", 2 ];
  const circularObject:object = { foo: 1, bar: 2, baz: circularArray };

  circularArray.push({ a: circularArray, b: circularObject });
  Object.assign(circularObject, { this: circularObject });
  log`${circularArray}`;
}

// Special cases
{
  log()['Very long very long very long very long']("Foo");
  log("very long string! ".repeat(1000), Array.from({ length: 1000 }).fill("Very long array!"));
  log(
    [ foo, new Date() ],
    { x: true },
    col.red.underline`colored`
  );
  log`${col.lGreen`GET`} /users`
    ['IP']`127.0.0.1`
    ['Headers']({
      'Content-Type': "application/json",
      'User-Agent': "Gorilla WaterFox"
    })
    ['Response'](200, "OK")
  ;
  log(
    new Blob([]),
    new File([], "hi"),
    new Float64Array(Array.from({ length: 500 }).map((_, i) => i % 256)),
    Buffer.from("Hello, World!")
  );
  log(
    new Set([ 1, 2, 3 ]),
    new Map<any, any>([ [ /foo/, "a" ], [ 2, "b" ], [ "hello", "world" ] ])
  );

  const promise1 = Promise.resolve(true);
  const promise2 = Promise.reject(false);
  const promise3 = new Promise(res => setTimeout(res, 100));

  promise1.then(() => {
    log(promise1, promise2, promise3);
  });
}

// Tooling & styling
{
  const logger = new Logger({
    headings: {
      [LogLevel.VERBOSE]: col.bgLBlack` LOG `
    },
    headerFormat: `${col.magenta`main`}: $H `,
    indent: 12
  });
  logger.subscribe(console.log, { colored: true });
  logger.subscribe(createFileSubscriber("./example.log"), { colored: false });
  logger.subscribe(createDirectorySubscriber("./logs", { type: "size", maxBytes: 500 }), { colored: false });
  logger.verbose("Hello, World!", new Date());
}
global.setTimeout(() => {
  process.exit();
}, 100);

function foo(bar:number):number{
  return bar ** 2;
}