'use strict'

const parseLogLevelFromArgs = require('../src/parseLogLevelFromArgs')

describe('parseLogLevelFromArgs', () => {
  let fakeArgs

  beforeEach(() => {
    fakeArgs = ['foo', 'bar', '--log-level=warn']
  })

  it('returns an Object with filtered arguments', () => {
    const result = parseLogLevelFromArgs(fakeArgs)

    expect(result).to.deep.equal({
      logLevel: 'warn',
      filteredArgs: ['foo', 'bar']
    })
  })

  it('does not mutate original args', () => {
    fakeArgs = fakeArgs.slice(0, 2)

    const result = parseLogLevelFromArgs(fakeArgs)

    // Referentially dissimilar
    expect(result.filteredArgs).not.to.equal(fakeArgs)

    // Structurally equal
    expect(result.filteredArgs).to.deep.equal(fakeArgs)
  })

  it('returns updated (non-default) log level', () => {
    fakeArgs[2] = '--log-level=debug'

    const result = parseLogLevelFromArgs(fakeArgs)

    expect(result.logLevel).to.equal('debug')
  })

  it('accepts the last log-level provided', () => {
    fakeArgs.push('--log-level=debug')

    const result = parseLogLevelFromArgs(fakeArgs)

    expect(result.logLevel).to.equal('debug')
  })

  it('throws an error if an invalid log level is provided', () => {
    function run() {
      parseLogLevelFromArgs(['foo', '--log-level=x'])
    }

    expect(run).to.throw('A valid Log Level must be provided')
  })

  it('throws an error if no level is provided', () => {
    function run() {
      parseLogLevelFromArgs(['foo', '--log-level='])
    }

    expect(run).to.throw('A valid Log Level must be provided')
  })

  it('defaults to "log" if not set', () => {
    const result = parseLogLevelFromArgs(['foo', '--log-level'])

    expect(result.logLevel).to.equal('log')
  })
})
