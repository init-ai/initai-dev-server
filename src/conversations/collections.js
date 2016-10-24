'use strict'

module.exports.deduplicate = (list, keyFor) => {
  const itemMap = new Map()

  list.forEach(item => itemMap.set(keyFor(item), item))

  const result = []

  itemMap.forEach(value => {
    result.push(value)
  })

  return result
}
