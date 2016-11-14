'use strict'

const restify = require('restify')
const socketio = require('socket.io')

const Server = require('../src/Server')

describe('Server', () => {
  describe('constructor', () => {
    let fakeHTTPServer, fakeSocketServer

    beforeEach(() => {
      fakeHTTPServer = {foo: 'bar'}
      fakeSocketServer = {bar: 'baz'}

      sandbox.stub(Server.prototype, 'configureHTTPServer').returns(fakeHTTPServer)
      sandbox.stub(Server.prototype, 'configureSocketServer').returns(fakeSocketServer)
      sandbox.stub(Server.prototype, 'configureHandlers')
      sandbox.stub(Server.prototype, 'startHTTPServer')
    })

    it('assigns an httpServer', () => {
      const server = new Server()
      expect(server.httpServer).to.equal(fakeHTTPServer)
    })

    it('assigns a socketServer', () => {
      const server = new Server()
      expect(server.socketServer).to.equal(fakeSocketServer)
    })

    it('configures handlers', () => {
      const server = new Server()
      expect(server.configureHandlers).to.have.been.called
    })

    it('starts the server', () => {
      const server = new Server()
      expect(server.startHTTPServer).to.have.been.called
    })
  })

  describe('configureHTTPServer', () => {
    let fakeHTTPServer, fakeCORSResult, fakeBodyParserResult

    beforeEach(() => {
      fakeHTTPServer = {
        use: sandbox.spy()
      }

      fakeCORSResult = {origins: '123'}

      sandbox.stub(restify, 'createServer').returns(fakeHTTPServer)
      sandbox.stub(restify, 'CORS').returns(fakeCORSResult)
      sandbox.stub(restify, 'bodyParser').returns(fakeBodyParserResult)
    })

    it('creates a restify server', () => {
      const server = Server.prototype.configureHTTPServer()

      expect(server).to.deep.equal(fakeHTTPServer)
      expect(restify.createServer).to.have.been.calledWith({
        certificate: sinon.match.string,
        key: sinon.match.string,
        name: 'Init.ai Dev Server',
      })
    })

    it('enables CORS', () => {
      Server.prototype.configureHTTPServer()

      expect(fakeHTTPServer.use).to.have.been.calledWith(fakeCORSResult)
      expect(restify.CORS).to.have.been.calledWith({
        origins: sinon.match.array,
      })
    })

    it('enables bodyParser', () => {
      Server.prototype.configureHTTPServer()

      expect(fakeHTTPServer.use).to.have.been.calledWith(fakeBodyParserResult)
      expect(restify.bodyParser).to.have.been.called
    })
  })

  describe('configureSocketServer', () => {
    let fakeContext, fakeSocketServer

    beforeEach(() => {
      fakeContext = {httpServer: {server: 'foo'}}
      fakeSocketServer = {
        set: sandbox.spy(),
        on: sandbox.spy()
      }

      sandbox.stub(socketio, 'listen').returns(fakeSocketServer)
    })

    it('returns a socket server instance', () => {
      const result = Server.prototype.configureSocketServer.call(fakeContext)

      expect(result).to.equal(fakeSocketServer)
    })

    it('restricts origins', () => {
      Server.prototype.configureSocketServer.call(fakeContext)

      expect(fakeSocketServer.set).to.have.been.calledWith(
        'origins',
        'http://localhost:*, http://s-csi.init.ai.s3-website-us-east-1.amazonaws.com:*, https://p-csi.init.ai:*, https://csi.init.ai:*'
      )
    })

    it('instantiates a new SocketApp on connection', () => {
      Server.prototype.configureSocketServer.call(fakeContext)

      expect(fakeSocketServer.on).to.have.been.calledWith('connection', sinon.match.func)
    })
  })

  // TODO: Test handlers. We may end up not using them since we have sockets
  describe('configureHandlers', () => {})
})
