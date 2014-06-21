(function(context) {

    /*************************************
     HELPER METHODS
    *************************************/

    // shortcut for querySelectorAll
    var $ = function(sel_or_el) {
        if ( sel_or_el.tagName ) {
            return sel_or_el;
        } else {
            return document.querySelectorAll(sel_or_el);
        }
    }
    var forEach = Array.prototype.forEach;
    var forEachNL = function(nl, cb) {
        return forEach.call(nl, cb);
    };

    var map = Array.prototype.map;
    var mapNL = function(nl, cb) {
        return map.call(nl, cb);
    };

    var log = function(level, name, args) {
        if ( D.config.log_level >= level ) {
            console[name].apply(console, args);
        }
    };




    /*************************************
     DECKARD & CONFIG
    *************************************/

    var Deckard, D;

    D = Deckard = {
        decks: [],
        constants: {
            LOG_DEBUG: 4,
            LOG_INFO:  3,
            LOG_WARN:  2,
            LOG_ERROR: 1
        }
    };
    D.config = {
        duration: 300,
        log_level: D.constants.LOG_INFO,
        key_list_next : [13, 32, 39, 40],
        key_list_previous: [37, 38],
        slide_zIndex_inactive: 1,
        slide_zIndex_active: 2,
        selectors: {
            holder: '.deckard-holder',
            controls: '.deckard-controls',
            previous: '*[data-deckard-navigation="previous"]',
            next: '*[data-deckard-navigation="next"]',
            navigation_items: '*[data-deckard-navigation="items"]',
            set: '.deckard-set',
            item: '.deckard-item'
        }
    };



    /*************************************
     NAVIGATION
    *************************************/

    D.navigatePrevious = function(deck) {
        if ( deck.current > 0 ) {
            D.showDeckIndex(deck, deck.current-1);
        }
    };
    D.navigateNext = function(deck) {
        var len = deck.slides.length;
        if ( deck.current < len - 1 ) {
            D.showDeckIndex(deck, deck.current+1);
        }
    };
    D.showDeckIndex = function(deck, index) {
        D.info('D.showDeckIndex', deck, index);
        if ( index === deck.current ) {
            D.debug('not showing index because we are already showing it');
            return;
        }
        if ( deck.navigating ) {
            D.debug('not showing index because we are navigating');
            return;
        }
        deck.navigating = true;
        var direction = (deck.current===null) ? 1 : index - deck.current;
        var anim_in = D.getAnimationIn(deck, index, direction);
        var anim_out = D.getAnimationOut(deck, index, direction);
        D.animateIn(deck, index, direction);
        if ( deck.current !== null ) {
            D.animateOut(deck, deck.current, direction);
        }
        deck.current = index;
    };







    /*************************************
     ANIMATION
    *************************************/

    D.getAnimationIn = function(deck, index, direction) {
        var set = D.getAnimationSet(deck, index);
        var anim = D.getAnimationFromSet(set, 'in', direction);
        return anim;
    };
    D.getAnimationOut = function(deck, index, direction) {
        var set = D.getAnimationSet(deck, index);
        var anim = D.getAnimationFromSet(set, 'out', direction);
        return anim;
    };
    D.getAnimationSet = function(deck, index) {
        return D.animation_sets.slide;
    };
    D.getAnimationFromSet = function(set, in_or_out, dir) {
        var a_in, a_out;
        if ( set.anim_in_forward ) {
            a_in = (dir >= 0) ? set.anim_in_forward : set.anim_in_backward;
            a_out = (dir >= 0 ) ? set.anim_out_forward : set.anim_out_backward;
        } else {
            a_in = set.anim_in;
            a_out = set.anim_out;
        }
        return ( in_or_out === 'in' ) ? a_in : a_out;
    };

    D.animateIn = function(deck, index, direction) {
        var slide = deck.slides.item(index);
        slide.classList.add('active');
        slide.style.zIndex = D.config.slide_zIndex_active;
        var anim_fn = D.getAnimationIn(deck, index, direction);
        var anim = anim_fn(slide);
        var player = document.timeline.play(anim);
        player.addEventListener('finish', function(ev) {
            D.debug('finished animateSlideIn', ev);
            deck.navigating = false;
        });
    };

    D.animateOut = function(deck, index, direction) {
        var slide = deck.slides.item(index);
        slide.style.zIndex = D.config.slide_zIndex_inactive;
        var anim_fn = D.getAnimationOut(deck, index, direction);
        var anim = anim_fn(slide);
        var player = document.timeline.play(anim);
        player.addEventListener('finish', function(ev) {
            D.debug('finished animateSlideOut', ev);
            deck.slides.item(index).classList.remove('active');
        })
    };


    D.animations = {};
    D.makeAnimation = function(name, props, options) {
        if ( !options ) options = {};
        if ( !options.duration ) options.duration = D.config.duration;
        D.animations[name] = function(el) {
            return new Animation(el, props, options);
        };
        return D.animations[name];
    }
    D.makeAnimationGroup = function(name, children) {
        children = children.map(function(c) { return D.animations[c]; });
        D.animations[name] = function(el) {
            return new AnimationGroup(children.map(function(c) {
                return c(el);
            }));
        }
        return D.animations[name];
    }
    D.makeAnimationSequence = function(name, children) {
        D.animations[name] = function(el) {
            return new AnimationSequence(children.map(function(c) {
                return c(el);
            }));
        }
        return D.animations[name];
    }

    D.makeAnimation('fadeIn',
        [
            {opacity: 0},
            {opacity: 1}
        ]
    );
    D.makeAnimation('fadeOut',
        [
            {opacity: 1},
            {opacity: 0}
        ]
    );
    D.makeAnimation('slideToLeft',
        [
            {transform: 'translate(0, 0)'},
            {transform: 'translate(-20px, 0)'}
        ]
    );
    D.makeAnimation('slideFromLeft',
        [
            {transform: 'translate(-20px, 0)'},
            {transform: 'translate(0, 0)'}
        ]
    );
    D.makeAnimation('slideToRight',
        [
            {transform: 'translate(0, 0)'},
            {transform: 'translate(20px, 0)'}
        ]
    );
    D.makeAnimation('slideFromRight',
        [
            {transform: 'translate(20px, 0)'},
            {transform: 'translate(0, 0)'}
        ]
    );
    D.makeAnimation('grow',
        [
            {transform:'scale(0.5, 0.5)'},
            {transform:'scale(0, 0)'}
        ]
    );
    D.makeAnimation('shrink',
        [
            {transform:'scale(0.5, 0.5)'},
            {transform:'scale(0, 0)'}
        ]
    );

    D.makeAnimationGroup('fadeOutToLeft', ['fadeOut', 'slideToLeft']);
    D.makeAnimationGroup('fadeOutToRight', ['fadeOut', 'slideToRight']);
    D.makeAnimationGroup('fadeInFromLeft', ['fadeIn', 'slideFromLeft']);
    D.makeAnimationGroup('fadeInFromRight', ['fadeIn', 'slideFromRight']);


    D.animation_sets = {};
    D.makeInOutSet = function(name, fns) {
        D.animation_sets[name] = fns;
    }
    D.makeInOutSet('slide', {
        anim_in_forward: D.animations.fadeInFromRight,
        anim_out_forward: D.animations.fadeOutToLeft,
        anim_in_backward: D.animations.fadeInFromLeft,
        anim_out_backward: D.animations.fadeOutToRight
    });
    D.makeInOutSet('fade', {
        anim_in: D.animations.fadeIn,
        anim_out: D.animations.fadeOut
    });



    /*************************************
     LOGGING
    *************************************/

    D.debug = function() {
        log(D.constants.LOG_DEBUG, 'debug', arguments);
    };
    D.info = function() {
        log(D.constants.LOG_INFO, 'info', arguments);
    };
    D.warn = function() {
        log(D.constants.LOG_WARN, 'warn', arguments);
    };
    D.error = function() {
        log(D.constants.LOG_ERROR, 'error', arguments);
    };
    D.setLogLevel = function(level) {
        D.config.log_level = level;
    }

    D.init = function(context) {
        D.debug('D.init', context);
        // capture "window.Deckard = {/* config */}" values
        if ( context.Deckard ) {
            // @TODO implement this!
            D.warn('Deckard config overrides are not currently implemented');
            D.config_overrides = context.Deckard;
        }
        if ( context.module && context.module.exports ) {
            context.module.exports = D;
        } else if ( context.define ) {
            context.define([], function() { return D; } );
        } else {
            context.Deckard = D;
        }
        D.initDecks();
    };


    /*************************************
     DOM ELEMENT GETTERS
    *************************************/

    D.getClickContainer = function(deck) {
        return deck.el;
    };
    D.getRootContainer = function(deck) {
        return context;
    };
    D.getNavigationPrevious = function(deck) {
        return deck.el.querySelector(D.config.selectors.previous);
    };

    D.getNavigationNext = function(deck) {
        return deck.el.querySelector(D.config.selectors.next);
    };

    D.getNavigationItems = function(deck) {
        return deck.el.querySelector(D.config.selectors.navigation_items);
    };

    D.getSlides = function(deck) {
        return deck.el.querySelectorAll(D.config.selectors.item);
    };




    /*************************************
     INIT
    *************************************/

    D.bindNavigationEvents = function(deck) {
        if ( deck.controls.next ) {
            deck.controls.next.addEventListener('click', function(ev) {
                D.navigateNext(deck);
                ev.preventDefault();
                ev.stopPropagation();
            }, false);
        }
        if ( deck.controls.previous ) {
            deck.controls.previous.addEventListener('click', function(ev) {
                D.navigatePrevious(deck);
                ev.preventDefault();
                ev.stopPropagation();
            }, false);
        }
        D.getClickContainer(deck).addEventListener('click', function(ev) {
            D.navigateNext(deck);
        }, false);
        D.getRootContainer(deck).addEventListener('keyup', function(ev) {
            var key_list_next = D.config.key_list_next;
            var key_list_previous = D.config.key_list_previous;
            if ( key_list_next.indexOf(ev.which) !== -1 ) {
                D.navigateNext(deck);
            } else if ( key_list_previous.indexOf(ev.which) !== -1 ) {
                D.navigatePrevious(deck);
            }
        }, false);
    };

    D.initDeck = function(deck) {
        D.bindNavigationEvents(deck);
        D.showDeckIndex(deck, 0);
    }

    D.initDecks = function() {
        forEachNL($('.deckard-holder'), function(el) {
            var deck = {
                el:el,
                current: null,
                navigating: false
            };
            deck.controls = {
                previous: D.getNavigationPrevious(deck),
                next: D.getNavigationNext(deck),
                items : D.getNavigationItems(deck)
            };
            deck.slides = D.getSlides(deck);
            D.debug('adding deck', deck);
            D.decks.push(deck);
            D.initDeck(deck);
        });
    };




    D.init(context);


})(this);
