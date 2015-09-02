var extend = require('extend')
var BaseClass = require('base-class-extend')
var _ = {
	isFinite: require('lodash/lang/isFinite'),
	matches: require('lodash/utility/matches'),
	clone: require('lodash/lang/clone')
}
var spawn = setImmediate // freezes too much
// var spawn = requestAnimationFrame // too slow
// var spawn = setTimeout // mid slow, useless timers
// var spawnNoFail = function(f){setTimeout(f,0)}
// var Promise = require('es6-promise').Promise

function noop() { /* hi ! */ }

function strictIsEqualTo(a) {
	return function(b) {
		return a === b
	}
}

var gid = (function () {
	var gid = 0
	return function() {
		return ++gid
	}
})

var DEBUG_INCREMENT = 0

var ttrace = function() {
	var args = ['%c#'+ DEBUG_INCREMENT++]
		.concat('color:#aaa')
		.concat(Array.prototype.slice.call(arguments))
	console.log.apply(console, args)
}

ttrace = noop

function alwaysTrue() { return true }

/*******************************************************************************

	How it works

	The user provides an `initialize` function. This function is wrapped into a
	`Next` object and passed to `handleContinuation` which accepts wrappers.

	`handleContinuation` checks that it is actually a wrapper and calls `.run()` on the
	wrapper, passing proc context (the value of 'this' in the wrapped
	function'). Wrappers must return promises. Then, `handleContinuation` send the
	response from `wrapper.run()` to `proc.__loop()` which accepts promises.
	`proc.__loop()` calls `.then()` on the promise with a callback that accepts a
	wrapper and send it to `handleContinuation`. Now, go back to the beginning of this
	paragraph and read again.

*******************************************************************************/

var Proc = BaseClass.extend('Proc', {
	constructor: function(init, initArgs) {
		var opts = typeof init === 'function' ? {initialize:init} : init
		extend(this, opts)
		this.__mailbox = new Mailbox()
		this.client = new Client(this.__mailbox)
		this.__onErrorBound = this.onError.bind(this)
		// initialization is synchronous
		var handle = this.initialize.apply(this, initArgs)
		var self = this
		spawn(function(){
			self.handleContinuation(handle)
		})
	},

	initialize: function(){
		throw new Error("The 'initialize' method is mandatory.")
	},

	__loop: function(promise) {
		// ttrace('__loop', promise)
		var self = this
		promise.then(function(val){
			self.handleContinuation(val)
		})
		.catch(this.__onErrorBound)
	},

	handleContinuation: function(wrapper) {
		// ttrace('handleContinuation', wrapper)
		if (wrapper instanceof Next || wrapper instanceof Receive) {
			return this.__loop(wrapper.run(this))
		} else if (wrapper instanceof Exit) {
			// we stop here
			return
		} else {
			console.error(wrapper, 'is not a valid wrapper')
		}
	},

	onError: function(err) {
		console.error('Promise error')
		console.error(err.stack)
		throw err
	},

	next: function(fun, time, stateArgs) {
		ttrace('next time', time)
		return new Next(fun, time, stateArgs)
	},

	exit: function() {
		return new Exit()
	},

	receive: function(pattern, fun) {
		return new Receive(this.__mailbox).receive(pattern, fun)
	},

	receiveAny: function(fun) {
		return new Receive(this.__mailbox)._(fun)
	},

	//@todo : flushAll should be in sync, and return nothing.
	flushAll: function(pattern, afterCallback) {
		var cb = afterCallback || noop
		console.log('%cflushing all messages', 'color:orange', pattern)
		return new Receive(this.__mailbox)
			.receive(pattern, function(){
				// if we find a matching message, we loop to keep flushing
				return this.flushAll(pattern, afterCallback)
			})
			// if no message is found, we stop here. If the user provided a
			// callback, we execute it, that's why we use 'return's. But the
			// function can be used without a return clause
			.after(0, cb)
	},

	// This function allows the user to perform async work and then call the
	// resolve function passing the new continuation function. Then we use a
	// Next wrapper to turn the continuation fun into a promise
	async: function(fun) {
		var bound = fun.bind(this)
		var self = this
		return new Promise(function(resolve, reject) {
			var next = function(f, time, nesStateArgs) {
				var resolveData = [f,time,nesStateArgs]
				resolve(resolveData)
			}
			bound(next)
		}).then(function(resolveData){
			return self.next(resolveData[0],resolveData[1],resolveData[2])
		}).catch(this.__onErrorBound)
		// @todo catch
	}
})

// -- Promise wrappers --------------------------------------------------------

function Exit() {}

function Next(fun, time, newStateArgs) {
	this.fun = fun
	this.time = time
	this.newStateArgs = newStateArgs || []
}

Next.prototype.run = function (context) {
	var self = this
	// the looping function is bound to the context and will be called with
	// any arguments passed in newStateArgs
	var bound = function() {
		return self.fun.apply(context, self.newStateArgs)
	}
	return new Promise(function(resolve, reject){
		var work = function(){ resolve(bound()) }
		// -- Asynchronicity is forced here since .next receives the optional
		// time parameter
		if (self.time > 0) setTimeout(work, self.time)
		else spawn(work)
	})
}

function Receive(mailbox, time) {
	this.mailbox = mailbox
	this.clauses = []
	this.afterClause = undefined
	var self = this
}

Receive.prototype.receive = function (pattern, callback) {
	var predicate = this.getPredicateFunction(pattern)
	this.clauses.push([predicate, callback])
	return this
}

// matches anything (wildcard)
Receive.prototype._ = function (callback) {
	return this.receive(alwaysTrue, callback)
}

