# atlas-basic-timer

A basic timer for performance testing which uses high resolution time and falls back to low resolution if required.

[![Travis](https://img.shields.io/travis/atlassubbed/atlas-basic-timer.svg)](https://travis-ci.org/atlassubbed/atlas-basic-timer)

---

## install

```
npm install --save atlas-basic-timer
```

## why

I have re-written simple timer scripts so many times, I figured I'd just write a basic timer to use. This timer is simple -- it takes a task and a number of iterations, and tells you how long it ran in nanoseconds (not guaranteed to be accurate to nanoseconds, but uses `process.hrtime` if it's available).

## examples

For the examples, let's assume we have a `randomArray` function which returns a new Array of `100` random numbers between `0` and `1`.

#### run a timing test

```javascript
const Timer = require("atlas-basic-timer");
const shouldLog = true;
const timer = Timer(shouldLog);
const myTask = () => randomArray().sort();
// runs myTask, returns duration in nanoseconds
const durationNanosecs = timer(myTask)
// (logging output)
// myTask x 1 took 142.571us
```

#### specify a number of iterations

```javascript
...
const myTask = () => randomArray().sort();
// runs myTask 1000 times
const durationNanosecs = timer(myTask, 1000)
// (logging output)
// myTask x 1000 took 15.475ms
```

#### specify higher precision

```javascript
...
// if shouldLog, prints 6 decimal places (default 3)
const timer = Timer(shouldLog, 6)
const myTask = () => randomArray().sort();
const durationNanosecs = timer(myTask, 1000)
// (logging output)
// myTask x 1000 took 15.474757ms
```

#### disable logs

```javascript
...
const shouldLog = false;
const timer = Timer(shouldLog);
const myTask = () => randomArray().sort();
const durationNanosecs = timer(myTask, 1000)
// (no log output)
```
