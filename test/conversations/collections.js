const collections = require('../../src/conversations/collections')

describe('deduplicate', () => {
  it('removes duplicate items from arrays', () => {
    const originalArray = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]

    const result = collections.deduplicate(originalArray, item => item)

    expect(result.length).to.equal(5)
    expect(result).to.have.members([1, 2, 3, 4, 5])
  })
})
