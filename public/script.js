const sendScreenSize = () => {
  axios.get(`/screensize/${window.innerWidth}/height/${window.innerHeight}`);
};
sendScreenSize();
