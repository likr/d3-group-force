const privates = new WeakMap()

const accessor = (hoge, key, args) => {
  if (args.length === 0) {
    return privates.get(hoge.key)[key]
  }
  privates.get(hoge.key)[key] = args[0]
  return hoge
}

const call = (gib, alpha) => {
  const k = alpha * gib.strength()
  const groupBy = gib.groupBy()
  const foci = gib.foci()
  const nodes = privates.get(gib.key).nodes
  for (const node of nodes) {
    node.vx += (foci[groupBy(node)].x - node.x) * k
    node.vy += (foci[groupBy(node)].y - node.y) * k
  }
}

class GroupInABox extends Function {
  constructor () {
    super()

    this.key = {}
    privates.set(this.key, {
      strength: 0.1,
      groupBy: (node) => node.cluster,
      nodes: [],
      foci: {},
      linkStrengthIntraCluster: 0.1,
      linkStrengthInterCluster: 0.01
    })

    return new Proxy(this, {
      apply (target, thisArg, argumentsList) {
        call(target, argumentsList)
      }
    })
  }

  strength (value) {
    return accessor(this, 'strength', arguments)
  }

  linkStrengthInterCluster (value) {
    return accessor(this, 'linkStrengthInterCluster', arguments)
  }

  linkStrengthIntraCluster (value) {
    return accessor(this, 'linkStrengthIntraCluster', arguments)
  }

  groupBy (value) {
    return accessor(this, 'groupBy', arguments)
  }

  foci (value) {
    return accessor(this, 'foci', arguments)
  }

  linkStrength () {
    return (e) => {
      const groupBy = this.groupBy()
      const linkStrengthIntraCluster = this.linkStrengthIntraCluster()
      const linkStrengthInterCluster = this.linkStrengthInterCluster()
      if (groupBy(e.source) === groupBy(e.target)) {
        if (typeof linkStrengthIntraCluster === 'function') {
          return linkStrengthIntraCluster(e)
        } else {
          return linkStrengthIntraCluster
        }
      } else {
        if (typeof linkStrengthInterCluster === 'function') {
          return linkStrengthInterCluster(e)
        } else {
          return linkStrengthInterCluster
        }
      }
    }
  }

  initialize (nodes) {
    privates.get(this.key).nodes = nodes
  }
}

module.exports = GroupInABox
