const handleInvalidArguments = require('../src/handleInvalidArguments')

describe('handleInvalidArguments', () => {
  it('returns default message', () => {
    const result = handleInvalidArguments(['foo'])

    expect(result).to.equal('"foo" is not a valid command\u001b[90m\n\nTo see all availble commands, run: \u001b[39m\u001b[0m\u001b[1m\u001b[34m\u001b[4miai --help\u001b[24m\u001b[39m\u001b[22m\u001b[0m')
  })

  describe('suggestions', () => {
    it('returns list', () => {
      const fakeArgs = ['wtch']
      const result = handleInvalidArguments(fakeArgs)

      expect(result).to.equal('\u001b[90mUnknown command. Did you mean:\n\u001b[39m\n$ iai watch\u001b[90m\n\nTo see all availble commands, run: \u001b[39m\u001b[0m\u001b[1m\u001b[34m\u001b[4miai --help\u001b[24m\u001b[39m\u001b[22m\u001b[0m')
    })
  })
})
