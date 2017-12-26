const d3 = require('d3')
const Gib = require('../d3-gib')

const width = 800
const height = 600

const color = d3.scaleOrdinal(d3.schemeCategory20)
const svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height)

const simulation = d3.forceSimulation()
  .force('charge', d3.forceManyBody())
  .force('x', d3.forceX(width / 2).strength(0.02))
  .force('y', d3.forceY(height / 2).strength(0.02))

const makeGroups = (nodes) => {
  const groupCount = new Map(nodes.map((node) => [node.group, 0]))
  for (const node of nodes) {
    groupCount.set(node.group, groupCount.get(node.group) + 1)
  }
  return Array.from(groupCount.entries()).map(([k, v]) => ({id: k, size: v}))
}

const makeTree = (groups) => {
  const tree = d3.hierarchy({children: groups})
    .sum((d) => d.size)
    .sort((a, b) => b.height - a.height || b.value - a.value)

  const treemap = d3.treemap()
    .size([width, height])

  return treemap(tree).leaves()
}

const makePack = (groups) => {
  const pack = d3.pack()
    .size([width, height])

  const root = d3.hierarchy({children: groups})
    .sum((d) => d.size)
    .sort((a, b) => b.value - a.value)

  return pack(root)
}

window.fetch('graph.json')
  .then((response) => response.json())
  .then((graph) => {
    const groups = makeGroups(graph.nodes)

    const result = makePack(groups)
    const foci = {}
    for (const group of result.children) {
      foci[group.data.id] = {
        x: group.x,
        y: group.y
      }
    }

    const groupingForce = new Gib()
      .strength(0.1)
      .groupBy((node) => node.group)
      .linkStrengthInterCluster(0.01)
      .foci(foci)

    const forceLink = d3.forceLink(graph.links)
      .distance(50)
      .strength(groupingForce.linkStrength())

    simulation
      .nodes(graph.nodes)
      .force('group', groupingForce)
      .force('link', forceLink)

    const pack = svg.selectAll(".node")
      .data(result.descendants())
      .enter()
      .append("g")
      .classed('pack', true)
      .classed('leaf', (d) => d.children)
      .attr('transform', (d) => `translate(${d.x},${d.y})`)

    pack.append('title')
    // .text((d) => `${d.data.name}\n${format(d.value)}`)

    pack.append('circle')
      .attr('r', (d) => d.r)

    // const tile = svg.selectAll('.tile')
    //   .data(tree)
    //   .enter()
    //   .append('rect')
    //   .classed('tile', true)
    //   .attr('fill', 'none')
    //   .attr('stroke', '#999')
    //   .attr('x', (d) => d.x0)
    //   .attr('y', (d) => d.y0)
    //   .attr('width', (d) => d.x1 - d.x0)
    //   .attr('height', (d) => d.y1 - d.y0)

    const link = svg.selectAll('.link')
      .data(graph.links)
      .enter()
      .append('line')
      .classed('link', true)
      .attr('stroke-width', (d) => Math.sqrt(d.value))
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)

    const node = svg.selectAll('.node')
      .data(graph.nodes)
      .enter()
      .append('circle')
      .classed('node', true)
      .attr('r', 5)
      .attr('fill', (d) => color(d.group))

    node.append('title')
      .text((d) => d.name)

    simulation.on('tick', () => {
      link.attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
      node.attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
    })
  })


