const hrtime = require("atlas-hrtime")();
const fmt = require("atlas-pretty-hrtime");
const Queue = require("atlas-concurrent-queue")
const Dataset = require("atlas-dataset");
const { isPos, isFn, msg } = require("./util")

// rule: if class has single public method, use a factory instead.
module.exports = ({log = true, dec = 3, n = 1}={}) => {
  if (!isPos(n)) throw new Error("n must be non-zero, finite num");
  const report = (task, data) => {
    const isStat = data.size() > 1;
    if (log){
      const name = task.name || "task";
      let msg = `${task.name || "task"} x ${n}`;
      if (isStat) msg += ` (x ${data.size()})`
      msg += ` took ${fmt(data.sum(), dec)}`;
      if (isStat) msg += ` (${fmt(data.median(), dec)} +/- ${fmt(data.mad(), dec)})`;
      console.log(msg)
    }
    return isStat ? data.snapshot() : data.sum()
  }
  return (task, samples, cb) => {
    if (isFn(samples)) cb = samples, samples = 1;
    samples = samples || 1
    if (!isPos(samples)) 
      throw new Error("samples must be non-zero, finite num");
    if (!isFn(task)) 
      throw new Error("task must be fn");
    const data = new Dataset([])
    if (!cb){
      while(samples--){
        let t0 = hrtime(), i = n;
        while(i--) task();
        data.add(hrtime(t0))
      }
      return report(task, data);
    }
    const errs = []
    const sampleQ = new Queue(1, () => cb(errs, report(task, data)));
    while(samples--) sampleQ.push(endSample => {
      let i = n, t0;
      const taskQ = new Queue(1, () => {
        data.add(hrtime(t0)), endSample()
      });
      t0 = hrtime();
      while(i--) taskQ.push(endTask => task(err => {
        err && errs.push(err), endTask();
      }));
    })
  }
}
