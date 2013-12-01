do ($ = jQuery, window) ->
	pluginName = "parallelAnimate"
	dataPrefix = "pa-"
	selfPlayCycle = false
	selfCycles = []
	selfRequestAnimationFrame = window.requestAnimationFrame ?
		window.webkitRequestAnimationFrame ?
		window.mozRequestAnimationFrame ?
		(callback) ->
			window.setTimeout(callback, 1000 / 60)
			return
	selfCycleCall = (time) ->
		for callEvent in selfCycles
			callEvent(time)
		selfRequestAnimationFrame(selfCycleCall)

	class AnimationItem
		defaults:
			start: 0
			fromto: {}
			duration: 0
			easing: "linear"
			update: null
			complate: null
		#constructor
		constructor: (@element, options) ->
			@_options = $.extend {}, @defaults, options
			@_isPlay = false
			@_firstObj = {}
			@_lastObj = {}
			@_fromObj = {}
			@_toObj = {}
			@_currentObj = {}
			@init()
			return @
		init: =>
			if $.type(@_options.fromto) is "string"
				@_options.fromto = @_options.fromto.replace(/'/g, "\"")
				@_options.fromto = $.parseJSON(@_options.fromto)
			for key of @_options.fromto
				arr = @_options.fromto[key]
				@_fromObj[key] = arr[0]
				@_toObj[key] = arr[1]
				@_currentObj[key] = @_fromObj[key]
				@_firstObj[key] = @property(key)
			return
		inTime: (sec)=>
			return @_options.start <= sec <= @_options.start + @_options.duration
		
		isFinish: (sec)=>
			return @_options.start + @_options.duration < sec

		reset: (sec = 0)=>
			for key of @_firstObj
				@property(key, @_firstObj[key])
			if sec >= @_options.start + @_options.duration
				for key of @_toObj
					@property(key, @_toObj[key])
			@draw(sec)
			return

		draw: (sec)=>
			if @inTime(sec)
				@_isPlay = true
				relSec = sec - @_options.start
				relSec = Math.max(Math.min(relSec, @_options.duration), 0)
				scale = relSec / @_options.duration
				for key of @_fromObj
					diff = @_toObj[key] - @_fromObj[key]
					@_currentObj[key] = diff * scale + @_fromObj[key]
					@property(key, @_currentObj[key])
			else
				for key of @_fromObj
					@_currentObj[key] = @property(key)
				@_isPlay = false
			return

		#property getter/setter
		property: (key, value) =>
			if typeof(value) is "undefined"
				return parseFloat(@element.css(key), 10) ? 0
			else
				@element.css(key, value)
			return

		#option getter/setter
		option: (key, value) =>
			if key of @defaults
				if typeof(value) is "undefined"
					return @_options[key]
				else
					@_options[key] = value
			return

	class ParallelAnimatePlugin
		defaults:
			fps: 60
			repeat: 0
		constructor: (@element, obj, options) ->
			@_options = $.extend {}, @defaults, options
			@_name = pluginName
			@_fps = 60
			@_current = 0
			@_currentRepeat = 0
			@_animations = []
			@_preTime = 0
			@_isPlay = false
			@_ctlActive = false
			@init(obj)
			return

		init:(obj) =>
			if $.type(obj) is "array"
				for item in obj
					@makeAndAddAnimationItem(item)
			else if $.type(obj) is "object"
				@makeAndAddAnimationItem(obj)
			else if $.type(obj) is "string"
				self = @
				elements = @element.find(obj)
				elements.each( ->
					self.makeAndAddAnimationItem($(this))
				)

			selfCycles.push(@cycle)
			unless selfPlayCycle
				selfPlayCycle = true
				selfRequestAnimationFrame(selfCycleCall)
			return

		makeAndAddAnimationItem: (obj) =>
			item = @makeAnimationItem(obj)
			if item
				@_animations.push(item)
			return

		makeAnimationItem: (obj) =>
			el = null
			options = {}
			if obj instanceof $
				el = obj
				options.start = parseFloat(obj.data("#{dataPrefix}start"), 10) if obj.data("#{dataPrefix}start")
				options.fromto = obj.data("#{dataPrefix}fromto") if obj.data("#{dataPrefix}fromto")
				options.duration = parseFloat(obj.data("#{dataPrefix}duration"), 10) if obj.data("#{dataPrefix}duration")
				options.easing = obj.data("#{dataPrefix}easing") if obj.data("#{dataPrefix}easing")
				options.update = obj.data("#{dataPrefix}update") if obj.data("#{dataPrefix}update")
				options.complate = obj.data("#{dataPrefix}complate") if obj.data("#{dataPrefix}complate")
			else if obj?.el?
				if obj.el instanceof $
					el = obj.el
				else
					el = @element.find(obj.el)
				delete obj.el
				options = obj
			if el
				return new AnimationItem(el, options)
			return

		#option getter/setter
		option: (key, value) =>
			if key of @defaults
				if $.type(value) is "undefined"
					return @_options[key]
				else
					@_options[key] = value
			return

		play: (repeat) =>
			@option("repeat", repeat) if typeof(repeat) isnt "undefined"
			@reset()
			@_isPlay = true
			@_ctlActive = true
			return
		stop: =>
			@_isPlay = false
			@_ctlActive = false
			@_currentRepeat = 0
			@_current = 0
			@reset()
			return
		gotoAndPlay: (time = 0, repeat)=>
			@option("repeat", repeat) if typeof(repeat) isnt "undefined"
			@reset(time)
			@_isPlay = true
			@_ctlActive = true
			return
		gotoAndStop: (time = 0)=>
			@reset(time)
			@_isPlay = false
			@_ctlActive = true
			return
		pause: =>
			if @_ctlActive
				@_isPlay = false
			return
		resume: =>
			if @_ctlActive
				@_isPlay = true
			return

		reset: (time = 0)=>
			@_current = time * 1000
			for item in @_animations
				item.reset(time)
			return

		isFinish: =>
			sec = @_current / 1000
			grepItem = (item for item in @_animations when not item.isFinish(sec))
			return grepItem.length <= 0

		draw: =>
			sec = @_current / 1000
			for item in @_animations
				item.draw(sec)
			return

		update: (delta=0)=>
			if @_isPlay
				@_current += delta
				@draw()
				if @isFinish()
					if @_options.repeat < 0
						@play()
					else if @_currentRepeat < @_options.repeat
						@_currentRepeat += 1
						@play()
					else
						@_currentRepeat = 0
						@_isPlay = false
						@_ctlActive = false
			return
		cycle: (time)=>
			delta = 0
			if time?
				delta = time - @_preTime
				@_preTime = time
			else
				delta = 1000 / 60
				@_preTime += delta
			@update(delta)
			return


	$.fn[pluginName] = (args...) ->
		datakey = "plugin_#{pluginName}"
		result = []
		@each ->
			if !$.data(@, datakey)
				$.data(@, datakey, new ParallelAnimatePlugin($(@), args[0], args[1]))

			self = $.data(@, datakey)
			switch args[0]
				when "option"
					res = self.option(args[1], args[2])
					if res?
						result.push(res)
				when "play"
					self.play(args[1])
				when "gotoAndPlay"
					self.gotoAndPlay(args[1], args[2])
				when "gotoAndStop"
					self.gotoAndStop(args[1])
				when "stop"
					self.stop()
				when "pause"
					self.pause()
				when "resume"
					self.resume()
				when "update"
					self.update(args[1])
				
		if result.length > 1
			return result
		else
			return result[0]



