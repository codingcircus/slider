require('webcomponentsjs/lite');
import Slider from './Slider';

window.addEventListener('WebComponentsReady', function() {
  // At this point we are guaranteed that all required polyfills have loaded,
  // all HTML imports have loaded, and all defined custom elements have upgraded
  document.registerElement('cc-slider', Slider);
});