# popperjs-layout

DOM layout helper functions extracted from popper.js


## why

popper.js is a thoughtful and well designed library, but most of it's value is in the helper functions that
provide details on how to measure where in the viewport a reference element or popper element is.

This code extracts _only_ the low level layout related functions in that module and exposes them here.


## demo

open `example.html` to see a very minimal popover implementation based on this code.



## Important APIs

* `visualViewport` native browser API, provides bounds on the part of the page visible in the viewport, and the current scale
* `src/getCompositeRect` get the position and dimensions of an element relative to the visualViewport.
* `src/getLayoutRect`  get position and dimensions of an element in page coordinates