Receive.prototype.getPredicateFunction = function (pattern) {
	var predicate = this.REAL_getPredicateFunction(pattern)
	return function(t) {
		var matched = predicate(t)
		ttrace(pattern, matched ? ' matches ' : ' does not matches ', t)
		return matched
	}
}

Receive.prototype.REAL_getPredicateFunction = function (pattern) {
	switch (typeof pattern) {
		case 'object':
			return _.matches(pattern)
		case 'function':
			return pattern // if already a predicate, just use it
		default:
			return strictIsEqualTo(pattern)
	}
}
//	this.chain = this.chain.then(function(acc){
//		// if previous clause has found a message, just pass the context through
//		if (acc.matched) return acc

//		// if no message is found, udefined is returned
//		var message = acc.mailbox.match(pattern)
//		if (message !== void 0) {
//			ttrace('receive clause succeeded')
//			return extend(acc,{matched:true, message:message, callback:callback})
//		} else {
//			ttrace('receive clause failed')
//			acc.failedClauses.push([pattern,callback])
//			return acc
//		}
//	})
//	return this
// }

Receive.prototype.after = function (timeout, callback) {
	this.afterClause = [timeout, callback]
	return this
}

Receive.prototype.run = function (callbackContext) {
	ttrace('Receive run')
	if (! this.afterClause) {
		// if no .after clause has been set, we set one with Infinity as a
		// timeout
		ttrace('auto setting infinity clause')
		this.after(Infinity)
	}
	// we send all the clauses to the mailbox which knows how to handle them (we
	// should define an interface because this violates encapsulation ?)

	// The mailbox returns a promise resulting in a match context with the
	// message and the associated callback
	return this.mailbox.withMatch(this.clauses, this.afterClause[0], this.afterClause[1])
		.then(function(matchContext){
			return new Next(function(){
				ttrace('match context', matchContext)
				// we call the user callback, bound to the proc context, passing
				// the message. The callback must return a wrapper (this.next(),
				// this.receive(), ...)
				// if a timeout occured, the message is undefined
				return matchContext.callback.bind(callbackContext)(matchContext.message)
			})
		})
}

// -- Mailbox -----------------------------------------------------------------

function Mailbox() {
	this.stack = []
	this.onMessage = false
}

Mailbox.prototype.push = function (message) {

	ttrace('mailbox push called', message)
	// we check if a message handler is set. If yes, we only stack the message
	// if the handler returns falsy (message NOT consumed)
	if (!this.onMessage || !this.onMessage(message)) {
		this.stack.push(message)
	}
}

// accepts a clauses array such as defined per Receive & returns a match context
// or undefined
Mailbox.prototype.withMatch = function (clauses, timeout, timeoutCallback) {
	ttrace('withMatch mailbox stack', this.stack)
	var slen = this.stack.length,
	    clen = clauses.length,
	    message,
	    clause,
	    predicate,
	    callback,
	    i,
	    j,
	    self = this
	for (i = 0; i < slen; i++) {
		message = this.stack[i]
		ttrace('test message', message)
		for (j = 0; j < clen; j++) {
			clause = clauses[j]
			predicate = clause[0]
			callback = clause[1]
			if (predicate(message)) {
				// we found a matching message. We delete it
				this.stack.splice(i,1)
				return Promise.resolve({
					matched: true,
					message:message,
					callback:callback
				})
			}
		}
	}

	// we did not find a matching message. we will set a timeout and resolve it
	// as soon as we receive a matching message

	// onMessage should not be bound since the Receive promise wrapper should
	// not be resolved until the following code is executed (or if the previous
	// search matches, onMessage won't be bound)
	if (this.onMessage) {
		console.error('onMessage already bound') //@todo remove this line
		throw new Error('mailbox onMessage already bound')
	}


	var timer

	return new Promise(function(resolve, reject){
		self.onMessage = function(message){
			ttrace('mailbox onMessage called')
			// when we get a message, we check for the clauses to match
			for (j = 0; j < clen; j++) {
				clause = clauses[j]
				predicate = clause[0]
				callback = clause[1]
				if (predicate(message)) {
					self.onMessage = false
					// If the message maches, we clear the timeout of the after-
					// clause
					// A clearTimeout should be useless as the promise can only
					// be resolved once ; but doing so we discard any debug trace
					// in the timeout callback. (@todo in production, no debug
					// => no clearTimeout)
					clearTimeout(timer)
					resolve({
						matched: true,
						message:message,
						callback:callback
					})
					// we return true, which means that the message will not be
					// pushed on the stack (as we consume it now)
					return true
				}
			}
			return false
		}
		// set the onmessage listener.
		if (_.isFinite(timeout)) {
			// if the timeout occurs, we resolve the Promise with the associated
			// callback and an undefined message
			ttrace('waiting for ' + timeout)
			var resolveTimeout = function(){
				self.onMessage = false
				resolve({
					matched: false,
					message:undefined,
					callback:timeoutCallback
				})
			}
			// if timeout is 0 we resolve synchronously
			if (timeout > 0) timer = setTimeout(resolveTimeout, timeout)
			else /* timeout === 0 */ resolveTimeout()
		}
	})
}


// -- Client -----------------------------------------------------------------

function Client(mailbox) {
	this.mailbox = mailbox
}

Client.prototype.send = function (message) {
	var self = this
	ttrace('send message',message)
	// the message will be received asynchronously (spawn)
	spawn(function(){ self.mailbox.push(_.clone(message)) })
}

// -- API ---------------------------------------------------------------------

Proc.spawn = function(init, initArgs) {
	// called as a static function, 'this' will refer to the extended class if
	// any. BaseClass will take care of this static function being inherited to
	// the derived classes
	var constructor = this
	var proc = new constructor(init, initArgs)
	proc.client.__proc = proc
	return proc.client
}

module.exports = Proc
