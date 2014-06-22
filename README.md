# Deckard - A Web Animations API driven slide deck library.

I know what you're thinking - the last thing the world needs is another
javascript slide deck library.

Deckard is a little different though, because it uses the
[Web Animations](http://dev.w3.org/fxtf/web-animations/) API.  It doesn't have
any dependencies, except the
[Web Animations Polyfill](https://github.com/web-animations/web-animations-js)
if you want to support browsers that haven't implemented the API.

## Demos

* [Simple](https://rawgit.com/pete-otaqui/deckard/master/demo/01-simple.html)
* [Config](https://rawgit.com/pete-otaqui/deckard/master/demo/02-config.html)

## Implementation

Deckard needs at least the following HTML:

```html
<div class="deckard-holder">
    <ul class="deckard-set">
        <li class="deckard-item">
            <h2>I am a slide</h2>
        </li>
        <li class="deckard-item">
            <h2>I am a slide</h2>
        </li>
    </ul>
</div>
```

You can customize the transition between all slides in a declarative fashion:

```html
<div class="deckard-holder" data-deckard-transition="fall">
    <ul class="deckard-slides">
        <li class="deckard-slide">
            <h2>I am a slide</h2>
        </li>
        <li class="deckard-slide">
            <h2>I am a slide</h2>
        </li>
    </ul>
</div>
```

Or you can customize the transition for a single slide:

```html
<div class="deckard-holder">
    <ul class="deckard-slides">
        <li class="deckard-slide">
            <h2>I am a slide</h2>
        </li>
        <li class="deckard-slide" data-deckard-transition="fall">
            <h2>I am a slide</h2>
        </li>
    </ul>
</div>
```

## Transitions

In Deckard a "transition" is a set of animations for moving to and from a slide.
Deckard transitions can provide only two animations (to and from) or four (as
before doubled for when navigating forward and backward).

The default transitions, which you can define as described above are:

* slide (Deckard's own default)
* fade
* fall


## Creating Animations and Transitions

You can compose your own transitions for Deckard. Each transition should look
like this:

```js
// same animations in either direction:
my_custom_transition = {
    animIn: deckardAnimationFunctionFoo,
    animOut: deckardAnimationFunctionBar
}
// different animations for forward and backward
my_custom_transition = {
    animInForward: deckardAnimationFunctionFoo,
    animOutForward: deckardAnimationFunctionBar,
    animInBackward: deckardAnimationFunctionBaz,
    animOutBackward: deckardAnimationFunctionEck
}
```

As you might gather, you need to start by creating animation functions.


### Why don't I use the Web Animations API directly? 

Deckard uses "function currying", so that you don't need to pass in an element
in order to create animations or animation groups (normally you do need to do
this for the Web Animations API).

```js
// Native Web Animations API is like this:

var element = document.querySelector('.foo');
var animation = new Animation(
    element,
    [{opacity:0}, {opacity:1}],
    {duration:1000}
);

// That's annoying, since we want to compose animations and apply them to
// lots of elements.  So a simplified version of what Deckard does looks like:

function makeAnimation(props_array, options) {
    return function(el) {
        return new Animation(el, props_array, options);
    };
}
```

### Complete Transition example

Deckard actually uses an extra first parameter as the "name".

```js
// Now we can compose animation functions like this:

Deckard.makeAnimation(
    'slowFadeIn',
    [{opacity:0}, {opacity:1}],
    {duration:2000}
);
Deckard.makeAnimation(
    'slowFadeOut',
    [{opacity:1}, {opacity:0}],
    {duration:2000}
);

Deckard.makeTransition('slowFade', {
    animIn: 'slowFadeIn',
    animOut: 'slowFadeOut'
});
```

Running the code above will enable a new transition in Deckard which you can use
in your HTML like so:

```html
<div class="deckard-slide" data-deckard-transition="slowFade">
    <!-- content -->
</div>
```