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

Optionally, you can run each task with a number of samples, in which case the iterations will be run `samples`  times, for a total of `n * samples` tasks run.

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

#### specify a number of samples

```javascript
...
// we want 10 samples
const stats = myTimer(myTask, 10);
// ~$ myTask x 1000 (x 10) took 98.342ms (9.444ms +/- 1.840ms)
console.log(stats)
// { size: 10,
//   total: 98342047,   // total elapsed time to run 1000x10
//   mean: 9834204.7,
//   median: 9444400.5,
//   mad: 1839641.5,    // median absolute deviation
//   stddev: 2416776.9310497018 }
```

#### run async timing tests

Let's assume our random array method is async for this example.

```javascript
const myTask = done => {
  randomArray(arr => {
    arr.sort();
    done();
  })
}
const myTimer = Timer({n: 1000});
// run myTask 1000 times in serial
myTimer(myTask, (errs, durationNanosecs) => {
  if (errs.length)
    console.log(`${errs.length} tasks failed`);
})
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
