const hrtime = require("atlas-hrtime")();
const fmt = require("atlas-pretty-hrtime");
const Queue = require("atlas-concurrent-queue")
const Dataset = require("atlas-dataset");
const { isPos, isFn, msg } = require("./util")

// rule: if class has single public method, use a factory instead.
module.exports = ({log = true, stat = false, dec = 3, n = 1}={}) => {
  if (!isPos(n)) throw new Error("n must be non-zero, finite num");
  const report = (task, data) => {
    if (log){
      const name = task.name || "task";
      let msg = `${name} x ${n} took ${fmt(data.sum(), dec)}`;
      if (stat) msg += ` (${fmt(data.median(), dec)} +/- ${fmt(data.mad(), dec)})`;
      console.log(msg)
    }
    return stat ? data.snapshot() : data.sum()
  }
  return (task, cb) => {
    if (!isFn(task)) 
      throw new Error("task must be fn");
    const data = new Dataset([])
    if (!cb){
      for (let i = n; i--;) {
        const t0 = hrtime();
        task();
        data.add(hrtime(t0))
      }
      return report(task, data);
    }
    const errs = [], queue = new Queue(1, () => cb(errs, report(task, data)));
    for (let i = n; i--;) queue.push(done => {
      const t0 = hrtime();
      task(err => {
        data.add(hrtime(t0));
        err && errs.push(err);
        done();
      })
    })
  }
}
