const logger = require('../../src/util/logger')
const chalk = require('chalk')

describe('logger', function () {
  beforeEach(function () {
    sandbox.stub(console, 'log')
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('log', () => {
    it('writes colorized message to console.log', () => {
      logger.log('foo')

      expect(console.log).to.have.been.calledWith('\u001b[90mfoo\u001b[39m')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })

    it('writes message with multiple arguments to console.log with prefix', () => {
      logger.log('foo', 'bar', 'baz')

      expect(console.log).to.have.been.calledWith('\u001b[90mfoo\u001b[39m', '\u001b[90mbar\u001b[39m', '\u001b[90mbaz\u001b[39m')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })
  })

  describe('logError', () => {
    it('writes message to console.log with prefix', () => {
      logger.logError('foo')

      expect(console.log).to.have.been.calledWith('\u001b[1m\u001b[31m[ERROR]\u001b[39m\u001b[22m', 'foo')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })

    it('writes message with multiple arguments to console.log with prefix', () => {
      logger.logError('foo', 'bar', 'baz')

      expect(console.log).to.have.been.calledWith('\u001b[1m\u001b[31m[ERROR]\u001b[39m\u001b[22m', 'foo', 'bar', 'baz')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })
  })

  describe('logSuccess', () => {
    it('writes message to console.log with prefix', () => {
      logger.logSuccess('foo')

      expect(console.log).to.have.been.calledWith('\u001b[1m\u001b[32m[SUCCESS]\u001b[39m\u001b[22m', 'foo')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })
  })

  describe('logWarning', () => {
    it('writes message to console.log with prefix', () => {
      logger.logWarning('foo')

      expect(console.log).to.have.been.calledWith('\u001b[1m\u001b[33m[WARNING]\u001b[39m\u001b[22m', 'foo')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })

    it('writes message with multiple arguments to console.log with prefix', () => {
      logger.logWarning('foo', 'bar', 'baz')

      expect(console.log).to.have.been.calledWith('\u001b[1m\u001b[33m[WARNING]\u001b[39m\u001b[22m', 'foo', 'bar', 'baz')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })
  })

  describe('print', () => {
    it('writes message to console.log with prefix', () => {
      logger.print('foo')

      // expect(console.log).to.have.been.calledWith('\\u001b[1m\\u001b[33m[WARNING]\\u001b[39m\\u001b[22m', 'foo')
      expect(console.log.args[0][0]).to.equal('\u001b[90m---------------------------------------------\u001b[39m')
      expect(console.log.args[1][0]).to.equal('foo')
      expect(console.log.args[2][0]).to.equal('\u001b[90m---------------------------------------------\u001b[39m')

      sandbox.restore() // TODO: Leave this here. It is intentional!
    })

    it('writes message with multiple arguments to console.log with prefix', () => {
      logger.print('foo', 'bar', 'baz')

      expect(console.log).to.have.been.calledWith('foo', 'bar', 'baz')

      sandbox.restore() // TODO: Leave this here. It is intentional!
    })
  })

  describe('getCommonAppendix', () => {
    it('returns a styled string', () => {
      expect(logger.getCommonAppendix()).to.equal('\u001b[90m\n\nTo see all availble commands, run: \u001b[39m\u001b[0m\u001b[1m\u001b[34m\u001b[4miai --help\u001b[24m\u001b[39m\u001b[22m\u001b[0m')
      sandbox.restore() // TODO: Leave this here. It is intentional!
    })
  })
})
