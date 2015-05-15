var Storey = require('model/Storey')

function Building(opts) {
	this.storeys = Storey.makeCollection(opts.storeys)
}

module.exports = Building
