'use strict'

const conversations = require('../../src/conversations')

describe('extractClassifications', () => {
  const generateClassification = (baseType, subType, style) => {
    return {
      base_type: {
        value: baseType,
      },
      sub_type: {
        value: subType,
      },
      style: {
        value: style,
      },
    }
  }

  it('extracts classifications from a conversation', () => {
    const conversation = {
      messages: [
        {
          sender: 'app',
          parts: [{
            classifications: [
              generateClassification('a', 'b', 'c'),
              generateClassification('1', '2', '3'),
            ],
          }, {
            classifications: [
              generateClassification('x', 'y', 'z'),
              generateClassification('7', '8', '9'),
            ],
          }],
        },
        {
          sender: 'user',
          parts: [{
            classifications: [
              generateClassification('a', 'b', 'c'),
              generateClassification('q', 'r', 's'),
              generateClassification('x', 'y', 'z'),
            ],
          }],
        }
      ],
    }

    const result = conversations.extractClassifications([conversation])

    expect(result).to.deep.equal({
      inbound: [
        {
          base_type: {value: 'a'},
          sub_type: {value: 'b'},
          style: {value: 'c'},
        },
        {
          base_type: {value: 'q'},
          sub_type: {value: 'r'},
          style: {value: 's'},
        },
        {
          base_type: {value: 'x'},
          sub_type: {value: 'y'},
          style: {value: 'z'},
        },
      ],
      outbound: [
        {
          base_type: {value: 'a'},
          sub_type: {value: 'b'},
          style: {value: 'c'},
        },
        {
          base_type: {value: '1'},
          sub_type: {value: '2'},
          style: {value: '3'},
        },
        {
          base_type: {value: 'x'},
          sub_type: {value: 'y'},
          style: {value: 'z'},
        },
        {
          base_type: {value: '7'},
          sub_type: {value: '8'},
          style: {value: '9'},
        },
      ],
    })
  })

  it('extracts and dedupes classifications', () => {
    const conversation = {
      messages: [
        {
          sender: 'app',
          parts: [{
            classifications: [
              generateClassification('a', 'b', 'c'),
              generateClassification('1', '2', '3'),
            ],
          }, {
            classifications: [
              generateClassification('x', 'y', 'z'),
              generateClassification('7', '8', '9'),
            ],
          }],
        },
        {
          sender: 'user',
          parts: [{
            classifications: [
              generateClassification('a', 'b', 'c'),
              generateClassification('q', 'r', 's'),
              generateClassification('x', 'y', 'z'),
            ],
          }],
        },
        {
          sender: 'app',
          parts: [{
            classifications: [
              generateClassification('foo', 'bar', 'baz'),
            ],
          }, {
            classifications: [
              generateClassification('foo', 'bar', 'baz'),
              generateClassification('x', 'y', 'z'),
            ]
          }]
        },
        {
          sender: 'user',
          parts: [{
            classifications: [
              generateClassification('q', 'r', 's'),
              generateClassification('qux', 'quux', 'corge'),
            ],
          }],
        },
      ],
    }

    const result = conversations.extractClassifications([conversation])

    expect(result).to.deep.equal({
      inbound: [
        {
          base_type: {value: 'a'},
          sub_type: {value: 'b'},
          style: {value: 'c'},
        },
        {
          base_type: {value: 'q'},
          sub_type: {value: 'r'},
          style: {value: 's'},
        },
        {
          base_type: {value: 'x'},
          sub_type: {value: 'y'},
          style: {value: 'z'},
        },
        {
          base_type: {value: 'qux'},
          sub_type: {value: 'quux'},
          style: {value: 'corge'},
        },
      ],
      outbound: [
        {
          base_type: {value: 'a'},
          sub_type: {value: 'b'},
          style: {value: 'c'},
        },
        {
          base_type: {value: '1'},
          sub_type: {value: '2'},
          style: {value: '3'},
        },
        {
          base_type: {value: 'x'},
          sub_type: {value: 'y'},
          style: {value: 'z'},
        },
        {
          base_type: {value: '7'},
          sub_type: {value: '8'},
          style: {value: '9'},
        },
        {
          base_type: {value: 'foo'},
          sub_type: {value: 'bar'},
          style: {value: 'baz'},
        },
      ],
    })
  })
})

describe('extractSlotsFrom', () => {
  const slot = (baseType, entity, role) => {
    return {
      base_type: baseType,
      entity: entity,
      role: role,
    }
  }

  it('extracts slots from a conversation', () => {
    const conversation = {
      messages: [{
        parts: [{
          slots: {
            'a/b': {
              base_type: 'a',
              entity: 'b',
              roles: [
                'c0',
                'c1',
                'c2',
              ],
            },
            '1/2': {
              base_type: '1',
              entity: '2',
              roles: [
                '30',
                '31',
                '32',
              ],
            },
          },
        }, {
          slots: {
            'x/y': {
              base_type: 'x',
              entity: 'y',
              roles: [
                'z0',
                'z1',
                'z2',
              ],
            },
            '7/8': {
              base_type: '7',
              entity: '8',
              roles: [
                '90',
                '91',
                '92',
              ],
            },
          },
        }],
      }, {
        parts: [{
          slots: {
            'a/b': {
              base_type: 'a',
              entity: 'b',
              roles: [
                'c0',
                'c1',
                'c2',
              ],
            },
            'q/r': {
              base_type: 'q',
              entity: 'r',
              roles: [
                's0',
                's1',
                's2',
              ],
            },
            'x/y': {
              base_type: 'x',
              entity: 'y',
              roles: [
                'z0',
                'z1',
                'z2',
              ],
            },
          },
        }],
      }],
    }

    const result = conversations.extractSlotsFrom([conversation])

    expect(result.length).to.equal(15)
    expect(result).to.deep.have.members([
      slot('1', '2', '30'),
      slot('1', '2', '31'),
      slot('1', '2', '32'),
      slot('7', '8', '90'),
      slot('7', '8', '91'),
      slot('7', '8', '92'),
      slot('a', 'b', 'c0'),
      slot('a', 'b', 'c1'),
      slot('a', 'b', 'c2'),
      slot('q', 'r', 's0'),
      slot('q', 'r', 's1'),
      slot('q', 'r', 's2'),
      slot('x', 'y', 'z0'),
      slot('x', 'y', 'z1'),
      slot('x', 'y', 'z2'),
    ])
  })
})
