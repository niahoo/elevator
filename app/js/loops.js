(function(root){

	// Defines a simple function that loops forever with a state. The callback
	// is responsible for calling the next() function
	var stateLoop = function(callback, state){
		var next = function(newState, time) {
			after(time || 0, function() { callback(newState, next) })
		}
		callback(state, next)
	}

	// alias for flip'd setTimeout
	function after(t, f) {
		if (t === 0) return now(f)
		return setTimeout(f,t)
	}

	var now = root.setImmediate || function(f) { setTimeout(f,0) }

	// returns a function that accepts a time and calls the next loop with the
	// new state after this time
	function wrapNext(next, newState) {
		return function(time) {
			next(newState, time)
		}
	}

	stateLoop(function(num,next){
		if (num < 15)
		next(num + 1)
	}, 0)

	// Loops upwards from 1 to max
	stateLoop.n = function(max, callback) {
		if (max < 1) throw new Error('badarg')
		stateLoop(function(n, next){
			if (n > max) return
			callback(n, wrapNext(next, n+1))
		}, 1) // <- initial state is 1, so we loop <max> times
	}

	// Loops upwards from 0 to (max - 1 )
	stateLoop.n0 = function(max, callback) {
		if (max < 0) throw new Error('badarg')
		stateLoop(function(n, next){
			if (n === max) return
			callback(n, wrapNext(next, n+1))
		}, 0) // <- initial state is 0
	}

	// Loops downwards from max to 1
	stateLoop.r = function(max, callback) {
		if (max < 1) throw new Error('badarg')
		stateLoop(function(n, next){
			if (n === 0) return
			callback(n, wrapNext(next, n-1))
		}, max)
	}

	//@todo implement procLoop from strach pour avoir le moins de fonctions
	//    anonymes possibles (utiliser un prototype) pour utiliser moins de ram

	// au lieu de passer <next> on passe <proc> qui contient proc.next (==next)
	// mais aussi proc.receive (la mailbox) proc.exit (qui rend tout appel à
	// .next sans effet (set .next = noop))

	// proc.state qui est un objet vide dans lequel on laisse l'utilisateur
	// stocker ce qu'il veut

	// proc.receive N'EST pas implémenté car on est synchrone : on peut just
	// fetcher la mailbox et éventuellement faire un petit proc.next(300) s'il
	// n'y a rien

	// implémenter également proc.next(fun) et proc.next(fun, 300) qui remplace
	// la callback utilisée

	// @todo check for CommonJS & AMD befor exporting in the global namespace
	root.stateLoop = stateLoop


}(this))
