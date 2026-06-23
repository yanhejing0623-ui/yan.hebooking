const API_URL =
"https://script.google.com/macros/s/AKfycbwYw8ElfghdrxlL0y4FyGw3xPmvvfwIbCNtk6oanObBi5Op6kkZtpSaZ3vIvgrSB2Czzg/exec";

let priceListData = [];

document.addEventListener("DOMContentLoaded", () => {
  console.log("碩赫科技驗屋系統啟動");
  loadData();
});

async function loadData() {
  try {
    const response = await fetch(`${API_URL}?action=init`);
    const result = await response.json();

    console.log("系統資料：", result);

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
  const target = document.querySelector(".plans");

  if (!target) return;

  window.scrollTo({
    top: target.offsetTop - 10,
    behavior: "smooth"
  });
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
    const isMain = planName.includes("全方位");

    planCards.innerHTML += `
      <div class="plan-card ${isMain ? "main-plan" : ""}" onclick="selectPlan('${planName}')">
        <div>
          <strong>${planName}</strong>
          <span>${getPlanSubText(planName)}</span>
        </div>
        <div class="price">
          ${plan["價格文字"]}起
        </div>
      </div>
    `;
  });
}

function getPlanSubText(planName) {
  if (planName.includes("小資")) return "22項檢驗項目";
  if (planName.includes("全方位")) return "35項檢驗項目｜主力方案";
  if (planName.includes("中古")) return "9項基本檢驗";
  if (planName.includes("社區")) return "3戶以上享優惠";
  return "驗屋服務";
}

function selectPlan(planName) {
  alert(`您選擇的是：${planName}\n下一步將進入預約表單`);
}
