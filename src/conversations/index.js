'use strict'

const collections = require('./collections')
const constants = require('../util/constants')

const Classifications = constants.Classifications

const classificationKeyFor = classification => (
  classification.base_type.value + '/' + classification.sub_type.value + (classification.style ? '#' + classification.style.value : '')
)

module.exports.extractClassifications = function extractClassifications(conversations) {
  const classifications = conversations.reduce((classifications, conversation) => {
    conversation.messages.forEach((message) => {
      const key = Classifications.Direction[message.sender]

      if (key) {
        message.parts.forEach((part) => {
          if (part.classifications) {
            part.classifications.forEach((classification) => {
              classifications[key].push(classification)
            })
          }
        })
      }
    })

    return classifications
  }, {
    inbound: [],
    outbound: [],
  })

  return {
    inbound: collections.deduplicate(classifications.inbound, classificationKeyFor),
    outbound: collections.deduplicate(classifications.outbound, classificationKeyFor),
  }
}

const slotKeyFor = slot => slot.base_type + '/' + slot.entity + '#' + slot.role

module.exports.extractSlotsFrom = conversations => {
  const slots = []

  conversations.forEach(conversation => {
    conversation.messages.forEach(message => {
      message.parts.forEach(part => {
        Object.keys(part.slots).forEach(key => {
          const slot = part.slots[key]
          slot.roles.forEach(role => {
            slots.push({
              base_type: slot.base_type,
              entity: slot.entity,
              role: role,
            })
          })
        })
      })
    })
  })

  return collections.deduplicate(slots, slotKeyFor)
}
