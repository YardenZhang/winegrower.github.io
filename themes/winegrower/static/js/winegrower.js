/**
 * winegrower.js
 * Hugo theme — warm minimal academic blog
 * Combines Luka template's theme toggle + diary theme's drawer + scroll handler
 */

// ============================================
// Debounce utility
// ============================================
function debounce(func, wait, options) {
  let lastArgs, lastThis, maxWait, result, timerId, lastCallTime;
  let lastInvokeTime = 0;
  let leading = false;
  let maxing = false;
  let trailing = true;
  const useRAF = !wait && wait !== 0 && typeof requestAnimationFrame === "function";

  if (typeof func !== "function") throw new TypeError("Expected a function");

  wait = +wait || 0;
  if (typeof options === "object") {
    leading = !!options.leading;
    maxing = "maxWait" in options;
    maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait;
    trailing = "trailing" in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function startTimer(pendingFunc, wait) {
    if (useRAF) {
      cancelAnimationFrame(timerId);
      return requestAnimationFrame(pendingFunc);
    }
    return setTimeout(pendingFunc, wait);
  }

  function cancelTimer(id) {
    if (useRAF) return cancelAnimationFrame(id);
    clearTimeout(id);
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || (maxing && timeSinceLastInvoke >= maxWait);
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) return trailingEdge(time);
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;
    if (trailing && lastArgs) return invokeFunc(time);
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) cancelTimer(timerId);
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now());
  }

  function pending() { return timerId !== undefined; }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timerId === undefined) return leadingEdge(lastCallTime);
      if (maxing) {
        timerId = startTimer(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) timerId = startTimer(timerExpired, wait);
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;
  return debounced;
}

// ============================================
// Theme / Dark Mode Toggle
// ============================================
(function() {
  var isDarkMode = false;

  var setGiscusTheme = function(themeName) {
    var trySet = function(retries) {
      var iframe = document.querySelector('iframe.giscus-frame');
      if (iframe) {
        iframe.contentWindow.postMessage({
          giscus: { setConfig: { theme: themeName } }
        }, '*');
      } else if (retries > 0) {
        setTimeout(function() { trySet(retries - 1); }, 300);
      }
    };
    trySet(10); // retry up to 10 times (3s total)
  };

  var applyTheme = function(dark) {
    isDarkMode = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.classList.toggle('night', dark);
    document.cookie = 'night=' + (dark ? '1' : '0') + ';path=/';
    // Update toggle icons
    var cls = dark ? 'fa-sun' : 'fa-moon';
    var icon1 = document.getElementById("darkModeToggleIcon");
    var icon2 = document.getElementById("darkModeToggleIcon2");
    if (icon1) icon1.className = 'fa-solid ' + cls;
    if (icon2) icon2.className = 'fa-solid ' + cls;
    setGiscusTheme(dark ? 'dark' : 'light');
  };

  var toggleDarkMode = function() {
    applyTheme(!isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  };

  // Initialize from localStorage, cookie, or system preference
  var savedTheme = localStorage.getItem('theme');
  var nightCookie = document.cookie.replace(/(?:^|.*;\s*)night\s*=\s*([^;]*).*$|^.*$/, "$1");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme !== null) {
    applyTheme(savedTheme === 'dark');
  } else if (nightCookie === "0") {
    applyTheme(false);
  } else if (prefersDark) {
    applyTheme(true);
  } else {
    applyTheme(false); // default to light
  }

  // Wire up toggle buttons
  var btn1 = document.getElementById("darkModeToggleButton");
  var btn2 = document.getElementById("darkModeToggleButton2");
  if (btn1) btn1.addEventListener("click", toggleDarkMode);
  if (btn2) btn2.addEventListener("click", toggleDarkMode);

})();

// ============================================
// Scroll Animations (from Luka — IntersectionObserver)
// ============================================
(function() {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section').forEach(function(el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.section').forEach(function(el) {
      el.classList.add('visible');
    });
  }
})();

// ============================================
// Scroll Handler (from Diary — nav bar opacity)
// ============================================
(function() {
  const navBar = document.getElementById("navBar");
  const navBackground = document.getElementById("navBackground");
  const navTitle = document.getElementById("navTitle");
  const extraContainer = document.getElementById("extraContainer");

  if (!navBar) return;

  var sgn = function(t, x) {
    let k = 1 / (1 - 2 * t);
    if (x <= t) return 0;
    else if (x >= 1 - t) return 1;
    else return k * (x - t);
  };

  var handleScroll = function() {
    let pageHeadHeight = function() {
      var el = document.getElementById("pageHead");
      return el ? el.offsetHeight : 0;
    };
    let navBarHeight = function() {
      return document.getElementById("navBar").offsetHeight;
    };
    let navOpacity = sgn(
      0.0,
      Math.min(1, Math.max(0, window.scrollY / (pageHeadHeight() - navBarHeight() * 0.8)))
    );
    if (navBackground && navTitle) {
      if (navOpacity >= 1) {
        navBackground.style.opacity = 1;
        navTitle.style.opacity = 1;
      } else {
        navBackground.style.opacity = 0;
        navTitle.style.opacity = 0;
      }
    }
  };

  window.addEventListener("scroll", debounce(handleScroll, 100, { maxWait: 100 }), false);
})();

// ============================================
// Bootstrap table classes
// ============================================
(function() {
  document.querySelectorAll("table").forEach(function(elem) {
    elem.classList.add("table-striped");
    elem.classList.add("table");
    elem.classList.add("table-responsive");
    elem.classList.add("table-hover");
  });
})();

// ============================================
// Drawer (from Diary)
// ============================================
(function() {
  var openDrawer = function() {
    document.getElementsByTagName("html")[0].style.overflow = "hidden";
    var mask = document.getElementById("drawer-mask");
    if (mask) mask.classList.add("single-column-drawer-mask");
    var drawer = document.getElementById("drawer");
    if (drawer) drawer.classList.add("single-column-drawer-container-active");
  };

  var closeDrawer = function() {
    document.getElementsByTagName("html")[0].style.overflow = "unset";
    var mask = document.getElementById("drawer-mask");
    if (mask) mask.classList.remove("single-column-drawer-mask");
    var drawer = document.getElementById("drawer");
    if (drawer) drawer.classList.remove("single-column-drawer-container-active");
  };

  var btn = document.getElementById("nav_dropdown_btn");
  if (btn) btn.addEventListener("click", openDrawer);

  var mask = document.getElementById("drawer-mask");
  if (mask) mask.addEventListener("click", closeDrawer);
})();
