(function () {
  var lb = document.getElementById('lb');
  if (!lb) return;
  var img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
  var list = [], idx = 0, title = '', opener = null;
  function show() {
    img.src = list[idx];
    img.alt = title + ' 화면 ' + (idx + 1);
    cap.textContent = title + '  ·  ' + (idx + 1) + ' / ' + list.length;
    var multi = list.length > 1;
    lb.querySelector('.lb-prev').hidden = !multi;
    lb.querySelector('.lb-next').hidden = !multi;
  }
  function open(btn) {
    list = btn.getAttribute('data-shots').split(',');
    title = btn.getAttribute('data-title');
    idx = 0; opener = btn; show();
    lb.hidden = false; document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }
  function close() {
    lb.hidden = true; document.body.style.overflow = '';
    if (opener) opener.focus();
  }
  function step(d) { idx = (idx + d + list.length) % list.length; show(); }
  document.querySelectorAll('.ax-shots').forEach(function (b) {
    b.addEventListener('click', function () { open(b); });
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();
