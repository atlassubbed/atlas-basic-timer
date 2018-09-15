const hrtime = require("atlas-hrtime")();
const Queue = require("atlas-concurrent-queue")
const Dataset = require("atlas-dataset");
const { isPos, isFn, pretty } = require("./util")

// rule: if class has single public method, use a factory instead.
module.exports = ({log=true, dec=3}={}) => {
  const report = (task, data) => {
    const isStat = data.size() > 1;
    if (log){
      let msg = task.name || "task";
      if (isStat) msg += ` (x ${data.size()})`;
      msg += ` took ${pretty(data, dec)}`;
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
      let t0;
      while(samples--)
        t0 = hrtime(), task(), data.add(hrtime(t0));
      return report(task, data);
    }
    const errs = []
    const sampleQ = new Queue(1, () => cb(errs, report(task, data)));
    while(samples--) sampleQ.push(endSample => {
      let t0;
      const taskQ = new Queue(1, () => {
        data.add(hrtime(t0)), endSample()
      });
      t0 = hrtime();
      taskQ.push(endTask => task(err => {
        err && errs.push(err), endTask();
      }));
    })
  }
}
