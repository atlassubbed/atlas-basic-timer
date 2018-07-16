const makeAsyncJob = timeout => done => {
  setTimeout(() => done(), timeout)
}

module.exports = { makeAsyncJob }
