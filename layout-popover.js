import clamp from 'https://cdn.jsdelivr.net/gh/mreinstein/math-gap@master/src/clamp.js';


const POPPER_GAP = 4;    // pixels to leave between the popper and it's reference element
const ARROW_MARGIN = 10; // the length of the margin in the popover where the arrow is displayed


// returns popover result position, arrow side, arrow location
export default function layoutPopover (viewport, reference, popper) {
    
    // when zoomed in or out, we're using the browser's built in controls to pane around the screen.
    // no need to update layout the popper in this case.
    if (viewport.scale !== 1)
        return;

    // detect when the reference element is completely offscreen
    if (reference.x < 0 || reference.x >= viewport.width || reference.y < 0 || reference.y >= viewport.height)
      return { referenceOutOfBounds: true };

    // TODO: look at tab focus for accessibility
    //       https://developers.google.com/web/fundamentals/accessibility/focus/using-tabindex

    // TODO: consider storing the regions somewhere and only updating them when the viewport size changes


    // define the 4 quadrants around the reference element
    const regions = {
        n: {
            height: reference.y,
            width: viewport.width
        },
        s: {
            height: viewport.height - reference.y - reference.height,
            width: viewport.width
        },
        e: {
            height: viewport.height,
            width: viewport.width - reference.x - reference.width 
        },
        w: {
            height: viewport.height,
            width: reference.x
        },
   }

   let highestR, highestName;

   for (const r in regions) {
        const { height, width } = regions[r];
        const fits = (height >= popper.height) && (width >= popper.width);
       
        if (fits) {
            const surfaceArea = height * width;
            if (!highestR || highestR <= surfaceArea) {
                highestR = surfaceArea;
                highestName = r;
            }
        }
   }

   // highestName now has the chosen display quadrant

   // figure out where to anchor the popper. try to center it on the reference element.
   let x, y;
   const arrow = { x: 0, y: 0 };

   if (highestName === 's') {
       y = reference.y + viewport.pageTop + reference.height + POPPER_GAP;
       const maxX = viewport.pageLeft + viewport.width - popper.width;
       x = clamp(reference.x + viewport.pageLeft - (popper.width / 2) + (reference.width/2), viewport.pageLeft, maxX);

       arrow.x = reference.x + viewport.pageLeft + (reference.width/2) - ARROW_MARGIN;
       arrow.x = arrow.x - x;
       arrow.y = 0;

   } else if (highestName === 'n') {
       y = reference.y - POPPER_GAP - popper.height;
       x = clamp(reference.x - (popper.width / 2) + (reference.width/2), viewport.pageLeft, viewport.width + viewport.pageLeft);

       arrow.x = reference.x + viewport.pageLeft + (reference.width/2) - ARROW_MARGIN;
       arrow.x = arrow.x - x;
       arrow.y = 0;

   } else if (highestName === 'e') {
       y = clamp( (reference.y + viewport.pageTop) - (popper.height / 2), viewport.pageTop, viewport.height + viewport.pageTop);
       x = reference.x + viewport.pageLeft + reference.width + POPPER_GAP;

       arrow.x = 0;
       arrow.y = reference.y + viewport.pageTop + (reference.height / 2) - ARROW_MARGIN;
       arrow.y = arrow.y - y;

   } else if (highestName === 'w') {
       y = clamp(reference.y + viewport.pageTop - (popper.height / 2), viewport.pageTop, viewport.height + viewport.pageTop);
       x = reference.x + viewport.pageLeft - POPPER_GAP - popper.width - ARROW_MARGIN;

       arrow.x = 0;
       arrow.y = reference.y + viewport.pageTop + (reference.height / 2) - ARROW_MARGIN;
       arrow.y = arrow.y - y;

   }


   // popper doesn't fit into any quadrant of the screen. center it over the reference element instead.
   if (!highestR) {
       y = reference.y + viewport.pageTop + (reference.height/2) - (popper.height / 2);
       x = reference.x + viewport.pageLeft + (reference.width/2) - (popper.width / 2);
   }


   return { arrow, dir: highestName || '', popper: { x, y } };
}
