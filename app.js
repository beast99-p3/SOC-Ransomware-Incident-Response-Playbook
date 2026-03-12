const templates = {
  internal: {
    channel: "Channel: SOC chat + incident platform",
    body: `Subject: [SEV-{1|2}] Suspected Ransomware - {Business Unit/System}

Time detected: {UTC/local}
Detection source: {SIEM/EDR/use case}
Affected assets (known): {hostnames/users/IPs}
Key indicators: {extensions/ransom note/process/hash/C2}
Immediate actions taken: {isolation/account disable/block}
Current impact: {service/customer/regulatory known or unknown}
Requested support: Tier 2 investigation and containment lead
Ticket/bridge: {link}`,
  },
  itops: {
    channel: "Channel: bridge + ticket assignment",
    body: `Priority: P1 Security Incident - Ransomware Containment Request

Please execute within {X} minutes:
1) Isolate endpoints: {list}
2) Block IOCs: {domains/IPs/hashes}
3) Disable/reset accounts: {list}
4) Confirm completion in ticket: {ticket#}

Business impact if delayed: potential lateral spread/encryption expansion.
SOC POC: {name/contact}`,
  },
  executive: {
    channel: "Channel: email + leadership bridge",
    body: `Subject: [SEV-1] Ransomware Incident Update #{N} - {Org/Environment}

Status: {Investigating | Contained | Recovering}
What happened: {1-2 sentence plain-language summary}
Current impact: {systems, users, service status}
Risk assessment: {data exposure likelihood, business risk}
Actions completed: {top 3}
Next actions (next 2-4 hours): {top 3}
Decisions needed: {if any}
Next update ETA: {time}`,
  },
  legal: {
    channel: "Channel: secure legal channel",
    body: `Potential breach notification trigger identified.
Incident: {ticket/link}
Data at risk: {PII/PHI/PCI/unknown}
Evidence summary: {what indicates possible exfiltration}
Request: legal hold + regulatory notification guidance.`,
  },
  handoff: {
    channel: "Channel: incident ticket + SOC handoff channel",
    body: `Incident: {ticket#} | Severity: {SEV}
Current phase: {Detection/Containment/Recovery/Post-incident}
What changed this shift: {highlights}
Open hypotheses: {list}
Pending actions: {owner + ETA}
Risks/blockers: {list}
Next checkpoint: {time}`,
  },
};

const tabButtons = [...document.querySelectorAll(".tab-btn")];
const channelEl = document.querySelector("#template-channel");
const bodyEl = document.querySelector("#template-body");
const copyBtn = document.querySelector("#copy-template");
const printSnapshotBtn = document.querySelector("#print-snapshot");
const resetLocalDataBtn = document.querySelector("#reset-local-data");
const sectionLinks = [...document.querySelectorAll(".section-link")];

const CHECKLIST_STORAGE_KEY = "socPlaybook.firstHourChecklist";
const TIMELINE_STORAGE_KEY = "socPlaybook.timelineRows";

function setTemplate(key) {
  const selected = templates[key];
  if (!selected) return;

  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.template === key);
  });

  channelEl.textContent = selected.channel;
  bodyEl.textContent = selected.body;
  copyBtn.dataset.template = key;
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setTemplate(btn.dataset.template));
});

copyBtn.addEventListener("click", async () => {
  const key = copyBtn.dataset.template || "internal";
  const toCopy = templates[key]?.body ?? "";

  try {
    await navigator.clipboard.writeText(toCopy);
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = original;
    }, 1200);
  } catch (err) {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy Template";
    }, 1200);
  }
});

setTemplate("internal");

// Lightbox for phase diagrams.
const modal = document.createElement("div");
modal.className = "image-modal";
modal.innerHTML = '<img alt="Expanded phase diagram" />';
document.body.appendChild(modal);

const modalImg = modal.querySelector("img");
document.querySelectorAll(".phase-card img").forEach((img) => {
  img.addEventListener("click", () => {
    modalImg.src = img.src;
    modal.classList.add("open");
  });
});

modal.addEventListener("click", () => {
  modal.classList.remove("open");
  modalImg.src = "";
});

// First-hour checklist progress tracker.
const checklist = [...document.querySelectorAll("#first-hour-checklist input[type='checkbox']")];
const checklistProgressEl = document.querySelector("#checklist-progress");

function updateChecklistProgress() {
  if (!checklistProgressEl) return;
  const completed = checklist.filter((item) => item.checked).length;
  checklistProgressEl.textContent = `${completed}/${checklist.length} completed`;
}

function loadChecklistState() {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return;
    const values = JSON.parse(raw);
    if (!Array.isArray(values)) return;

    checklist.forEach((item, index) => {
      item.checked = Boolean(values[index]);
    });
  } catch (err) {
    // Ignore malformed storage values.
  }
}

function saveChecklistState() {
  const values = checklist.map((item) => item.checked);
  localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(values));
}

checklist.forEach((item) => {
  item.addEventListener("change", () => {
    updateChecklistProgress();
    saveChecklistState();
  });
});

loadChecklistState();
updateChecklistProgress();

// Query copy actions.
const queryCopyButtons = [...document.querySelectorAll(".copy-query")];
queryCopyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const targetId = button.dataset.copyTarget;
    const target = document.querySelector(`#${targetId}`);
    if (!target) return;

    const text = target.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      const original = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = original;
      }, 1200);
    } catch (err) {
      button.textContent = "Copy failed";
      setTimeout(() => {
        button.textContent = "Copy Query";
      }, 1200);
    }
  });
});

