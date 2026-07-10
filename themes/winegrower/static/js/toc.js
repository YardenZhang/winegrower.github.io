// TOC scroll spy
var spy = function () {
  var headers = {};
  var current = "";

  document.querySelectorAll(".post-body :is(h1, h2, h3, h4, h5, h6)").forEach(function (h) {
    if (h.id) headers[h.id] = h.offsetTop;
  });

  var scrollY = window.scrollY + 100;
  for (var id in headers) {
    if (headers[id] <= scrollY) {
      current = id;
    }
  }

  document.querySelectorAll(".toc a").forEach(function (a) {
    a.classList.remove("toc-active");
    if (a.getAttribute("href") === "#" + current) {
      a.classList.add("toc-active");
    }
  });
};

window.addEventListener("scroll", spy, { passive: true });
window.addEventListener("resize", spy, { passive: true });
