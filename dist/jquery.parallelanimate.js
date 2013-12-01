(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  (function($, window) {
    var AnimationItem, ParallelAnimatePlugin, dataPrefix, pluginName, selfCycleCall, selfCycles, selfPlayCycle, selfRequestAnimationFrame, _ref, _ref1, _ref2;
    pluginName = "parallelAnimate";
    dataPrefix = "pa-";
    selfPlayCycle = false;
    selfCycles = [];
    selfRequestAnimationFrame = (_ref = (_ref1 = (_ref2 = window.requestAnimationFrame) != null ? _ref2 : window.webkitRequestAnimationFrame) != null ? _ref1 : window.mozRequestAnimationFrame) != null ? _ref : function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
    selfCycleCall = function(time) {
      var callEvent, _i, _len;
      for (_i = 0, _len = selfCycles.length; _i < _len; _i++) {
        callEvent = selfCycles[_i];
        callEvent(time);
      }
      return selfRequestAnimationFrame(selfCycleCall);
    };
    AnimationItem = (function() {
      AnimationItem.prototype.defaults = {
        start: 0,
        fromto: {},
        duration: 0,
        easing: "linear",
        update: null,
        complate: null
      };

      function AnimationItem(element, options) {
        this.element = element;
        this.option = __bind(this.option, this);
        this.property = __bind(this.property, this);
        this.draw = __bind(this.draw, this);
        this.reset = __bind(this.reset, this);
        this.isFinish = __bind(this.isFinish, this);
        this.inTime = __bind(this.inTime, this);
        this.init = __bind(this.init, this);
        this._options = $.extend({}, this.defaults, options);
        this._isPlay = false;
        this._firstObj = {};
        this._lastObj = {};
        this._fromObj = {};
        this._toObj = {};
        this._currentObj = {};
        this.init();
        return this;
      }

      AnimationItem.prototype.init = function() {
        var arr, key;
        if ($.type(this._options.fromto) === "string") {
          this._options.fromto = this._options.fromto.replace(/'/g, "\"");
          this._options.fromto = $.parseJSON(this._options.fromto);
        }
        for (key in this._options.fromto) {
          arr = this._options.fromto[key];
          this._fromObj[key] = arr[0];
          this._toObj[key] = arr[1];
          this._currentObj[key] = this._fromObj[key];
          this._firstObj[key] = this.property(key);
        }
      };

      AnimationItem.prototype.inTime = function(sec) {
        return (this._options.start <= sec && sec <= this._options.start + this._options.duration);
      };

      AnimationItem.prototype.isFinish = function(sec) {
        return this._options.start + this._options.duration < sec;
      };

      AnimationItem.prototype.reset = function(sec) {
        var key;
        if (sec == null) {
          sec = 0;
        }
        for (key in this._firstObj) {
          this.property(key, this._firstObj[key]);
        }
        if (sec >= this._options.start + this._options.duration) {
          for (key in this._toObj) {
            this.property(key, this._toObj[key]);
          }
        }
        this.draw(sec);
      };

      AnimationItem.prototype.draw = function(sec) {
        var diff, key, relSec, scale;
        if (this.inTime(sec)) {
          this._isPlay = true;
          relSec = sec - this._options.start;
          relSec = Math.max(Math.min(relSec, this._options.duration), 0);
          scale = relSec / this._options.duration;
          for (key in this._fromObj) {
            diff = this._toObj[key] - this._fromObj[key];
            this._currentObj[key] = diff * scale + this._fromObj[key];
            this.property(key, this._currentObj[key]);
          }
        } else {
          for (key in this._fromObj) {
            this._currentObj[key] = this.property(key);
          }
          this._isPlay = false;
        }
      };

      AnimationItem.prototype.property = function(key, value) {
        var _ref3;
        if (typeof value === "undefined") {
          return (_ref3 = parseFloat(this.element.css(key), 10)) != null ? _ref3 : 0;
        } else {
          this.element.css(key, value);
        }
      };

      AnimationItem.prototype.option = function(key, value) {
        if (key in this.defaults) {
          if (typeof value === "undefined") {
            return this._options[key];
          } else {
            this._options[key] = value;
          }
        }
      };

      return AnimationItem;

    })();
    ParallelAnimatePlugin = (function() {
      ParallelAnimatePlugin.prototype.defaults = {
        fps: 60,
        repeat: 0
      };

      function ParallelAnimatePlugin(element, obj, options) {
        this.element = element;
        this.cycle = __bind(this.cycle, this);
        this.update = __bind(this.update, this);
        this.draw = __bind(this.draw, this);
        this.isFinish = __bind(this.isFinish, this);
        this.reset = __bind(this.reset, this);
        this.resume = __bind(this.resume, this);
        this.pause = __bind(this.pause, this);
        this.gotoAndStop = __bind(this.gotoAndStop, this);
        this.gotoAndPlay = __bind(this.gotoAndPlay, this);
        this.stop = __bind(this.stop, this);
        this.play = __bind(this.play, this);
        this.option = __bind(this.option, this);
        this.makeAnimationItem = __bind(this.makeAnimationItem, this);
        this.makeAndAddAnimationItem = __bind(this.makeAndAddAnimationItem, this);
        this.init = __bind(this.init, this);
        this._options = $.extend({}, this.defaults, options);
        this._name = pluginName;
        this._fps = 60;
        this._current = 0;
        this._currentRepeat = 0;
        this._animations = [];
        this._preTime = 0;
        this._isPlay = false;
        this._ctlActive = false;
        this.init(obj);
        return;
      }

      ParallelAnimatePlugin.prototype.init = function(obj) {
        var elements, item, self, _i, _len;
        if ($.type(obj) === "array") {
          for (_i = 0, _len = obj.length; _i < _len; _i++) {
            item = obj[_i];
            this.makeAndAddAnimationItem(item);
          }
        } else if ($.type(obj) === "object") {
          this.makeAndAddAnimationItem(obj);
        } else if ($.type(obj) === "string") {
          self = this;
          elements = this.element.find(obj);
          elements.each(function() {
            return self.makeAndAddAnimationItem($(this));
          });
        }
        selfCycles.push(this.cycle);
        if (!selfPlayCycle) {
          selfPlayCycle = true;
          selfRequestAnimationFrame(selfCycleCall);
        }
      };

      ParallelAnimatePlugin.prototype.makeAndAddAnimationItem = function(obj) {
        var item;
        item = this.makeAnimationItem(obj);
        if (item) {
          this._animations.push(item);
        }
      };

      ParallelAnimatePlugin.prototype.makeAnimationItem = function(obj) {
        var el, options;
        el = null;
        options = {};
        if (obj instanceof $) {
          el = obj;
          if (obj.data("" + dataPrefix + "start")) {
            options.start = parseFloat(obj.data("" + dataPrefix + "start"), 10);
          }
          if (obj.data("" + dataPrefix + "fromto")) {
            options.fromto = obj.data("" + dataPrefix + "fromto");
          }
          if (obj.data("" + dataPrefix + "duration")) {
            options.duration = parseFloat(obj.data("" + dataPrefix + "duration"), 10);
          }
          if (obj.data("" + dataPrefix + "easing")) {
            options.easing = obj.data("" + dataPrefix + "easing");
          }
          if (obj.data("" + dataPrefix + "update")) {
            options.update = obj.data("" + dataPrefix + "update");
          }
          if (obj.data("" + dataPrefix + "complate")) {
            options.complate = obj.data("" + dataPrefix + "complate");
          }
        } else if ((obj != null ? obj.el : void 0) != null) {
          if (obj.el instanceof $) {
            el = obj.el;
          } else {
            el = this.element.find(obj.el);
          }
          delete obj.el;
          options = obj;
        }
        if (el) {
          return new AnimationItem(el, options);
        }
      };

      ParallelAnimatePlugin.prototype.option = function(key, value) {
        if (key in this.defaults) {
          if ($.type(value) === "undefined") {
            return this._options[key];
          } else {
            this._options[key] = value;
          }
        }
      };

      ParallelAnimatePlugin.prototype.play = function(repeat) {
        if (typeof repeat !== "undefined") {
          this.option("repeat", repeat);
        }
        this.reset();
        this._isPlay = true;
        this._ctlActive = true;
      };

      ParallelAnimatePlugin.prototype.stop = function() {
        this._isPlay = false;
        this._ctlActive = false;
        this._currentRepeat = 0;
        this._current = 0;
        this.reset();
      };

      ParallelAnimatePlugin.prototype.gotoAndPlay = function(time, repeat) {
        if (time == null) {
          time = 0;
        }
        if (typeof repeat !== "undefined") {
          this.option("repeat", repeat);
        }
        this.reset(time);
        this._isPlay = true;
        this._ctlActive = true;
      };

      ParallelAnimatePlugin.prototype.gotoAndStop = function(time) {
        if (time == null) {
          time = 0;
        }
        this.reset(time);
        this._isPlay = false;
        this._ctlActive = true;
      };

      ParallelAnimatePlugin.prototype.pause = function() {
        if (this._ctlActive) {
          this._isPlay = false;
        }
      };

      ParallelAnimatePlugin.prototype.resume = function() {
        if (this._ctlActive) {
          this._isPlay = true;
        }
      };

      ParallelAnimatePlugin.prototype.reset = function(time) {
        var item, _i, _len, _ref3;
        if (time == null) {
          time = 0;
        }
        this._current = time * 1000;
        _ref3 = this._animations;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          item = _ref3[_i];
          item.reset(time);
        }
      };

      ParallelAnimatePlugin.prototype.isFinish = function() {
        var grepItem, item, sec;
        sec = this._current / 1000;
        grepItem = (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this._animations;
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            item = _ref3[_i];
            if (!item.isFinish(sec)) {
              _results.push(item);
            }
          }
          return _results;
        }).call(this);
        return grepItem.length <= 0;
      };

      ParallelAnimatePlugin.prototype.draw = function() {
        var item, sec, _i, _len, _ref3;
        sec = this._current / 1000;
        _ref3 = this._animations;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          item = _ref3[_i];
          item.draw(sec);
        }
      };

      ParallelAnimatePlugin.prototype.update = function(delta) {
        if (delta == null) {
          delta = 0;
        }
        if (this._isPlay) {
          this._current += delta;
          this.draw();
          if (this.isFinish()) {
            if (this._options.repeat < 0) {
              this.play();
            } else if (this._currentRepeat < this._options.repeat) {
              this._currentRepeat += 1;
              this.play();
            } else {
              this._currentRepeat = 0;
              this._isPlay = false;
              this._ctlActive = false;
            }
          }
        }
      };

      ParallelAnimatePlugin.prototype.cycle = function(time) {
        var delta;
        delta = 0;
        if (time != null) {
          delta = time - this._preTime;
          this._preTime = time;
        } else {
          delta = 1000 / 60;
          this._preTime += delta;
        }
        this.update(delta);
      };

      return ParallelAnimatePlugin;

    })();
    return $.fn[pluginName] = function() {
      var args, datakey, result;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      datakey = "plugin_" + pluginName;
      result = [];
      this.each(function() {
        var res, self;
        if (!$.data(this, datakey)) {
          $.data(this, datakey, new ParallelAnimatePlugin($(this), args[0], args[1]));
        }
        self = $.data(this, datakey);
        switch (args[0]) {
          case "option":
            res = self.option(args[1], args[2]);
            if (res != null) {
              return result.push(res);
            }
            break;
          case "play":
            return self.play(args[1]);
          case "gotoAndPlay":
            return self.gotoAndPlay(args[1], args[2]);
          case "gotoAndStop":
            return self.gotoAndStop(args[1]);
          case "stop":
            return self.stop();
          case "pause":
            return self.pause();
          case "resume":
            return self.resume();
          case "update":
            return self.update(args[1]);
        }
      });
      if (result.length > 1) {
        return result;
      } else {
        return result[0];
      }
    };
  })(jQuery, window);

}).call(this);
