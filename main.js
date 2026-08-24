/* 스크롤하면서 섹션이 하나씩 올라오는 효과.
   IntersectionObserver 는 스크롤 이벤트보다 가볍고 끊김이 없습니다. */
(function () {
  var targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  // 지원하지 않는 브라우저에서는 그냥 다 보이게
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // 한 번만 실행
    });
  }, {
    // 섹션이 화면 아래에서 15% 정도 올라왔을 때 시작
    rootMargin: '0px 0px -15% 0px',
    threshold: 0.1
  });

  targets.forEach(function (el) { observer.observe(el); });
})();
