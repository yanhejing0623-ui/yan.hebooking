const API_URL =
"https://script.google.com/macros/s/AKfycbz3kINKKAMsA1BKuAY8eAPTt-ItJMlGvV5vt8fXh5T-krulq8A-CcJzhUMvYnmqdz_BEA/exec";

document.addEventListener("DOMContentLoaded", () => {

  console.log("碩赫科技驗屋系統啟動");

  loadData();

});

async function loadData() {

  try {

    const response = await fetch(
      `${API_URL}?action=init`
    );

    const result =
      await response.json();

    console.log("系統資料：", result);

    if (!result.ok) {
      alert("讀取系統設定失敗");
      return;
    }

    renderSettings(result.settings);
    renderPlans(result.priceList);

  } catch (error) {

    console.error(error);

    alert("API連線失敗");

  }

}

function renderSettings(settings) {

  console.log("Settings", settings);

}

function renderPlans(priceList) {

  const planCards =
    document.getElementById("planCards");

  if (!planCards) return;

  const uniquePlans = {};

  priceList.forEach(item => {

    if (!uniquePlans[item["方案"]]) {

      uniquePlans[item["方案"]] = item;

    }

  });

  planCards.innerHTML = "";

  Object.values(uniquePlans).forEach(plan => {

    planCards.innerHTML += `

      <div class="plan-card">

        <div>

          <strong>${plan["方案"]}</strong>

          <span>
            ${plan["驗屋類型"]}
          </span>

        </div>

        <div class="price">

          ${plan["價格文字"]}

        </div>

      </div>

    `;

  });

}
