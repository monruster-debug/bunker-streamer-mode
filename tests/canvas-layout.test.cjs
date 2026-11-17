const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runInNewContext}=require('node:vm');
const fs=require('node:fs');
const scope={window:{}};runInNewContext(fs.readFileSync('canvas-layout.js','utf8'),scope);
const fit=scope.window.S42Layout.fit;
test('both supported canvases are pixel exact at their native resolutions',()=>{
 for(const [width,height,wide] of [[1920,1080,false],[2560,1440,true]]){
  const result=fit(width,height,wide);assert.equal(result.width,width);assert.equal(result.height,height);
  assert.equal(result.scale,1);assert.equal(result.left,0);assert.equal(result.top,0);
 }
});
test('the reported 1817px preview fits the entire Full HD canvas without changing its layout',()=>{
 const r=fit(1817,1243,false);assert.equal(r.width,1920);assert.equal(r.height,1080);
 assert.equal(r.scale,1817/1920);assert.ok(r.left+r.width*r.scale<=1817+.001);
 assert.ok(r.top+r.height*r.scale<=1243+.001);
});
test('height-limited windows fit and center the selected QHD canvas',()=>{
 const r=fit(2560,1200,true);assert.equal(r.scale,1200/1440);assert.ok(r.left>0);
 assert.equal(r.top,0);assert.ok(r.left+r.width*r.scale<=2560);
});
