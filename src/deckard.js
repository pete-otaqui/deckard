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
     NAVIGATION AND ANIMATION
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
        var direction = (deck.current===null) ? 1 : index - deck.current;
        D.info('D.showDeckIndex', deck, index);
        D.animateSlideIn(deck, index, direction);
        if ( deck.current !== null ) {
            D.animateSlideOut(deck, deck.current, direction);
        }
        deck.current = index;
    };

    D.animateSlideIn = function(deck, index, direction) {
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
        })
    };

    D.animateSlideOut = function(deck, index, direction) {
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
                current: null
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
