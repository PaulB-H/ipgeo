const sendScreenSize = () => {
  fetch(`/screensize/${window.innerWidth}/height/${window.innerHeight}`);
};
sendScreenSize();

const fetchAnalytics = () => {
  fetch("/analytics")
    .then((res) => {
      if (res.status !== 200) {
        return console.log(`err: ${res.status}`);
      }

      res.json().then((data) => {
        console.log(data);
      });
    })
    .catch((err) => {
      console.log("Fetch Error :-S", err);
    });
};

fetchAnalytics();
