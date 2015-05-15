var Storey = require('model/Storey')

function Building(opts) {
	this.storeys = Storey.makeCollection(opts.storeys)
}

Building.prototype.getStorey = function(position) {
	return this.storeys[position]
};

module.exports = Building
