/* Soulified forms: validation, rights check, and submission.
   Submissions are emailed via FormSubmit (https://formsubmit.co), so no server is needed.
   To change where submissions go, edit FORM_EMAIL below. */
const FORM_EMAIL = "gino@besoulified.com";

(function () {
  const form = document.querySelector("form.sf");
  if (!form) return;

  // Prefill the service from ?service= on the start page
  const params = new URLSearchParams(location.search);
  const svc = params.get("service");
  const SERVICE_MAP = {
    single: ["Electric guitar"],
    vocal: ["Lead vocal"],
    full: ["Full band"],
    signature: [],
    yourvoice: ["My own vocal (I'll record it)"],
  };
  if (svc && SERVICE_MAP[svc]) {
    form.querySelectorAll('input[name="Make human"]').forEach((cb) => {
      if (SERVICE_MAP[svc].includes(cb.value)) cb.checked = true;
    });
    const pkg = form.querySelector('[name="Package"]');
    if (svc === "signature") {
      const d = form.querySelector('[name="Requested artist"]');
      if (d) { d.placeholder = "Who would you love on your record?"; setTimeout(() => d.scrollIntoView({ block: "center" }), 300); }
    }
    if (pkg) {
      const labels = { single: "Session part", vocal: "Lead vocal", full: "Full band", signature: "Signature artist", yourvoice: "Your Voice" };
      pkg.value = labels[svc];
    }
  }

  // Rights check (start page only)
  const rightsBox = document.getElementById("rights-box");
  function rightsCheck() {
    if (!rightsBox) return;
    const plan = form.querySelector('[name="Plan when created"]').value;
    const use = form.querySelector('[name="Intended use"]').value;
    const platform = form.querySelector('[name="AI platform"]').value;
    let cls = "", html = "";
    if (!plan || !use || !platform) {
      rightsBox.className = "rights-box";
      return;
    }
    if (use === "Personal use only") {
      cls = "ok";
      html = "<b>No problem.</b>For personal listening, plan type matters less. We'll still note it in your project.";
    } else if (plan === "Free plan / free trial") {
      cls = "bad";
      html = "<b>Heads up before you go further.</b>Many AI platforms only allow commercial use of songs made and downloaded on a paid plan, and upgrading later usually doesn't change that. You may not be able to release this song, even after we re-record it. Send it anyway and we'll talk through your options, or check your platform's terms first.";
    } else if (plan === "Not sure") {
      cls = "warn";
      html = "<b>Worth checking.</b>Your release rights usually depend on the plan you were on when you made and downloaded the song. We'll help you check before any work starts.";
    } else {
      cls = "ok";
      html = "<b>Looks good so far.</b>Paid-plan songs generally come with commercial use rights. We'll confirm the details against your platform's current terms during the free review.";
    }
    rightsBox.className = "rights-box show " + cls;
    rightsBox.innerHTML = html;
  }
  form.querySelectorAll('[name="Plan when created"],[name="Intended use"],[name="AI platform"]').forEach((el) =>
    el.addEventListener("change", rightsCheck)
  );
  rightsCheck();

  // Show/hide sections and swap labels based on another field: data-show-if="Field=Value" (or !=), data-swap="Field=Value|Text"
  const cond = (spec) => {
    const neg = spec.includes("!=");
    const [f, v] = spec.split(neg ? "!=" : "=");
    const src = form.querySelector('[name="' + f + '"]');
    const hit = !!src && src.value === v;
    return neg ? !hit : hit;
  };
  const swaps = form.querySelectorAll("[data-swap]");
  swaps.forEach((el) => { el.dataset.default = el.textContent; });
  function applyConditions() {
    form.querySelectorAll("[data-show-if]").forEach((el) => {
      const on = cond(el.dataset.showIf);
      el.hidden = !on;
      el.querySelectorAll("input,select,textarea").forEach((i) => { i.disabled = !on; });
    });
    swaps.forEach((el) => {
      const [spec, text] = el.dataset.swap.split("|");
      el.textContent = cond(spec) ? text : el.dataset.default;
    });
  }
  form.addEventListener("change", applyConditions);
  applyConditions();

  // Submit
  const msg = form.querySelector(".form-msg");
  const btn = form.querySelector('button[type="submit"]');
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    msg.textContent = "";

    // Require at least one box in any group marked data-required-group
    for (const group of form.querySelectorAll("[data-required-group]")) {
      if (!group.querySelector("input:checked")) {
        msg.className = "form-msg err";
        msg.textContent = "Please pick at least one option in: " + group.dataset.requiredGroup + ".";
        group.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    if (!form.reportValidity()) return;
    if (form.querySelector('[name="_honey"]').value) return; // bot

    // Build payload; join multi-select checkboxes into one line
    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) {
      if (k === "_honey") continue;
      data[k] = data[k] ? data[k] + ", " + v : v;
    }
    form.querySelectorAll("input[data-optin]").forEach((c) => { if (!c.checked) data[c.name] = "No"; });
    data._subject = form.dataset.subject + (data["Song title"] ? ": " + data["Song title"] : data["Band name"] ? ": " + data["Band name"] + " (band)" : data["Name"] ? ": " + data["Name"] : "");
    data._template = "table";
    if (data["Email"]) data._replyto = data["Email"];

    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const res = await fetch("https://formsubmit.co/ajax/" + FORM_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || String(out.success) === "false") throw new Error(out.message || "Send failed");
      location.href = "thanks.html?t=" + form.dataset.kind;
    } catch (err) {
      msg.className = "form-msg err";
      msg.textContent = "Something went wrong sending your form. Please try again, or email us directly.";
      btn.disabled = false;
      btn.textContent = form.dataset.button;
    }
  });
})();
