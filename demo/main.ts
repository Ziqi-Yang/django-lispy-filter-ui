// import { } from '';

export function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

(function() {
  ready(() => {
    console.log("hi");
  });
})();
