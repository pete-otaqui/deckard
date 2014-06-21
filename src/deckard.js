(function(context) {

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

    var Deckard, D;

    D = Deckard = {
        decks: [],
        config: {
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
        }
    };

    D.init = function(context) {
        // capture "window.Deckard = {/* config */}" values
        if ( context.Deckard ) {
            // @TODO implement this!
            console.warn('Deckard config overrides are not currently implemented');
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

    D.showDeckIndex = function(deck, index) {
        D.animateSlideIn(deck, index);
        if ( deck.current !== null ) {
            D.animateSlideOut(deck, deck.current);
        }
        deck.current = index;
    };

    D.animateSlideIn = function(deck, index) {
        var slide = deck.slides.item(index);
        slide.classList.add('active');
        slide.style.zIndex = D.config.slide_zIndex_active;
        var player = slide.animate([
            {opacity: 0},
            {opacity: 1}
        ], {
            duration: 1000
        });
        player.addEventListener('finish', function(ev) {
            console.log('finished!', ev);
        })
    };

    D.animateSlideOut = function(deck, index) {
        var slide = deck.slides.item(index);
        slide.style.zIndex = D.config.slide_zIndex_inactive;
        var player = slide.animate([
            {opacity: 1},
            {opacity: 0}
        ], {
            duration: 1000
        });
        player.addEventListener('finish', function(ev) {
            deck.slides.item(index).classList.remove('active');
        })
    };

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
    D.getClickContainer = function(deck) {
        return deck.el;
    };
    D.getRootContainer = function(deck) {
        return context;
    };
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
            D.decks.push(deck);
            D.initDeck(deck);
        });
    };


    D.init(context);


})(this);
