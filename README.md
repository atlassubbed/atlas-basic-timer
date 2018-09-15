# atlas-basic-timer

A basic timer for performance testing which uses high resolution time and falls back to low resolution if required.

[![Travis](https://img.shields.io/travis/atlassubbed/atlas-basic-timer.svg)](https://travis-ci.org/atlassubbed/atlas-basic-timer)

---

## install

```
npm install --save atlas-basic-timer
```

## why

I have re-written simple timer scripts so many times, I figured I'd just write a basic timer to use. This timer is simple -- it takes a task and tells you how long it ran in nanoseconds (not guaranteed to be accurate to nanoseconds, but uses `process.hrtime` if it's available).

Optionally, you can run each task with a number of samples, in which case the task will be run `samples` times. Note that the standard deviation is *not* used in the logging output. There's a lot going on behind the scenes in JavaScript (and on your computer), so benchmarks tend to fluctuate wildly. We use the more robust [median absolute deviation](https://github.com/atlassubbed/atlas-mad), which helps negate contributions from outliers in a sample of data.

## examples

For the examples, let's assume we have a `randomArray` function which returns a new `Array` of random numbers between `0` and `1`.

#### run a timing test

```javascript
const Timer = require("atlas-basic-timer");
const myTask = () => randomArray().sort();
// make a new timer
const myTimer = Timer();
// run myTask once, return duration in ns
const durationNanosecs = myTimer(myTask)
// ~$ myTask took 142.571us
```

#### specify a number of samples

```javascript
...
// we want 10 samples
const stats = myTimer(myOtherTask, 10);
// ~$ myOtherTask (x 10) took 98.342ms (9.444ms +/- 1.840ms)
console.log(stats)
// { size: 10,
//   total: 98342047,
//   mean: 9834204.7,
//   median: 9444400.5,
//   mad: 1839641.5,    // median absolute deviation
//   stddev: 2416776.9310497018 }
```

#### run async timing tests

Let's assume our random array method is async for this example. Note that when running `s` samples for an async function, your function is run `s` times in serial to help keep each run independent of the other.

```javascript
const myTask = done => {
  randomArray(arr => {
    arr.sort();
    done();
  })
}
const myTimer = Timer();
myTimer(myTask, (errs, durationNanosecs) => {
  // errs.length can be up to 1 since we are running 1 sample.
  if (errs.length)
    console.log(`${errs.length} tasks failed`);
})
// ~$ myTask took 15.475ms
```

#### specify higher precision

By default, the logged output time will be rounded to 3 decimal places. You can tell the timer to use more accuracy:

```javascript
...
// we want 6 decimal places in the log output
const myTimer = Timer({dec: 6})
const durationNanosecs = myTimer(myTask)
// ~$ myTask took 15.474757ms
```

Note that the `durationNanosecs` return value will never be rounded, only the logged output is rounded.

#### disable logs

```javascript
...
// we don't want to log anything to the console
const myTimer = Timer({log: false})
const durationNanosecs = myTimer(myTask)
```

## caveats

#### changes from v2.0.0

Before, we allowed a number of iterations to specified when a timer was instantiated. We're deprecated this feature because it conflicts with the number of samples, supplied when the timer instance is called, and leads to unecessary confusion. To keep things simple, just specify the number of samples you'd like to run when you're running a timer. 

Suppose you have a very small task that you'd like to time:

```
const pushObjToArray = () => arr.push({});
```

This task is too small to result in any meaningful metrics. You may use a while loop inside the body to inflate your task:

```
const pushObjToArray = () => {
  let n = 1e6;
  while(n--) arr.push({});
}
```

If you need to test multiple different batch sizes, consider using a task factory:

```
const makePushJob = n => (i=n) => {
  while(i--) arr.push({});
}

const pushOneMillionTask = makePushJob(1e6);
```

#### microbenchmarks

Microbenchmarks like this are not recommended. You might want to use a more robust timer like benchmark.js if you need to do microbenchmarks.
