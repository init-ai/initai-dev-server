'use strict'

const fs = require('fs')
const path = require('path')

const getSSLConfig = require('../src/getSSLConfig')

describe('getSSLConfig', () => {
  it('returns a cetificate and key', () => {
    const sc = getSSLConfig()
    expect(sc).to.have.all.keys(['certificate', 'key'])
    expect(sc.certificate).to.be.defined
    expect(sc.key).to.be.defined
  })
})
