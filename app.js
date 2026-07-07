const API_URL =
"https://script.google.com/macros/s/AKfycby09EEwCpP_5YE8qcwfI_ytbSPmoOkpWSQ6eNO58NMGlbPPNaWLSz1BQhDmHaBZhoCxsw/exec";

const LINE_OA_ID = "@yan_he";
const LINE_REDIRECT_DELAY_MS = 800;

let priceListData = [];
let plansData = [];
let selectedPlan = null;

document.addEventListener("DOMContentLoaded", () => {
  showLoading();
  loadData();
});

function showLoading() {
  const container = document.getElementById("planDetailContainer");

  if (!container) return;

  container.innerHTML = `
    <div class="plan-detail-placeholder">
      <div class="placeholder-icon">⏳</div>
      <h3>驗屋方案載入中...</h3>
      <p>正在讀取價格級距、驗屋內容與檢驗項目，請稍候片刻。</p>
    </div>
  `;
}

async function loadData() {
  try {
    const response = await fetch(`${API_URL}?action=init`);
    const result = await response.json();

    if (!result.ok) {
      alert("讀取系統設定失敗");
      return;
    }

    priceListData = result.priceList || [];
    plansData = result.plans || [];

    renderPlans(priceListData);

  } catch (error) {
    console.error(error);
    alert("API連線失敗，請確認 Apps Script 是否已重新部署");
  }
}

function startBooking() {
  document.querySelector(".plans").scrollIntoView({ behavior: "smooth" });
}

function normalizePriceText(text) {
  if (!text) return "";

  let result = String(text)
    .replace(/起起/g, "起")
    .replace(/元起起/g, "元起");

  if (!result.includes("起")) {
    result += "元起";
  }

  return result;
}

function getPlanSubText(planName) {
  if (planName.includes("小資")) return "22項檢驗項目";
  if (planName.includes("全方位")) return "35項檢驗項目｜主力方案";
  if (planName.includes("中古")) return "9項基本檢驗";
  if (planName.includes("社區")) return "需三戶以上｜採用全方位版檢驗內容";

  return "驗屋服務";
}

function renderPlans(priceList) {
  const planCards = document.getElementById("planCards");

  if (!planCards) return;

  const groupedPlans = {};

  priceList.forEach(item => {
    const enabled =
      item["啟用"] === true ||
      item["啟用"] === "TRUE";

    if (!enabled) return;

    const planName = item["方案"];

    if (!groupedPlans[planName]) {
      groupedPlans[planName] = [];
    }

    groupedPlans[planName].push(item);
  });

  planCards.innerHTML = "";

  Object.keys(groupedPlans).forEach(planName => {
    const rows = groupedPlans[planName];
    const firstRow = rows[0];

    const prices = rows
      .map(row => Number(row["價格"]))
      .filter(price => !isNaN(price) && price > 0);

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    const displayPrice =
      minPrice > 0
        ? `$${minPrice.toLocaleString()}元起`
        : normalizePriceText(firstRow["價格文字"]);

    const isMain = planName.includes("全方位");

    planCards.innerHTML += `
      <div
        class="plan-card ${isMain ? "selected" : ""}"
        data-plan="${planName}"
        onclick="selectPlan('${planName}')"
      >
        <div>
          <strong>${planName}</strong>
          <span>${getPlanSubText(planName)}</span>
        </div>

        <div class="price">
          ${displayPrice}
        </div>
      </div>
    `;

    if (isMain && !selectedPlan) {
      selectedPlan = {
        name: planName,
        price: displayPrice,
        houseType: firstRow["驗屋類型"] || ""
      };

      renderPlanDetail(planName);
    }
  });

  if (selectedPlan) {
    updateSelectedBox(false);
  }
}

