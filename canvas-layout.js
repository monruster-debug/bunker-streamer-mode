'use strict';
// Fit one of the two Figma canvases without creating an intermediate layout.
window.S42Layout={
 fit(viewportWidth,viewportHeight,wide){
  const width=wide?2560:1920,height=wide?1440:1080;
  const scale=Math.min(1,Math.max(0,viewportWidth)/width,Math.max(0,viewportHeight)/height);
  return {width,height,scale,left:Math.max(0,(viewportWidth-width*scale)/2),top:Math.max(0,(viewportHeight-height*scale)/2)};
 }
};
