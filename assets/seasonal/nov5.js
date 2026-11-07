(function () {
  function isNov510(d) { return d.getMonth() === 10 && d.getDate() >= 5 && d.getDate() <= 10; }
  function isSnowDay(d) { return d.getMonth() === 10 && d.getDate() >= 8 && d.getDate() <= 10; }

  let _xmasResizeTimer = null;
  let _xmasResizeBound = false;

  function initLights() {
    const colors = ['#ff3b3b','#ffdd00','#3bff6e','#3bb5ff','#ff3bff','#ff8c00'];

    const build = () => {
      const count = Math.max(1, Math.ceil(window.innerWidth / 30));
      const topbar = document.querySelector('.topbar');
      const topOffset = document.documentElement.dataset.theme === 'material2' && topbar
        ? Math.round(topbar.getBoundingClientRect().height)
        : 0;

      const oldUl = document.getElementById('xmas-lights');
      if (oldUl) oldUl.remove();
      const oldStyle = document.getElementById('xmas-lights-style');
      if (oldStyle) oldStyle.remove();

      const style = document.createElement('style');
      style.id = 'xmas-lights-style';
      style.textContent = `
        #xmas-lights{
          position:fixed; top:${topOffset}px; left:0; right:0;
          display:grid;
          grid-template-columns:repeat(${count}, 1fr);
          z-index:9100;
          pointer-events:none;
          margin:0; padding:0; list-style:none;
          box-sizing:border-box;
          height:22px;
          overflow:hidden;
        }
        #xmas-lights li{
          position:relative;
          margin:0; padding:0;
          height:22px;
          list-style:none;
        }
        #xmas-lights li::before{
          content:'';
          position:absolute;
          top:0;
          left:50%;
          transform:translateX(-50%);
          width:2px;
          height:10px;
          background:#555;
        }
        #xmas-lights li span{
          position:absolute;
          top:6px;
          left:50%;
          transform:translateX(-50%);
          display:block;
          width:12px;
          height:16px;
          border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
          animation:glow 1.5s infinite alternate;
        }
        @keyframes glow{
          from{filter:brightness(0.7);}
          to{filter:brightness(1.4) drop-shadow(0 0 5px currentColor);}
        }
      `;
      document.head.appendChild(style);

      const ul = document.createElement('ul');
      ul.id = 'xmas-lights';
      for (let i = 0; i < count; i++) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        const color = colors[i % colors.length];
        span.style.cssText = `background:${color};color:${color};animation-delay:${(i * 0.15) % 1.5}s`;
        li.appendChild(span);
        ul.appendChild(li);
      }
      document.body.prepend(ul);
    };

    build();

    if (_xmasResizeBound) return;
    _xmasResizeBound = true;
    window.addEventListener('resize', () => {
      clearTimeout(_xmasResizeTimer);
      _xmasResizeTimer = setTimeout(build, 80);
    });
  }

  function initSnow() {
    const script = document.createElement('script');
    script.src = '/assets/seasonal/snowflakes.js';
    script.onload = () => new Snowflakes({ color:'#ffffff',count:50,minSize:8,maxSize:20,speed:1.0,wind:true,rotation:true,minOpacity:0.4,maxOpacity:0.9,zIndex:9000 });
    document.head.appendChild(script);
  }

  function initSnowball() {
    const BALL_R=32,STORAGE_KEY='snowball_pos',GRAVITY=0.5,BOUNCE=0.3,FRICTION=0.985,FLOOR_FRICTION=0.92;
    let vw=window.innerWidth,vh=window.innerHeight,x=vw+BALL_R*2,y=vh-BALL_R-2;
    let velX=0,velY=0,dragging=false,dragOffX=0,dragOffY=0;
    let histX=[],histY=[],histT=[],physicsRunning=false,settleTimer=null;
    const div=document.createElement('div');
    Object.assign(div.style,{position:'fixed',width:BALL_R*2+'px',height:BALL_R*2+'px',borderRadius:'50%',background:'radial-gradient(circle at 38% 35%, #ffffff 0%, #dce9f5 45%, #b0cfe8 100%)',boxShadow:'0 4px 12px rgba(0,0,0,0.3), inset -3px -3px 6px rgba(100,150,200,0.3)',zIndex:'2',cursor:'grab',userSelect:'none',opacity:'0',left:x+'px',top:y+'px',transform:'translate(-50%, -50%)',transition:'left 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.1s',touchAction:'none'});
    document.body.appendChild(div);
    function clamp(){vw=window.innerWidth;vh=window.innerHeight;if(x<BALL_R){x=BALL_R;velX=Math.abs(velX)*BOUNCE;}if(x>vw-BALL_R){x=vw-BALL_R;velX=-Math.abs(velX)*BOUNCE;}if(y<BALL_R){y=BALL_R;velY=Math.abs(velY)*BOUNCE;}if(y>vh-BALL_R){y=vh-BALL_R;velY=-Math.abs(velY)*BOUNCE;if(Math.abs(velY)<1)velY=0;velX*=FLOOR_FRICTION;}}
    function physicsLoop(){if(!dragging){velY+=GRAVITY;velX*=FRICTION;velY*=FRICTION;x+=velX;y+=velY;clamp();div.style.left=x+'px';div.style.top=y+'px';const sp=Math.sqrt(velX*velX+velY*velY),onF=y>=window.innerHeight-BALL_R-1;if(sp<0.15&&onF){velX=0;velY=0;if(!settleTimer)settleTimer=setTimeout(()=>{if(Math.sqrt(velX*velX+velY*velY)<0.15)localStorage.setItem(STORAGE_KEY,JSON.stringify({x:Math.round(x),y:Math.round(y)}));settleTimer=null;},800);}else{if(settleTimer){clearTimeout(settleTimer);settleTimer=null;}}}requestAnimationFrame(physicsLoop);}
    div.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;div.setPointerCapture(e.pointerId);div.style.cursor='grabbing';document.body.style.userSelect='none';histX=[e.clientX];histY=[e.clientY];histT=[Date.now()];velX=0;velY=0;});
    div.addEventListener('pointermove',e=>{if(!dragging)return;e.preventDefault();x=e.clientX;y=e.clientY;div.style.left=x+'px';div.style.top=y+'px';histX.push(e.clientX);histY.push(e.clientY);histT.push(Date.now());if(histX.length>8){histX.shift();histY.shift();histT.shift();}});
    div.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;div.style.cursor='grab';document.body.style.userSelect='';if(histX.length>=2){const dt=(histT[histT.length-1]-histT[0])/1000;if(dt>0){velX=(histX[histX.length-1]-histX[0])/dt*0.12;velY=(histY[histY.length-1]-histY[0])/dt*0.12;}}});
    window.addEventListener('resize',()=>{vw=window.innerWidth;vh=window.innerHeight;x=Math.max(BALL_R,Math.min(x,vw-BALL_R));y=Math.min(y,vh-BALL_R);});
    setTimeout(()=>{vw=window.innerWidth;vh=window.innerHeight;y=vh-BALL_R-2;const tx=vw*0.15;div.style.top=y+'px';div.style.opacity='1';div.style.left=tx+'px';x=tx;div.addEventListener('transitionend',e=>{if(e.propertyName!=='left')return;div.style.transition='none';if(!physicsRunning){physicsRunning=true;physicsLoop();}},{once:true});},3000);
  }

  function run(d) {
    if (!isNov510(d)) return;
    initLights();
    initSnowball();
    if (isSnowDay(d)) initSnow();
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isNov510(now)) run(now);

})();