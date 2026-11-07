(function () {
  function isSpecialDay(d) {
    return (d.getMonth() === 2 && d.getDate() === 22) ||
           (d.getMonth() === 0 && d.getDate() === 15);
  }

  function init() {
    const img = document.createElement('img');
    img.src = '/assets/meow/bk.gif';
    Object.assign(img.style, {
      position:      'fixed',
      bottom:        '16px',
      left:          '16px',
      width:         '80px',
      height:        '80px',
      objectFit:     'contain',
      zIndex:        '9000',
      pointerEvents: 'none',
    });
    document.body.appendChild(img);
  }

  const now = window.MEW_FORCE_DATE ? new Date(window.MEW_FORCE_DATE) : new Date();
  if (isSpecialDay(now)) init();

})();