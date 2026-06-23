const API_URL =
"https://script.google.com/macros/s/AKfycbwYw8ElfghdrxlL0y4FyGw3xPmvvfwIbCNtk6oanObBi5Op6kkZtpSaZ3vIvgrSB2Czzg/exec";

let priceListData = [];
let selectedPlan = null;

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

async function loadData() {
  try {
    const response = await fetch(`${API_URL}?action=init`);
    const result = await response.json();

    if (!result.ok) {
      alert("讀取系統設定失敗");
      return;
    }

    priceListData = result.priceList || [];
    renderPlans(priceListData);

  } catch (error) {
    console.error(error);
    alert("API連線失敗，請確認 Apps Script 是否已重新部署");
  }
}

function startBooking() {
  document.querySelector(".plans").scrollIntoView({
    behavior: "smooth"
  });
}

function normalizePriceText(text) {
  if (!text) return "";
  return String(text)
    .replace(/起起/g, "起")
    .replace(/元起起/g, "元起");
}

function renderPlans(priceList) {
  const planCards = document.getElementById("planCards");
  if (!planCards) return;

  const uniquePlans = {};

  priceList.forEach(item => {
    const enabled =
      item["啟用"] === true ||
      item["啟用"] === "TRUE";

    if (!enabled) return;

    if (!uniquePlans[item["方案"]]) {
      uniquePlans[item["方案"]] = item;
    }
  });

  planCards.innerHTML = "";

  Object.values(uniquePlans).forEach(plan => {
    const planName = plan["方案"];
    const priceText = normalizePriceText(plan["價格文字"]);
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

        <div class="price">${priceText}</div>
      </div>
    `;

    if (isMain && !selectedPlan) {
      selectedPlan = {
        name: planName,
        price: priceText,
        houseType: plan["驗屋類型"]
      };
    }
  });

  if (selectedPlan) {
    updateSelectedBox(false);
  }
}

function getPlanSubText(planName) {
  if (planName.includes("小資")) return "22項檢驗項目";
  if (planName.includes("全方位")) return "35項檢驗項目｜主力方案";
  if (planName.includes("中古")) return "9項基本檢驗";
  if (planName.includes("社區")) return "3戶以上享優惠";

  return "驗屋服務";
}

function selectPlan(planName) {
  const plan =
    priceListData.find(item => item["方案"] === planName);

  const priceText =
    plan ? normalizePriceText(plan["價格文字"]) : "";

  selectedPlan = {
    name: planName,
    price: priceText,
    houseType: plan ? plan["驗屋類型"] : ""
  };

  document.querySelectorAll(".plan-card").forEach(card => {
    card.classList.toggle(
      "selected",
      card.dataset.plan === planName
    );
  });

  updateSelectedBox(true);
}

function updateSelectedBox(shouldScroll = false) {
  const box =
    document.getElementById("selectedPlanBox");

  const name =
    document.getElementById("selectedPlanName");

  if (!box || !name || !selectedPlan) return;

  box.classList.remove("hidden");

  name.innerText =
    `${selectedPlan.name}｜${selectedPlan.price}`;

  if (shouldScroll) {
    box.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function openBookingForm() {
  const form =
    document.getElementById("bookingForm");

  form.classList.remove("hidden");

  form.scrollIntoView({
    behavior: "smooth"
  });
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function validateBookingForm() {
  const requiredFields = [
    "name",
    "phone",
    "email",
    "projectName",
    "unitFloor",
    "area",
    "contractArea",
    "bookingDate",
    "bookingTime",
    "invoiceCarrier"
  ];

  for (const id of requiredFields) {
    if (!getValue(id)) {
      return false;
    }
  }

  return true;
}

async function submitBooking() {
  const submitBtn =
    document.querySelector(".submit-btn");

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
          `我們已收到您的預約資訊，案件編號：${result.bookingId}。專人將盡快與您聯繫確認。`;

      document
        .getElementById("successPage")
        .scrollIntoView({
          behavior: "smooth"
        });

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
