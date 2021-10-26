"use strict";

const sendScreenSize = () => {
  fetch(`/screensize/${window.innerWidth}/height/${window.innerHeight}`);
};
sendScreenSize();

const fetchAnalytics = () => {
  const analyticDataContainer = document.getElementById("analytic-data");
  const previousDataList = document.getElementById("previous-data-list");
  const myDataContainer = document.getElementById("my-data");

  fetch("/todaysanalytics")
    .then((res) => {
      if (res.status !== 200) {
        return console.log(`err: ${res.status}`);
      }

      res.json().then((data) => {
        let dataDate = new Date(data.date);

        analyticDataContainer.innerHTML = `
          <h3>Analytic data for: <br />${dataDate.toLocaleDateString()} <span style="white-space: nowrap">(Y-M-D)<span></h3>
          <hr />
          <h4>Unique visitors: ${data.uniqueVisitors}</h4>
          <hr />
          <h4>Countries:</h4>
        `;

        data.countries.forEach((item) => {
          analyticDataContainer.insertAdjacentHTML(
            "beforeend",
            `
            <h4>${item.country} / ${item.uniqueHits}</h4>
          `
          );
        });

        analyticDataContainer.insertAdjacentHTML(
          "beforeend",
          `
            <hr />
            <h4>Total Sessions: ${data.totalSessions}</h4>
          `
        );
      });
    })
    .catch((err) => {
      console.log("Fetch Error :-S", err);
    });

  fetch("/previousdates").then((res) => {
    if (res.status !== 200) {
      return console.log(`err: ${res.status}`);
    }
    res.json().then((data) => {
      if (data.length >= 1) {
        data.forEach((item) => {
          previousDataList.insertAdjacentHTML(
            "beforeend",
            `
              <div id="${item}" onclick="fetchPreviousAnalytics('${item}')" class="previous-data-item card">${item}</div>
            `
          );
        });
      } else {
        document.getElementById("previous-data").firstElementChild.innerHTML =
          "No previous data found";
      }
    });
  });

  fetch("/useragent").then((res) => {
    if (res.status !== 200) {
      return console.log(`err: ${res.status}`);
    }
    res.json().then((data) => {
      data.forEach((item) => {
        myDataContainer.insertAdjacentHTML(
          "beforeend",
          `
            <p>${item}</p>
          `
        );
      });
    });
  });
};

fetchAnalytics();
