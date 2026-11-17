const {test}=require('node:test');const assert=require('node:assert/strict');
const {runInNewContext}=require('node:vm');const fs=require('node:fs');
test('camera assignments preserve explicit mappings, default by position and stay mounted on timer changes',()=>{
 const element=()=>({children:[],dataset:{},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},setAttribute(){},addEventListener(type,handler){this[type]=handler;}});
 const list=element();let saved=0;
 const scope={settingsOpen:true,wideLayout:{matches:false},game:{players:[{number:'1',name:'А'},{number:'2',name:'Б'},{number:'3',name:'В'}]},options:{grid:'2x2',map:{'1:А':4,'3:В':0}},$:()=>list,document:{createElement:element},playerKey:p=>p.number+':'+p.name,save:()=>{saved++;return Promise.resolve();},render(){},updateSourceStatus(){}};
 scope.gridDims=()=>{const [cols,rows]=scope.options.grid.split('x').map(Number);return {cols,total:cols*rows};};
 const source=fs.readFileSync('overlay.js','utf8');runInNewContext(source.slice(source.indexOf("let previousAssignmentsRender="),source.indexOf('function render(){')),scope);
 scope.renderCameraAssignments();const selects=list.children.map(label=>label.children[1]);
 assert.deepEqual(selects.map(s=>s.value),['4','2','0']);
 assert.equal(selects[0].children[4].textContent,'Камера 4 · ряд 2, место 2');
 scope.game.timer='00:30';scope.renderCameraAssignments();assert.equal(list.children[0].children[1],selects[0]);
 selects[1].value='3';selects[1].change();assert.equal(scope.options.map['2:Б'],3);assert.equal(saved,1);
 scope.options.map['1:А']=12;scope.renderCameraAssignments();assert.equal(list.children[0].children[1].value,'0');assert.equal(scope.options.map['1:А'],12);
 scope.options.grid='4x3';scope.renderCameraAssignments();assert.equal(list.children[0].children[1].value,'12');
});
