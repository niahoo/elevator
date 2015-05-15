
// The position is an ordered index in the lsit of all the storeys, helping the
// elevator destination algorithm find its way

function Storey(conf) {
	this.position = conf.position
	this.floorAltitude = conf.floorAltitude
}

Storey.makeCollection = function(confs) {
	return confs.map(function(conf){
		return new Storey(conf)
	})
}

module.exports = Storey
