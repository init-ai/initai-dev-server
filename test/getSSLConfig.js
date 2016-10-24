'use strict'

const fs = require('fs')
const path = require('path')

const getSSLConfig = require('../src/getSSLConfig')

describe('getSSLConfig', () => {
  it('returns a cetificate and key', () => {
    expect(getSSLConfig()).to.have.all.keys(['certificate', 'key'])
  })
})
