(function () {
  "use strict";

  const IMG_W = 1376;
  const IMG_H = 768;

  const DOOR_POSITIONS = {
    1: [118, 605, 74, 116],
    2: [380, 592, 66, 104],
    3: [442, 583, 44, 50],
    4: [878, 596, 76, 116],
    5: [862, 520, 42, 46],
    6: [1262, 500, 92, 128],
    7: [834, 352, 60, 86],
    8: [968, 413, 56, 84],
    9: [1092, 433, 48, 50],
    10: [443, 437, 60, 88],
    11: [234, 330, 50, 72],
    12: [561, 400, 56, 80],
    13: [1062, 492, 48, 46],
    14: [1122, 498, 52, 78],
    15: [371, 275, 54, 74],
    16: [956, 515, 44, 46],
    17: [608, 283, 50, 64],
    18: [988, 225, 56, 76],
    19: [1167, 258, 52, 56],
    20: [526, 266, 42, 46],
    21: [496, 177, 52, 58],
    22: [846, 178, 52, 56],
    23: [558, 182, 48, 58],
    24: [705, 282, 48, 52],
    25: [700, 118, 168, 250]
  };

  const ASSETS = {
    10: { type: "html", src: "assets/Snowbound%20Crossword.html" },
    19: { type: "html", src: "assets/19-echosescape.html" }
  };

  const hotspotsContainer = document.getElementById("hotspots");
  const snowLayer = document.getElementById("snowLayer");
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");
  const toast = document.getElementById("toast");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let currentVideo = null;
  let lastFocused = null;
  let toastTimer = null;

  function resolveToday() {
    const params = new URLSearchParams(window.location.search);
    const dayParam = parseInt(params.get("day"), 10);
    if (!isNaN(dayParam)) {
      return Math.min(Math.max(dayParam, 1), 31);
    }
    const dateParam = params.get("date");
    if (dateParam) {
      const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateParam);
      if (iso) {
        return parseInt(iso[3], 10);
      }
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        return parsed.getDate();
      }
    }
    return new Date().getDate();
  }

  const TODAY = resolveToday();
  const UNLOCK_ALL = true;

  function isUnlocked(num) {
    return UNLOCK_ALL || num <= TODAY;
  }

  function pct(value, total) {
    return (value / total) * 100 + "%";
  }

  function doorLabel(num) {
    if (num === 25) {
      return isUnlocked(num)
        ? "Door 25, the Christmas tree, open"
        : "Door 25, the Christmas tree, opens on December 25";
    }
    return isUnlocked(num)
      ? "Door " + num + ", open"
      : "Door " + num + ", opens on December " + num;
  }

  function buildHotspots() {
    const highlightDay = Math.min(Math.max(TODAY, 1), 25);

    Object.keys(DOOR_POSITIONS).forEach(function (key) {
      const num = parseInt(key, 10);
      const pos = DOOR_POSITIONS[key];
      const unlocked = isUnlocked(num);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotspot" + (unlocked ? "" : " locked");
      if (num === highlightDay) {
        btn.classList.add("today");
      }
      btn.setAttribute("data-num", String(num));
      btn.setAttribute("aria-label", doorLabel(num));
      if (!unlocked) {
        btn.setAttribute("aria-disabled", "true");
      }

      btn.style.left = pct(pos[0], IMG_W);
      btn.style.top = pct(pos[1], IMG_H);
      btn.style.width = pct(pos[2], IMG_W);
      btn.style.height = pct(pos[3], IMG_H);

      btn.addEventListener("click", function () {
        handleDoor(num);
      });

      hotspotsContainer.appendChild(btn);
    });
  }

  function handleDoor(num) {
    if (!isUnlocked(num)) {
      showToast(
        num === 25
          ? "The tree opens on December 25."
          : "Door " + num + " opens on December " + num + "."
      );
      return;
    }
    openDoor(num);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2800);
  }

  function renderAsset(num) {
    modalBody.innerHTML = "";
    const explicit = ASSETS[num];
    const asset = explicit || { type: "video", src: "assets/" + num + ".mp4" };

    if (asset.type === "video") {
      const video = document.createElement("video");
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = asset.src;
      video.addEventListener("error", function () {
        modalBody.innerHTML = "";
        modalBody.appendChild(
          buildPlaceholder(num, explicit ? "This video could not be loaded." : null)
        );
      });
      modalBody.appendChild(video);
      currentVideo = video;
      return video;
    }

    if (asset.type === "image") {
      const img = document.createElement("img");
      img.alt = "Advent surprise for December " + num;
      img.src = asset.src;
      img.addEventListener("error", function () {
        modalBody.innerHTML = "";
        modalBody.appendChild(buildPlaceholder(num, "This image could not be loaded."));
      });
      modalBody.appendChild(img);
      return img;
    }

    if (asset.type === "html") {
      const iframe = document.createElement("iframe");
      iframe.src = asset.src;
      iframe.title = "Advent game for December " + num;
      iframe.setAttribute("allow", "autoplay");
      modalBody.appendChild(iframe);
      return iframe;
    }

    modalBody.appendChild(buildPlaceholder(num));
    return null;
  }

  function buildPlaceholder(num, note) {
    const wrap = document.createElement("div");
    wrap.className = "placeholder";
    const giftNum = document.createElement("div");
    giftNum.className = "gift-num";
    giftNum.textContent = num;
    const heading = document.createElement("h2");
    heading.textContent = "December " + num;
    const para = document.createElement("p");
    para.textContent = note || "This door's surprise is still being wrapped. Check back soon!";
    wrap.appendChild(giftNum);
    wrap.appendChild(heading);
    wrap.appendChild(para);
    return wrap;
  }

  function openDoor(num) {
    lastFocused = document.activeElement;
    const focusEl = renderAsset(num);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (focusEl && (focusEl.tagName === "IFRAME" || focusEl.tagName === "VIDEO")) {
      focusEl.focus();
    } else {
      modalClose.focus();
    }
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (currentVideo) {
      currentVideo.pause();
      currentVideo.removeAttribute("src");
      currentVideo.load();
      currentVideo = null;
    }
    modalBody.innerHTML = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function trapFocus(e) {
    if (e.key !== "Tab" || !modal.classList.contains("open")) {
      return;
    }
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, video[controls], iframe, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function buildSnow() {
    for (let i = 0; i < 55; i++) {
      const flake = document.createElement("span");
      flake.className = "flake";
      const size = (Math.random() * 4 + 2).toFixed(1);
      flake.style.left = (Math.random() * 100).toFixed(2) + "%";
      flake.style.width = size + "px";
      flake.style.height = size + "px";
      flake.style.opacity = (Math.random() * 0.5 + 0.35).toFixed(2);
      flake.style.animationDuration = (Math.random() * 6 + 7).toFixed(1) + "s";
      flake.style.animationDelay = (Math.random() * 8).toFixed(1) + "s";
      flake.style.setProperty("--drift", (Math.random() * 80 - 40).toFixed(0) + "px");
      snowLayer.appendChild(flake);
    }
  }

  function startSnow() {
    if (reduceMotion) {
      return;
    }
    setTimeout(function () {
      snowLayer.classList.add("active");
    }, 1200);
  }

  function init() {
    buildHotspots();
    buildSnow();
    startSnow();

    if (new URLSearchParams(window.location.search).get("debug")) {
      hotspotsContainer.classList.add("debug");
    }

    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) {
        closeModal();
        return;
      }
      trapFocus(e);
    });
    window.addEventListener("message", function (e) {
      if (e.data && e.data.type === "advent-close" && modal.classList.contains("open")) {
        closeModal();
      }
    });

    setTimeout(function () {
      if (!modal.classList.contains("open")) {
        showToast("Click a numbered door to open it.");
      }
    }, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
