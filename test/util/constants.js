const constants = require('../../src/util/constants')

describe('constants', () => {
  describe('Origins', () => {
    describe('CORS', () => {
      describe('ALL', () => {
        it('returns mutated origin list', () => {
          expect(constants.Origins.CORS.ALL[0]).to.equal(
            constants.OriginList[0] + ':3045'
          )
        })
      })
    })

    describe('Sockets', () => {
      describe('ALL', () => {
        it('appends port glob to each origin', () => {
          constants.Origins.Sockets.ALL.forEach((origin, i) => {
            expect(origin).to.equal(constants.OriginList[i] + ':*')
          })
        })
      })
    })
  })
})
