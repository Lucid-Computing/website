// marketplace.js — Marketplace rendering + filtering
document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  var D = window.MARKETPLACE_DATA;
  if (!D) return;

  var frameworkMap = {};
  D.frameworks.forEach(function (f) { frameworkMap[f.id] = f; });
  var auditorMap = {};
  D.auditors.forEach(function (a) { auditorMap[a.id] = a; });

  var colorVar = { red: "#ef4444", blue: "#3b82f6", purple: "#a855f7", cyan: "#06b6d4", amber: "#f59e0b" };
  var selected = {}; // framework id → true

  // DOM
  var chipRow = document.getElementById("framework-row");
  var summary = document.getElementById("filter-summary");
  var grid = document.getElementById("auditor-grid");
  var backdrop = document.getElementById("mp-modal-backdrop");
  var modal = document.getElementById("mp-modal");
  if (!chipRow || !grid || !modal) return;

  // ── Build framework chips (once) ─────────────────────────────
  var chipEls = {}; // fwId → button element
  D.frameworks.forEach(function (fw) {
    var btn = document.createElement("button");
    btn.className = "framework-chip";
    btn.textContent = fw.shortName;
    btn.title = fw.name;
    btn.addEventListener("click", function () {
      if (selected[fw.id]) { delete selected[fw.id]; }
      else { selected[fw.id] = true; }
      applyFilter();
    });
    chipRow.appendChild(btn);
    chipEls[fw.id] = btn;
  });

  // ── Build auditor cards (once) ───────────────────────────────
  var cardEls = []; // { id, el, pillsEl }
  D.auditors.forEach(function (a) {
    var card = document.createElement("div");
    card.className = "mp-card";
    card.setAttribute("data-aid", a.id);
    card.innerHTML =
      '<div class="mp-card-header">' +
        '<i class="ph ph-' + a.icon + '" style="color:' + (colorVar[a.color] || "#fff") + ';font-size:1.5rem"></i>' +
        '<span class="mp-card-name">' + a.name + '</span>' +
      '</div>' +
      '<p class="mp-card-desc">' + a.description + '</p>' +
      '<div class="mp-card-pills"></div>' +
      '<button class="mp-card-learn-more">Learn More</button>';

    card.querySelector(".mp-card-learn-more").addEventListener("click", function (e) {
      e.stopPropagation();
      openModal(a.id);
    });

    grid.appendChild(card);
    cardEls.push({ id: a.id, el: card, pillsEl: card.querySelector(".mp-card-pills") });
  });

  // ── Apply filter (toggles classes, no DOM rebuild) ───────────
  function applyFilter() {
    var keys = Object.keys(selected);
    var n = keys.length;

    // Update chip active states
    D.frameworks.forEach(function (fw) {
      chipEls[fw.id].classList.toggle("active", !!selected[fw.id]);
    });

    // Build matching auditor set
    var matching = {};
    keys.forEach(function (fwId) {
      var fw = frameworkMap[fwId];
      if (fw) fw.auditorIds.forEach(function (id) { matching[id] = true; });
    });

    // Update card states + pills
    cardEls.forEach(function (c) {
      var el = c.el;
      if (n === 0) {
        el.classList.remove("dimmed", "highlighted");
        c.pillsEl.innerHTML = "";
        return;
      }
      var match = !!matching[c.id];
      el.classList.toggle("dimmed", !match);
      el.classList.toggle("highlighted", match);

      // Show matching framework pills
      if (match) {
        var pills = "";
        keys.forEach(function (fwId) {
          var fw = frameworkMap[fwId];
          if (fw && fw.auditorIds.indexOf(c.id) !== -1) {
            pills += '<span class="mp-pill">' + fw.shortName + '</span>';
          }
        });
        c.pillsEl.innerHTML = pills;
      } else {
        c.pillsEl.innerHTML = "";
      }
    });

    // Update summary bar
    if (n === 0) {
      summary.style.display = "none";
    } else {
      summary.style.display = "flex";
      summary.innerHTML = '<span>' + n + ' framework' + (n > 1 ? 's' : '') + ' selected</span>';
      var clearBtn = document.createElement("button");
      clearBtn.className = "clear-btn";
      clearBtn.textContent = "Clear all";
      clearBtn.addEventListener("click", function () {
        selected = {};
        applyFilter();
      });
      summary.appendChild(clearBtn);
    }
  }

  // ── Modal ────────────────────────────────────────────────────
  function openModal(auditorId) {
    var a = auditorMap[auditorId];
    if (!a) return;

    var body = modal.querySelector(".mp-modal-body");
    modal.querySelector(".mp-modal-title").innerHTML =
      '<i class="ph ph-' + a.icon + '" style="color:' + (colorVar[a.color] || '#fff') + '"></i> ' + a.name;

    var html = '';
    var details = D.complianceDetails[auditorId];
    var subtitle = details ? details.controlArea : a.category;
    html += '<p class="mp-modal-subtitle">' + subtitle + '</p>';
    html += '<p class="mp-modal-desc">' + a.description + '</p>';

    // Compliance detail cards (flat, matching screenshot)
    if (details && details.details.length) {
      details.details.forEach(function (d) {
        var fw = frameworkMap[d.framework];
        var region = fw ? fw.region : "";
        html +=
          '<div class="mp-detail-card">' +
            '<div class="mp-detail-header">' +
              '<span class="mp-detail-fw">' + d.frameworkName + '</span>' +
              '<span class="mp-detail-clause">' + d.clause + '</span>' +
              (region ? '<span class="mp-detail-region">' + region + '</span>' : '') +
            '</div>' +
            '<div class="mp-detail-section">' +
              '<div class="mp-detail-label"><i class="ph ph-book-open"></i> ORIGINAL REGULATION TEXT</div>' +
              '<blockquote class="mp-detail-quote">' + d.originalText + '</blockquote>' +
            '</div>' +
            '<div class="mp-detail-section">' +
              '<div class="mp-detail-label mp-detail-label--green"><i class="ph ph-check-circle"></i> HOW THIS AUDITOR HELPS</div>' +
              '<p class="mp-detail-comply">' + d.howWeComply + '</p>' +
            '</div>' +
          '</div>';
      });
    } else {
      // Fallback: show requiring frameworks
      var reqFws = D.frameworks.filter(function (fw) {
        return fw.auditorIds.indexOf(auditorId) !== -1;
      });
      if (reqFws.length) {
        html += '<p class="mp-modal-section-label">Required by ' + reqFws.length + ' compliance frameworks</p>';
        html += '<div class="mp-modal-fw-grid">';
        reqFws.forEach(function (fw) {
          html +=
            '<div class="mp-modal-fw-item">' +
              '<strong>' + fw.shortName + '</strong>' +
              '<span class="mp-modal-fw-desc">' + fw.name + '</span>' +
              '<span class="mp-modal-fw-region">' + fw.region + '</span>' +
            '</div>';
        });
        html += '</div>';
      }
    }

    body.innerHTML = html;
    backdrop.classList.add("visible");
    modal.classList.add("visible");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    backdrop.classList.remove("visible");
    modal.classList.remove("visible");
    document.body.style.overflow = "";
  }

  backdrop.addEventListener("click", closeModal);
  modal.querySelector(".mp-modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
});
