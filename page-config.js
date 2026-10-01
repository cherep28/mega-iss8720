window.MegaPageConfig = {
  slider: {
    speed: 320,
    breakpoints: {
      0: { slidesPerView: "auto", spaceBetween: 20 },
      601: { slidesPerView: "auto", spaceBetween: 30 },
      1001: { slidesPerView: "auto", spaceBetween: 40 },
      1701: { slidesPerView: "auto", spaceBetween: 50 },
    },
  },
  roomPhotos: {
    202: [
      { src: "assets/2317-752-imgRectangle12.png", alt: "Галерея ТЦ — тестовое фото", test: true },
    ],
  },
  map: { minScale: 1, maxScale: 2, step: 0.25 },
  catalog: { mobilePageSize: 6, desktopPageSize: 10 },
};
