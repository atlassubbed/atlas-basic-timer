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

Optionally, you can use `stat` mode to obtain **more detailed statistics**, such as the mean and standard deviation.

## examples

For the examples, let's assume we have a `randomArray` function which returns a new `Array` of `100` random numbers between `0` and `1`.

#### run a timing test

```javascript
const Timer = require("atlas-basic-timer");
const myTask = () => randomArray().sort();
// make a new timer
const myTimer = Timer();
// run myTask once, return duration in ns
const durationNanosecs = myTimer(myTask)
// ~$ myTask x 1 took 142.571us
```

#### specify a number of iterations

```javascript
...
// we want n = 1000 iterations
const myTimer = Timer({n: 1000});
const durationNanosecs = myTimer(myTask)
// ~$ myTask x 1000 took 15.475ms
```

#### specify higher precision

By default, the logged output time will be rounded to 3 decimal places. You can tell the timer to use more accuracy:

```javascript
...
// we want 6 decimal places in the log output
const myTimer = Timer({dec: 6, n: 1000})
const durationNanosecs = myTimer(myTask)
// ~$ myTask x 1000 took 15.474757ms
```

Note that the `durationNanosecs` return value will never be rounded, only the logged output is rounded.

#### disable logs

```javascript
...
// we don't want to log anything to the console
const myTimer = Timer({log: false, n: 1000})
const durationNanosecs = myTimer(myTask)
```

#### getting more stats

```javascript
...
// get more than just the elapsed time
const myTimer = Timer({stat: true, n: 1000})
const stats = myTimer(myTask);
// ~$ myTask x 1000 took 15.474757ms (12.432us +/- 1.321us)
console.log(stats)
// {
//   n: 1000,
//   elapsed: 15474757,
//   mean: 15474.757,
//   stddev: 5482.2874,
//   median: 12432.234,
//   mad: 1321.21124
// }
```

## todo

Modify the timer to take an optional `done` callback, so async tasks could be timed. Async tasks would be run serially, with a serial-execution library.