// Timeline event capture and CSV export.
const timelineTime = document.querySelector("#timeline-time");
const timelineOwner = document.querySelector("#timeline-owner");
const timelineEvent = document.querySelector("#timeline-event");
const timelineAddBtn = document.querySelector("#timeline-add");
const timelineExportBtn = document.querySelector("#timeline-export");
const timelineBody = document.querySelector("#timeline-table tbody");

function getTimelineRowsFromDom() {
  if (!timelineBody) return [];
  return [...timelineBody.querySelectorAll("tr")].map((row) => {
    const [timeCell, ownerCell, eventCell] = [...row.querySelectorAll("td")];
    return {
      time: timeCell?.textContent?.trim() || "",
      owner: ownerCell?.textContent?.trim() || "",
      event: eventCell?.textContent?.trim() || "",
    };
  });
}

function renderTimelineRows(rows) {
  if (!timelineBody) return;
  timelineBody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.time}</td><td>${row.owner}</td><td>${row.event}</td>`;
    timelineBody.appendChild(tr);
  });
}

function saveTimelineRows() {
  const rows = getTimelineRowsFromDom();
  localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(rows));
}

function loadTimelineRows() {
  if (!timelineBody) return;
  try {
    const raw = localStorage.getItem(TIMELINE_STORAGE_KEY);
    if (!raw) {
      saveTimelineRows();
      return;
    }

    const rows = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length === 0) return;

    const validRows = rows.filter((row) => row && row.time && row.owner && row.event);
    if (validRows.length > 0) {
      renderTimelineRows(validRows);
    }
  } catch (err) {
    // Ignore malformed storage values.
  }
}

const defaultTimelineRows = getTimelineRowsFromDom();
loadTimelineRows();

if (timelineAddBtn && timelineBody) {
  timelineAddBtn.addEventListener("click", () => {
    const timeValue = (timelineTime?.value || "").trim();
    const ownerValue = (timelineOwner?.value || "").trim();
    const eventValue = (timelineEvent?.value || "").trim();

    if (!timeValue || !ownerValue || !eventValue) {
      timelineAddBtn.textContent = "Fill all fields";
      setTimeout(() => {
        timelineAddBtn.textContent = "Add Event";
      }, 1000);
      return;
    }

    const row = document.createElement("tr");
    const normalizedTime = timeValue.replace("T", " ");
    row.innerHTML = `<td>${normalizedTime}</td><td>${ownerValue}</td><td>${eventValue}</td>`;
    timelineBody.appendChild(row);
    saveTimelineRows();

    if (timelineTime) timelineTime.value = "";
    if (timelineOwner) timelineOwner.value = "";
    if (timelineEvent) timelineEvent.value = "";
  });
}

if (timelineExportBtn && timelineBody) {
  timelineExportBtn.addEventListener("click", () => {
    const rows = [...timelineBody.querySelectorAll("tr")];
    const csvLines = ["Time (UTC),Owner,Event"];

    rows.forEach((row) => {
      const cols = [...row.querySelectorAll("td")].map((cell) => {
        const escaped = (cell.textContent || "").replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvLines.push(cols.join(","));
    });

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "incident-timeline.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

// Sticky section nav active highlighting.
if (sectionLinks.length > 0) {
  const linkSectionPairs = sectionLinks
    .map((link) => {
      const id = (link.getAttribute("href") || "").replace("#", "");
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  function updateActiveSectionLink() {
    if (linkSectionPairs.length === 0) return;
    const offset = 170; // account for top bar + sticky nav
    const marker = window.scrollY + offset;

    let active = linkSectionPairs[0];
    linkSectionPairs.forEach((pair) => {
      if (pair.section.offsetTop <= marker) {
        active = pair;
      }
    });

    sectionLinks.forEach((link) => link.classList.remove("active"));
    active.link.classList.add("active");
  }

  window.addEventListener("scroll", updateActiveSectionLink, { passive: true });
  window.addEventListener("resize", updateActiveSectionLink);
  updateActiveSectionLink();
}

// Print/export snapshot button.
if (printSnapshotBtn) {
  printSnapshotBtn.addEventListener("click", () => {
    window.print();
  });
}

// Reset persisted data (checklist + timeline).
if (resetLocalDataBtn) {
  resetLocalDataBtn.addEventListener("click", () => {
    const approved = window.confirm(
      "Reset all saved checklist and timeline data to defaults?"
    );
    if (!approved) return;

    localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    localStorage.removeItem(TIMELINE_STORAGE_KEY);

    checklist.forEach((item) => {
      item.checked = false;
    });
    updateChecklistProgress();

    if (timelineTime) timelineTime.value = "";
    if (timelineOwner) timelineOwner.value = "";
    if (timelineEvent) timelineEvent.value = "";

    if (defaultTimelineRows.length > 0) {
      renderTimelineRows(defaultTimelineRows);
      saveTimelineRows();
    }

    const original = resetLocalDataBtn.textContent;
    resetLocalDataBtn.textContent = "Reset Complete";
    setTimeout(() => {
      resetLocalDataBtn.textContent = original;
    }, 1200);
  });
}

// Floating back-to-top button behavior.
const toTopBtn = document.querySelector("#to-top-btn");

function toggleToTopButton() {
  if (!toTopBtn) return;
  const shouldShow = window.scrollY > 280;
  toTopBtn.classList.toggle("visible", shouldShow);
}

if (toTopBtn) {
  window.addEventListener("scroll", toggleToTopButton, { passive: true });
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  toggleToTopButton();
}
