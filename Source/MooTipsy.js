var MooTipsy;

(function($) {

MooTipsy = new Class;

MooTipsy.extend({

  instances : [],

  registerInstance : function(instance) {
    this.instances.push(instance);
    instance.addEvents({
      'beforeShow':this.onBeforeShow.bind(this)
    });
  },

  hideAll : function() {
    this.getInstances().each(this.hide,this);
  },

  hide : function(instance) {
    this.instance(instance).hide();
  },

  instance : function(inst) {
    return typeOf(inst) == 'integer' ? this.getInstance(inst) : inst;
  },

  getInstance : function(index) {
    return this.findInstance(index).instance;
  },

  findInstance : function(instance) {
    var index;
    var instances = this.getInstances();
    if(instanceOf(instance,MooTipsy)) {
      for(index = 0; index < instances.length; index++) {
        if(instances[index]==instance) break;
      }
    }
    else {
      index = instance;
      instance = instances[index];
    }

    return {
      index : index,
      instance : instance
    };
  },

  getInstances : function() {
    return this.instances;
  },

  show : function(index) {
    this.instance(instance).show();
  },

  destroy : function(instance) {
    var index = this.findInstance(instance).index;
    delete this.instances[index];
    this.instances = this.instances.clean();
  },

  destroyAll : function() {
    this.getInstances().each(this.destroy,this);
  },

  onBeforeShow : function(instance) {
    clearTimeout(this.hideTimer);
    if(instance.hasOption('onlyShowThis')) {
      this.hideAll();
    }
  }

});

MooTipsy.implement({

  Implements : [Options, Events],

  Binds : ['onPartialReady','onFocus','onBlur','show','reveal','hide','dissolve'],

  Accessors : [],

  options : {
    onlyShowThis : true,
    className : 'mootipsy',
    zIndex : 1000,
    incrementZIndex : true,
    loadOnShow : false,
    offset : {
      x : 0,
      y : 0
    },
    loadOptions : {

    },
    moveRange : 300,
    elementOptions : {

    },
    innerOptions : {

    },
    partialOptions : {

    },
    fxOptions : {
      link : 'cancel',
      transition : 'quad:out'
    },
    fadeFxOptions : {
      link : 'cancel',
      transition : 'circ:out'
    }
  },

  initialize : function(options) {
    this.cache = {};
    this.setOptions(options);
    MooTipsy.registerInstance(this);
    this.build();
    this.setupEvents();
    this.hide();
  },

  build : function() {
    this.buildElement();
    this.buildInner();
    this.buildPartial();
  },

  hasOption : function(option) {
    return !! this.options[option];
  },

  buildElement : function() {
    this.element = new Element('div').set(this.options.elementOptions).setStyles({
      'position':'absolute',
      'z-index':this.options.zIndex
    }).inject(this.options.body || document.body);
    this.element.addClass(this.options.className);
  },

  buildInner : function() {
    this.inner = new Element('div').set(this.options.innerOptions).inject(this.getElement());
  },

  buildPartial : function() {
    this.partial = new XPartial(this.getInner(),this.options.partialOptions);
  },

  getFx : function() {
    if(!this.fx) {
      this.fx = new Fx.Morph(this.getElement(),this.options.fxOptions);
    }
    return this.fx;
  },

  getFadeFx : function() {
    if(!this.fadeFx) {
      this.fadeFx = new Fx.Morph(this.getElement(),this.options.fadeFxOptions);
    }
    return this.fadeFx;
  },

  cancelAnimation : function() {
    this.getFx().cancel();
  },

  getPartial : function() {
    return this.partial;
  },

  setupEvents : function() {
    this.getPartial().addEvents({
      onReady : this.onPartialReady
    });
    this.getElement().addEvents({
      'mouseenter':function(event) {
        event.stop();
        this.onFocus();
      }.bind(this),
      'mouseleave':function(event) {
        event.stop();
        this.onBlur();
        this.pollHide();
      }.bind(this)
    });
  },

  getElement : function() {
    return this.element;
  },

  toElement : function() {
    return this.getElement();
  },

  addClass : function(klass) {
    this.getElement().addClass(klass);
  },

  removeClass : function(klass) {
    this.getElement().removeClass(klass);
  },

  getInner : function() {
    return this.inner;
  },

  getPosition : function() {
    return this.getElement().getPosition();
  },

  applyOffset : function(x,y) {
    var offset = this.options.offset;
    return {
      x : x + offset.x,
      y : y + offset.y
    };
  },

  setPosition : function(x,y) {
    this.cancelAnimation();
    var coords = this.applyOffset(x,y);
    this.getElement().setStyles({
      'top':coords.y,
      'left':coords.x
    });
  },

  moveTo : function(x,y) {
    this.isWithinMovingRange(x,y) && this.isVisible() ? this.move(x,y) : this.setPosition(x,y);
  },

  move : function(x,y) {
    var coords = this.applyOffset(x,y);
    this.getFx().start({
      'top':coords.y,
      'left':coords.x
    });
  },

  isWithinMovingRange : function(x,y) {
    var pos = this.getPosition();
    var range = this.options.moveRange;
    return Math.abs(pos.x-x) <= range && Math.abs(pos.y-y) <= range;
  },

  positionAtElement : function(element,area) {
    var tip = this.getElement();
    var coords = MooTipsy.Areas.calculate(tip,element,area);
    this.moveTo(coords.x,coords.y);
  },

  show : function() {
    this.onBeforeShow();
    this.getElement().setStyles({
      'display':'block',
      'opacity' : 1
    });
    this.onAfterShow();
  },

  reveal : function() {
    this.onBeforeShow();
    this.getFadeFx().set({
      'display':'block',
      'opacity':0
    }).start({
      'opacity':1
    }).chain(this.onAfterShow);
    this.onShow();
  },

  dissolve : function() {
    this.getFadeFx().start({
      'opacity':0
    }).chain(this.hide);
  },

  hide : function() {
    this.onBeforeHide();
    this.getElement().setStyles({
      'display':'none',
      'opacity' : 0
    });
    this.onAfterHide();
  },

  isVisible : function() {
    return this.getElement().getStyle('display')=='block';
  },

  isHidden : function() {
    return !this.isVisible();
  },

  incrementZIndex : function() {
    var element = this.getElement();
    var key = 'z-index';
    element.setStyle(key,element.getStyle(key).toInt()+1);
  },

  load : function(url,method,data,options) {
    var args = this.options.loadOptions;
    if(url || args.url) {
      args = [
        url || args.url,
        method || args.method,
        data || args.data,
        Object.append(args.options,options)
      ];
      this.cache.load = args;
      var partial = this.getPartial();
      partial.load.apply(partial,args);
    }
  },

  reload : function() {
    this.load.apply(this,this.cache.load);
  },

  setContent : function(content) {
    var element = $(this.getPartial());
    element.empty();
    typeOf(content) == 'string' ? element.set('html',content) : element.adopt(content);
  },

  getContent : function() {
    return this.getInner();
  },

  getContentHTML : function() {
    return this.getInner().get('html');
  },

  onPartialReady : function() {

  },

  onBeforeShow : function() {
    if(this.options.incrementZIndex) {
      this.incrementZIndex();
    }
    this.fireEvent('beforeShow',[this]);
  },

  onAfterShow : function() {
    if(this.options.loadOnShow) {
      this.reload();
    }
    this.fireEvent('afterShow',[this]);
  },

  onBeforeHide : function() {
    this.fireEvent('beforeHide',[this]);
  },

  onAfterHide : function() {
    this.fireEvent('afterHide',[this]);
  },

  onShow : function() {
    this.fireEvent('show');
  },

  onHide : function() {
    this.fireEvent('hide');
  },

  onFocus : function() {
    this.focus = true;
  },

  onBlur : function() {
    this.focus = false;
  },

  hasFocus : function() {
    return !! this.focus;
  },

  bindContainerEvents : function(container,selector,events) {
    container = document.id(container);
    events = events || {};
    var callbacks = {};
    var relay = 'relay('+selector+')';
    callbacks['mouseenter:'+relay] = function(event,target) {
      this.onBoundEventEnter(target,events.onShow);
    }.bind(this);
    callbacks['mouseleave:'+relay] = function(event,target) {
      this.onBoundEventLeave(target,events.onHide);
    }.bind(this);
    container.addEvents(callbacks);
  },

  bindElementEvents : function(selector,events) {
    events = events || {};
    var that = this;
    $$(selector).addEvents({
      'mouseenter':function() {
        that.onBoundEventEnter(this,events.onShow);
      },
      'mouseleave':function() {
        that.onBoundEventLeave(this,events.onHide);
      }
    });
  },

  onBoundEventEnter : function(target,fn) {
    this.onFocus();
    this.positionAtElement(target);
    this.isVisible() ? this.show() : this.reveal();
    if(fn) { 
      fn(this, target);
    }
  },

  onBoundEventLeave : function(target,fn) {
    this.onBlur();
    this.pollHide(fn, target);
  },

  pollHide : function(fn, target) {
    clearTimeout(this.hideTimer);
    this.hidetimer = (function() {
      clearTimeout(this.hideTimer);
      if(fn) {
        fn(this, target);
      }
      if(!this.hasFocus()) {
        this.dissolve();
      }
    }).delay(200,this);
  },

  destroy : function() {
    this.destroy = function() { };
    this.getContainer().destroy();
    MooTipsy.destroy(this);
  }

});

MooTipsy.Areas = {

  calculate : function(tip,element,bounds) {
    bounds = this.getBounds(bounds);
    return {
      x : this.getX(tip,element,bounds[0]),
      y : this.getY(tip,element,bounds[1])
    };
  },

  getBounds : function(bounds) {
    bounds = (bounds || '').split(' ');
    if(!bounds) {
      bounds = [];
    }
    bounds[0] = bounds[0] || 'center';
    bounds[1] = bounds[1] || 'bottom';
    return bounds;
  },

  getY : function(tip,element,bound) {
    var y = element.getPosition().y;
    var heightA = element.getSize().y;
    var heightB = tip.getDimensions().height;
    switch(bound) {
      case 'top':
        y += 0;
      break;
      case 'center':
        y += Math.floor(heightA / 2);
      break;
      case 'bottom':
        y += heightA;
      break;
    }
    return y;
  },

  getX : function(tip,element,bound) {
    var x = element.getPosition().x;
    var widthA = element.getSize().x;
    var widthB = tip.getDimensions().width;
    switch(bound) {
      case 'top':
        x += 0;
      break;
      case 'center':
        x += Math.floor(widthA / 2);
      break;
      case 'bottom':
        x += widthA;
      break;
    }
    return x;
  }

};

})(document.id);