function selectPlan(planName) {
  const planRows = priceListData.filter(
    item => item["方案"] === planName
  );

  const firstRow = planRows[0];

  const prices = planRows
    .map(row => Number(row["價格"]))
    .filter(price => !isNaN(price) && price > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const displayPrice =
    minPrice > 0
      ? `$${minPrice.toLocaleString()}元起`
      : normalizePriceText(firstRow ? firstRow["價格文字"] : "");

  selectedPlan = {
    name: planName,
    price: displayPrice,
    houseType: firstRow ? firstRow["驗屋類型"] || "" : ""
  };

  document.querySelectorAll(".plan-card").forEach(card => {
    card.classList.toggle(
      "selected",
      card.dataset.plan === planName
    );
  });

  renderPlanDetail(planName);
  updateSelectedBox(true);
}

function renderPlanDetail(planName) {
  const container = document.getElementById("planDetailContainer");

  if (!container) return;

  const prices = priceListData.filter(
    row =>
      row["方案"] === planName &&
      (
        row["啟用"] === true ||
        row["啟用"] === "TRUE"
      )
  );

  let itemPlanName = planName;

  if (planName === "社區團購方案") {
    itemPlanName = "全方位版";
  }

  const items = plansData.filter(
    row =>
      row["方案"] === itemPlanName &&
      (
        row["啟用"] === true ||
        row["啟用"] === "TRUE"
      )
  );

  let priceHtml = "";

  prices.forEach(row => {
    priceHtml += `
      <div class="price-row">
        <span>${row["坪數區間"] || ""}</span>
        <strong>${normalizePriceText(row["價格文字"])}</strong>
      </div>
    `;
  });

  let itemHtml = "";

  items.forEach(row => {
    itemHtml += `
      <div class="plan-item">
        ${row["項次"]}. ${row["檢驗內容"]}
      </div>
    `;
  });

  const itemNote =
    planName === "社區團購方案"
      ? "需三戶以上｜採用全方位版 35 項檢驗內容"
      : `共 ${items.length} 項檢驗內容`;

  container.innerHTML = `
    <div class="plan-detail-box">
      <h3>${planName}</h3>

      <div class="detail-title">💰 價格級距</div>
      ${priceHtml}

      <div class="detail-title">📋 驗屋內容</div>
      ${itemHtml}

      <div class="plan-count">
        ${itemNote}
      </div>
    </div>
  `;
}

function updateSelectedBox(shouldScroll = false) {
  const box = document.getElementById("selectedPlanBox");
  const name = document.getElementById("selectedPlanName");

  if (!box || !name || !selectedPlan) return;

  box.classList.remove("hidden");
  name.innerText = `${selectedPlan.name}｜${selectedPlan.price}`;

  if (shouldScroll) {
    box.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function openBookingForm() {
  const form = document.getElementById("bookingForm");

  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth" });
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function validateBookingForm() {
  const requiredFields = [
    "name",
    "phone",
    "projectName",
    "unitFloor",
    "area",
    "contractArea",
    "bookingDate",
    "bookingTime"
  ];

  for (const id of requiredFields) {
    if (!getValue(id)) {
      return false;
    }
  }

  return true;
}

function safeLineValue(value, fallback = "未填寫") {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  return String(value).trim();
}

function buildLineConfirmMessage(bookingId, bookingData) {
  return `
您好，我已完成硯赫科技驗屋預約，請客服協助確認。(幫我送出以下文字)

預約編號：${safeLineValue(bookingId, "系統已建立")}
預約姓名：${safeLineValue(bookingData.name)}
聯絡電話：${safeLineValue(bookingData.phone)}
建案名稱：${safeLineValue(bookingData.projectName)}
驗屋地址：${safeLineValue(bookingData.address)}
戶別／樓層：${safeLineValue(bookingData.unitFloor)}
權狀坪數：${safeLineValue(bookingData.area)}
主建物＋附屬建物坪數：${safeLineValue(bookingData.contractArea)}
預約日期：${safeLineValue(bookingData.bookingDate)}
預約時段：${safeLineValue(bookingData.bookingTime)}
預約方案：${safeLineValue(bookingData.planName)}
方案價格：${safeLineValue(bookingData.price)}

請協助確認預約，謝謝。
  `.trim();
}

function buildLineOaMessageUrl(bookingId, bookingData) {
  const message = buildLineConfirmMessage(bookingId, bookingData);

  return `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(message)}`;
}

function ensureLineConfirmButton(lineUrl) {
  const successPage = document.getElementById("successPage");

  if (!successPage) return;

  let hint = document.getElementById("lineConfirmHint");

  if (!hint) {
    hint = document.createElement("p");
    hint.id = "lineConfirmHint";
    hint.innerText = "下一步請送出 LINE 確認訊息，讓客服可以主動與您聯繫。";
    hint.style.marginTop = "16px";
    hint.style.fontWeight = "700";
    successPage.appendChild(hint);
  }

  let btn = document.getElementById("lineConfirmBtn");

  if (!btn) {
    btn = document.createElement("a");
    btn.id = "lineConfirmBtn";
    btn.className = "primary-btn line-confirm-btn";
    btn.innerText = "前往 LINE 完成預約確認";
    btn.target = "_blank";
    btn.rel = "noopener";

    btn.style.display = "inline-flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.marginTop = "12px";
    btn.style.padding = "14px 18px";
    btn.style.borderRadius = "999px";
    btn.style.textDecoration = "none";
    btn.style.fontWeight = "800";

    successPage.appendChild(btn);
  }

  btn.href = lineUrl;
}

function goToLineConfirm(lineUrl) {
  setTimeout(() => {
    window.location.href = lineUrl;
  }, LINE_REDIRECT_DELAY_MS);
}

async function submitBooking() {
  const submitBtn = document.querySelector(".submit-btn");

  if (!selectedPlan) {
    alert("請先選擇方案");
    return;
  }

  if (!validateBookingForm()) {
    alert("請確認必填欄位都有填寫");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "送出中...";

  const payload = {
    action: "createBooking",
    data: {
      name: getValue("name"),
      phone: getValue("phone"),
      email: getValue("email"),
      contactPreference: "",
      lineUid: "",
      houseType: selectedPlan.houseType,
      planName: selectedPlan.name,
      price: selectedPlan.price,
      projectName: getValue("projectName"),
      address: getValue("address"),
      unitFloor: getValue("unitFloor"),
      area: getValue("area"),
      contractArea: getValue("contractArea"),
      roomLayout: getValue("roomLayout"),
      terraceArea: getValue("terraceArea"),
      heightInfo: getValue("heightInfo"),
      bookingDate: getValue("bookingDate"),
      bookingTime: getValue("bookingTime"),
      invoiceCarrier: getValue("invoiceCarrier"),
      taxId: getValue("taxId"),
      companyTitle: getValue("companyTitle"),
      note: getValue("note")
    }
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.ok) {
      const bookingId = result.bookingId || result.id || "";
      const lineUrl = buildLineOaMessageUrl(bookingId, payload.data);

      submitBtn.innerText = "送出成功";

      document
        .getElementById("bookingForm")
        .classList
        .add("hidden");

      document
        .getElementById("successPage")
        .classList
        .remove("hidden");

      document
        .getElementById("successText")
        .innerText =
          `我們已收到您的預約資訊，案件編號：${bookingId}。接下來系統將開啟 LINE 官方帳號，請送出預設訊息完成預約確認，方便客服與您聯繫。`;

      ensureLineConfirmButton(lineUrl);

      document
        .getElementById("successPage")
        .scrollIntoView({
          behavior: "smooth"
        });

      goToLineConfirm(lineUrl);

    } else {
      submitBtn.disabled = false;
      submitBtn.innerText = "送出預約";
      alert("送出失敗：" + (result.message || ""));
    }

  } catch (error) {
    console.error(error);

    submitBtn.disabled = false;
    submitBtn.innerText = "送出預約";

    alert("送出失敗，請稍後再試");
  }
}
