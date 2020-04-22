"use strict";

/**
 * 사진 추가 시 썸네일 표시
 */
document.getElementById("images").onchange = function () {
  var files = this.files;
  var thumbs = document.querySelector('.thumbs');
  document.querySelectorAll('.new-image').forEach(function (image) {
    return image.remove();
  }); // read the image file as a data URL.

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var file = _step.value;
      var url = URL.createObjectURL(file);
      thumbs.innerHTML += "\n            <div class=\"thumb new-image\" style=\"background:center / contain no-repeat url('".concat(url, "');\">\n            </div>\n        ");
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};