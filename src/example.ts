/* eslint-disable @daldalso/multiline-expression-spacing */
import col from "./colog";
import Logger, { error, info, log, success, warning } from "./logger";

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
  const circularObject:object = { foo: 1, bar: 2 };

  circularArray.push({ a: circularArray, b: circularObject });
  Object.assign(circularObject, { this: circularObject });
  log`${circularArray}`;
}

// Multiple values
{
  log(
    [ foo, new Date() ],
    { x: true },
    col.red.underline`colored`
  );
  log`${col.yellow`GET`} /users`
    ['IP']`127.0.0.1`
    ['Headers']({
      'Content-Type': "application/json",
      'User-Agent': "Gorilla WaterFox"
    })
    ['Response'](200, "OK")
  ;
}

function foo(bar:number):number{
  return bar ** 2;
}