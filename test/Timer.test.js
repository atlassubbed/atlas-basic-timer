const { describe, it } = require("mocha")
const { expect } = require("chai")
const rewire = require("rewire")
const Cleaner = require("atlas-cleanup-tests")
const Timer = rewire("../src/Timer")
const { makeAsyncJob } = require("./util")

let revert;

const cleanup = Cleaner(() => revert && revert())

describe("Timer", function(){

  beforeEach(function(){
    revert && revert();
  })

  it("should return a timer", function(){
    expect(Timer({log: false})).to.be.a("function");
  })

  describe("timer", function(){
    describe("runs the given task", function(){
      it("should throw error if not given a valid task", function(){
        const timer = Timer({log: false});
        const invalidTasks = [{}, new Date(), 4, 5.6, null, undefined, true, "", /reg/, []];
        invalidTasks.forEach(task => {
          expect(() => timer(task)).to.throw("task must be fn")
        })
      })
      it("should throw error if not given a valid number of samples", function(){
        const timer = Timer({log: false});
        const invalidSamples = [{}, new Date(), true, /reg/, [], Infinity, -20, -Infinity];
        invalidSamples.forEach(sample => {
          expect(() => timer(() => {}, sample)).to.throw("samples must be non-zero, finite num")
        })
      })
      it("should run the task once", function(){
        let calledTask = 0;
        Timer({log: false})(() => calledTask++)
        expect(calledTask).to.equal(1);
      })
      it("should run an async task once and call the callback when done", function(testDone){
        const task = makeAsyncJob(20)
        let calledTask = 0, numRunning = 0;
        Timer({log: false})(done => {
          calledTask++
          expect(++numRunning).to.equal(1)
          task(() => {
            expect(--numRunning).to.equal(0)
            done()
          })
        }, () => {
          expect(calledTask).to.equal(1);
          testDone();
        })
      })
      it("should serially run async samples and call the callback when done", function(testDone){
        const task = makeAsyncJob(5), s = 3;
        let calledTask = 0, numRunning = 0;
        Timer({log: false})(done => {
          calledTask++
          expect(++numRunning).to.equal(1)
          task(() => {
            expect(--numRunning).to.equal(0)
            done()
          })
        }, s, () => {
          expect(calledTask).to.equal(s);
          testDone();
        })
      })
    })
    describe("returns time stats for the given task", function(){
      describe("async tasks with a callback", function(){
        it("should return correct time diff in the done callback", function(testDone){
          const t0 = 5, t1 = 10, task = makeAsyncJob(20);
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            hrtime: oldTime => {
              if(++calledTime > 1){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(1)
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined;
              expect(calledTask).to.equal(0)
              return t0;
            }
          })
          Timer({log:false})(done => {
            calledTask++;
            task(done)
          }, (errs, elapsed) => {
            expect(errs).to.be.an("array").with.lengthOf(0);
            expect(calledTask).to.equal(1)
            expect(elapsed).to.equal(t1-t0)
            testDone();
          })
        })
        it("should return time diff in the done callback if samples is 1", function(testDone){
          const task = makeAsyncJob(20);
          Timer({log:false})(task, 1, (errs, elapsed) => {
            expect(elapsed).to.be.a("number");
            testDone();
          })
        })
        it("should return correct stats in the done callback if multiple samples", function(testDone){
          const t0 = 5, t1 = 10, task = makeAsyncJob(5), s = 3
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            hrtime: oldTime => {
              calledTime++;
              if (!(calledTime % 2)){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(calledTime/2);
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined
              expect(calledTask).to.equal((calledTime-1)/2);
              return t0
            }
          })
          Timer({log:false})(done => {
            calledTask++;
            task(done)
          }, s, (errs, stats) => {
            expect(errs).to.be.an("array").with.lengthOf(0);
            expect(calledTask).to.equal(s)
            expect(stats).to.deep.equal({
              size: s, 
              total: s*(t1-t0), 
              mean: t1-t0, 
              stddev: 0,
              median: t1-t0,
              mad: 0
            })
            testDone();
          })
        })
        it("should return encountered errors in the done callback", function(testDone){
          const task = makeAsyncJob(5), s = 10;
          let calledTask = 0;
          Timer({log:false})(done => {
            const id = calledTask++;
            task(() => done(id%2 ? new Error(id) : null))
          }, s, errs => {
            expect(errs).to.be.an("array").with.lengthOf(5);
            errs.forEach((err,i) => {
              expect(err).to.be.an("error")
              expect(err.message).to.equal(""+(2*i+1))
            })
            testDone();
          })
        })
      })
      describe("sync tasks with no callback", function(){
        it("should return correct time diff", cleanup(function(){
          const t0 = 5, t1 = 10;
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            "hrtime": oldTime => {
              if(++calledTime > 1){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(1)
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined;
              expect(calledTask).to.equal(0)
              return t0;
            }
          })
          const deltaTime = Timer({log:false})(() => calledTask++);
          expect(deltaTime).to.equal(t1-t0)
        }))
        it("should return the time diff if samples is 1", cleanup(function(){
          const deltaTime = Timer({log:false})(() => {}, 1);
          expect(deltaTime).to.be.a("number")
        }))
        it("should return the correct stats if multiple samples", cleanup(function(){
          const t0 = 5, t1 = 10, s = 3
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            "hrtime": oldTime => {
              calledTime++;
              if (!(calledTime % 2)){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(calledTime/2);
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined
              expect(calledTask).to.equal((calledTime-1)/2);
              return t0
            }
          })
          const stats = Timer({log:false})(() => calledTask++, s);
          expect(stats).to.deep.equal({
            size: s, 
            total: s*(t1-t0), 
            mean: t1-t0, 
            stddev: 0,
            median: t1-t0,
            mad: 0
          })
        }))  
      })
    })
    describe("logs time stats for a given task", function(){
      it("should not log anything if logging disabled", cleanup(function(){
        let calledLog = false;
        revert = Timer.__set__("console.log", msg => {calledLog = true})
        Timer({log:false})(() => {})
        expect(calledLog).to.be.false;
      }))
      describe("with multiple samples", function(){
        it("should log stats for a named task", cleanup(function(){
          const dt = 5, myTask = () => {}, s = 3;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`myTask (x ${s}) took ${s*dt}.000ns (${dt}.000ns +/- 0.000ns)`)
            },
            "hrtime": () => dt
          })
          Timer()(myTask, s)
          expect(calledLog).to.be.true;
        }))
        it("should log stats for an anonymous task", cleanup(function(){
          const dt = 5, s = 3;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task (x ${s}) took ${s*dt}.000ns (${dt}.000ns +/- 0.000ns)`)
            },
            "hrtime": () => dt
          })
          Timer()(() => {}, s)
          expect(calledLog).to.be.true;
        }))
        it("should log stats in the specified precision", cleanup(function(){
          const dt = 5, s = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task (x ${s}) took ${s*dt}.000000ns (${dt}.000000ns +/- 0.000000ns)`)
            },
            "hrtime": () => dt
          })
          Timer({dec: 6})(() => {}, s)
          expect(calledLog).to.be.true;
        }))
      })
      describe("with a single sample", function(){
        it("should log time diff for a named task", cleanup(function(){
          const dt = 5, myTask = () => {};
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`myTask took ${dt}.000ns`)
            },
            "hrtime": () => dt
          })
          Timer()(myTask)
          expect(calledLog).to.be.true;
        }))
        it("should log time diff for an anonymous task", cleanup(function(){
          const dt = 5;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task took ${dt}.000ns`)
            },
            "hrtime": () => dt
          })
          Timer()(() => {})
          expect(calledLog).to.be.true;
        }))
        it("should log time diff in the specified precision", cleanup(function(){
          const dt = 5;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task took ${dt}.000000ns`)
            },
            "hrtime": () => dt
          })
          Timer({dec: 6})(() => {})
          expect(calledLog).to.be.true;
        }))
      })
    })
  })
})
