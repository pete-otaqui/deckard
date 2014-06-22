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
        transition: 'slide',
        duration: 400,
        ease: 'linear',
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
            set: '.deckard-slides',
            item: '.deckard-slide'
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
        D.debug('D.showDeckIndex', deck, index);
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
        var animIn = D.getAnimationIn(deck, index, direction);
        var animOut = D.getAnimationOut(deck, index, direction);
        D.animateIn(deck, index, direction);
        if ( deck.current !== null ) {
            D.animateOut(deck, deck.current, direction);
        }
        deck.current = index;
    };







    /*************************************
     ANIMATION
    *************************************/
    D.getTransitionNameForElement = function(deck, el) {
        var el_anim = el.getAttribute('data-deckard-transition');
        var anim;
        if ( el_anim ) {
            anim = el_anim;
        } else if ( deck.transition ) {
            anim = deck.transition;
        } else {
            anim = D.config.transition;
        }
        return anim;
    };

    D.getAnimationIn = function(deck, index, direction) {
        var transition = D.getTransition(deck, index);
        var anim = D.getAnimationFromTransition(transition, 'in', direction);
        return anim;
    };
    D.getAnimationOut = function(deck, index, direction) {
        var transition = D.getTransition(deck, index);
        var anim = D.getAnimationFromTransition(transition, 'out', direction);
        return anim;
    };
    D.getTransition = function(deck, index) {
        var el = deck.slides.item(index);
        var anim = D.getTransitionNameForElement(deck, el);
        return D.transitions[anim];
    };
    D.getAnimationFromTransition = function(transition, in_or_out, dir) {
        var a_in, a_out;
        if ( transition.animInForward ) {
            a_in = (dir >= 0) ? transition.animInForward : transition.animInBackward;
            a_out = (dir >= 0 ) ? transition.animOutForward : transition.animOutBackward;
        } else {
            a_in = transition.animIn;
            a_out = transition.animOut;
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
            // D.info('finished animateSlideIn', ev);
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
        if ( !options.easing ) options.easing = 'ease-in-out';
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
            {transform: 'translate(-40px, 0)'}
        ]
    );
    D.makeAnimation('slideFromLeft',
        [
            {transform: 'translate(-40px, 0)'},
            {transform: 'translate(0, 0)'}
        ]
    );
    D.makeAnimation('slideToRight',
        [
            {transform: 'translate(0, 0)'},
            {transform: 'translate(40px, 0)'}
        ]
    );
    D.makeAnimation('slideFromRight',
        [
            {transform: 'translate(40px, 0)'},
            {transform: 'translate(0, 0)'}
        ]
    );
    D.makeAnimation('scaleUpToOne',
        [
            {transform:'scale(0.5, 0.5)'},
            {transform:'scale(1, 1)'}
        ]
    );
    D.makeAnimation('scaleDownFromOne',
        [
            {transform:'scale(1, 1)'},
            {transform:'scale(0.5, 0.5)'}
        ]
    );
    D.makeAnimation('scaleUpFromOne',
        [
            {transform:'scale(1, 1)'},
            {transform:'scale(1.5, 1.5)'}
        ]
    );
    D.makeAnimation('scaleDownToOne',
        [
            {transform:'scale(1.5, 1.5)'},
            {transform:'scale(1, 1)'}
        ]
    );
    D.makeAnimation('dropDownOut', 
        [
            {transform:'translate(0, 0)'},
            {transform:'translate(0, 40px)'}
        ]
    );
    D.makeAnimation('dropDownIn', 
        [
            {transform:'translate(0, -40px)'},
            {transform:'translate(0, 0)'}
        ]
    );
    D.makeAnimation('pullUpIn', 
        [
            {transform:'translate(0, 40px)'},
            {transform:'translate(0, 0)'}
        ]
    );
    D.makeAnimation('pullUpOut', 
        [
            {transform:'translate(0, 0)'},
            {transform:'translate(0, -40px)'}
        ]
    );

    D.makeAnimationGroup('fadeOutToLeft', ['fadeOut', 'slideToLeft']);
    D.makeAnimationGroup('fadeOutToRight', ['fadeOut', 'slideToRight']);
    D.makeAnimationGroup('fadeInFromLeft', ['fadeIn', 'slideFromLeft']);
    D.makeAnimationGroup('fadeInFromRight', ['fadeIn', 'slideFromRight']);

    D.makeAnimationGroup('fadeInAndDownToOne', ['fadeIn', 'scaleDownToOne']);
    D.makeAnimationGroup('fadeOutAndDownFromOne', ['fadeOut', 'scaleDownFromOne']);
    D.makeAnimationGroup('fadeInAndUpToOne', ['fadeIn', 'scaleUpToOne']);
    D.makeAnimationGroup('fadeOutAndUpFromOne', ['fadeOut', 'scaleUpFromOne']);

    D.makeAnimationGroup('fadeInAndDropDown', ['fadeIn', 'dropDownIn']);
    D.makeAnimationGroup('fadeOutAndDropDown', ['fadeOut', 'dropDownOut']);
    D.makeAnimationGroup('fadeInPullUp', ['fadeIn', 'pullUpIn']);
    D.makeAnimationGroup('fadeOutAndPullUp', ['fadeOut', 'pullUpOut']);


    D.transitions = {};
    D.makeTransitions = function(name, fns) {
        D.transitions[name] = fns;
    }
    D.makeTransitions('slide', {
        animInForward: D.animations.fadeInFromRight,
        animOutForward: D.animations.fadeOutToLeft,
        animInBackward: D.animations.fadeInFromLeft,
        animOutBackward: D.animations.fadeOutToRight
    });
    D.makeTransitions('fade', {
        animIn: D.animations.fadeIn,
        animOut: D.animations.fadeOut
    });
    D.makeTransitions('fall', {
        animInForward: D.animations.fadeInAndDownToOne,
        animOutForward: D.animations.fadeOutAndDownFromOne,
        animInBackward: D.animations.fadeInAndUpToOne,
        animOutBackward: D.animations.fadeOutAndUpFromOne
    });
    D.makeTransitions('drop', {
        animInForward: D.animations.fadeInAndDropDown,
        animOutForward: D.animations.fadeOutAndDropDown,
        animInBackward: D.animations.fadeInPullUp,
        animOutBackward: D.animations.fadeOutAndPullUp
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

    D.initDeckard = function(context) {
        D.debug('D.init', context);
        // capture "window.Deckard = {/* config */}" values
        if ( context.Deckard ) {
            // @TODO implement this!
            D.warn('Deckard config overrides are not currently implemented');
            var key;
            for ( key in context.Deckard ) {
                console.log(key);
                D.config[key] = context.Deckard[key];
            }
        }
        if ( context.module && context.module.exports ) {
            context.module.exports = D;
        } else if ( context.define ) {
            context.define([], function() { return D; } );
        } else {
            context.Deckard = D;
        }
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

    D.init = function() {
        forEachNL($('.deckard-holder'), function(el) {
            var deck = {
                el:el,
                current: null,
                navigating: false
            };
            deck.animation = D.getTransitionNameForElement(deck, el);
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


    D.initDeckard(context);


})(this);
