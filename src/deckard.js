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
        D.animateIn(deck, index, direction);
        if ( deck.current !== null ) {
            D.animateOut(deck, deck.current, direction);
        }
        deck.current = index;
    };







    /*************************************
     NAVIGATION AND ANIMATION
    *************************************/

    D.animateIn = function(deck, index, direction) {
        var slide = deck.slides.item(index);
        slide.classList.add('active');
        slide.style.zIndex = D.config.slide_zIndex_active;
        var translation_start = 'translate(20px, 0)';
        if ( direction < 0 ) {
            translation_start = 'translate(-20px, 0)';
        }
        var player = slide.animate([
            {opacity: 0, transform: translation_start},
            {opacity: 1, transform: 'translate(0, 0)'}
        ], {
            duration: 300
        });
        player.addEventListener('finish', function(ev) {
            D.debug('finished animateSlideIn', ev);
            deck.navigating = false;
        })
    };

    D.animateOut = function(deck, index, direction) {
        var slide = deck.slides.item(index);
        slide.style.zIndex = D.config.slide_zIndex_inactive;
        var translation_end = 'translate(-20px, 0)';
        if ( direction < 0 ) {
            translation_end = 'translate(20px, 0)';
        }
        var player = slide.animate([
            {opacity: 1, transform: 'translate(0, 0)'},
            {opacity: 0, transform: translation_end}
        ], {
            duration: 300
        });
        player.addEventListener('finish', function(ev) {
            D.debug('finished animateSlideOut', ev);
            deck.slides.item(index).classList.remove('active');
        })
    };


    D.makeAnimation = function(name, props, options) {
        if (!options.duration) {
            options.duration = D.config.duration;
        }
        D.animations[name] = function(el) {
            return new Animation(el, props, options);
        };
        return D.animations[name];
    }

    D.transitions = {};
    D.addTransition = function(name, properties_start, properties_end, included_transitions) {
        if ( included_transitions ) {
            console.log(included_transitions);
            included_transitions
                .map(function(tn) { return D.transitions[tn]; })
                .forEach(function(t) {
                    var k;
                    for ( k in t[0] ) properties_start[k] = t[0][k];
                    for ( k in t[1] ) properties_end[k] = t[1][k];
                });
        }
        D.transitions[name] = [properties_start, properties_end];
    };
    D.addTransition('fade_in',
        {opacity: 0},
        {opacity: 1}
    );
    D.addTransition('fade_out',
        {opacity: 1},
        {opacity: 0}
    );
    D.addTransition('slide_to_left',
        {transform: 'translate(0, 0)'},
        {transform: 'translate(-20px, 0)'}
    );
    D.addTransition('slide_from_left'   ,
        {transform: 'translate(-20px, 0)'},
        {transform: 'translate(0, 0)'}
    );
    D.addTransition('slide_to_right',
        {transform: 'translate(0, 0)'},
        {transform: 'translate(20px, 0)'}
    );
    D.addTransition('slide_from_right',
        {transform: 'translate(20px, 0)'},
        {transform: 'translate(0, 0)'}
    );
    D.addTransition('grow',
        {transform:'scale(0.5, 0.5)'},
        {transform:'scale(0, 0)'}
    );
    D.addTransition('shrink',
        {transform:'scale(0.5, 0.5)'},
        {transform:'scale(0, 0)'}
    );

    D.addTransition('fade_out_to_left', {}, {}, ['fade_out', 'slide_to_left']);
    D.addTransition('fade_out_to_right', {}, {}, ['fade_out', 'slide_to_right']);
    D.addTransition('fade_in_from_left', {}, {}, ['fade_in', 'slide_from_left']);
    D.addTransition('fade_in_from_right', {}, {}, ['fade_in', 'slide_from_right']);

    D.core_transitions = {
        slide_in_from_left: [],
        slide_in_from_right: [],
        slide_in_from_bottom: [],
        slide_in_from_top: [],
        slide_out_to_left: [],
        slide_out_to_right: [],
        slide_out_to_bottom: [],
        slide_out_to_top: [],
        fade_in: [],
        fade_out: [],
        grow: [],
        shrink: []
    };






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
