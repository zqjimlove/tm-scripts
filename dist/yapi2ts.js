"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// ==UserScript==
// @name        YAPI 2 D.TS
// @namespace   Violentmonkey Scripts
// @match       *://yapi.golcer.cn/*
// @grant       none
// @version     1.0.0
// @author      inwoo
// @require     https://cdn.staticfile.org/axios/0.19.2/axios.min.js
// @require     https://cdn.staticfile.org/jquery/3.1.1/jquery.min.js
// @description 2020/3/30 上午9:58:14
// @updateURL    https://cdn.rawgit.com/zqjimlove/tm-scripts/master/dist/yapi2ts.js
// ==/UserScript==
(function () {
  function tsGen(typeName, reqProperties, resProperties) {
    function _propertiesGen(typeName, properties) {
      var isExport = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var rootResult = {};
      var result = '';

      for (var key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          var element = properties[key];
          var type = element.type,
              _element$items = element.items;
          _element$items = _element$items === void 0 ? {
            type: '',
            properties: []
          } : _element$items;
          var itemsType = _element$items.type,
              itemsProperties = _element$items.properties;

          switch (type) {
            case 'string':
            case 'number':
            case 'boolean':
              rootResult[key] = type;
              break;

            case 'integer':
              rootResult[key] = 'number';
              break;

            case 'array':
              if (itemsType === 'object') {
                var itemKey = key + 'Item';
                itemKey = itemKey[0].toLocaleUpperCase() + itemKey.substring(1);
                rootResult[key] = "Array<".concat(itemKey, ">");
                result += _propertiesGen(itemKey, itemsProperties);
              } else {
                rootResult[key] = 'Array<any>';
              }

              break;

            case 'object':
              result[key] = 'any';
              break;
          }
        }
      }

      result += "".concat(isExport ? 'export ' : '', "type ").concat(typeName, " = ") + JSON.stringify(rootResult, void 0, 2).replace(/"/gi, '') + ';\n\n';
      return result;
    } // return `export namespace ${typeName}Model {\n${_propertiesGen('RequestData', reqProperties, true)}${_propertiesGen('ResponseData', resProperties, true)}\n}`


    return "export namespace ".concat(typeName, "Model {\n\n") + _propertiesGen('RequestData', reqProperties, true).replace(/(.*)\n/gi, '  $1\n') + _propertiesGen('ResponseData', resProperties, true).replace(/(.*)\n/gi, '  $1\n') + '}';
  }

  function fetchInterfaceData() {
    var language = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!language) {
      console.error("\u672A\u8BBE\u7F6Elanguage");
      return;
    }

    var URL_REGEX = /project\/(\d+)\/interface\/api\/(\d+)/gi;
    var macher = URL_REGEX.exec(window.location.href);
    var urlOrigin = window.location.origin;

    if (!macher) {
      alert('请在接口详情页中使用');
      return;
    }

    var _macher = _slicedToArray(macher, 3),
        _ = _macher[0],
        projectId = _macher[1],
        intrefaceId = _macher[2];

    var namespamce = window.prompt('请输入改模型的名称');
    axios.get("".concat(urlOrigin, "/api/interface/get"), {
      params: {
        id: intrefaceId
      }
    }).then(function (_ref) {
      var _data = _ref.data;

      if (_data.errcode === 0) {
        var _data$data = _data.data,
            reqBodyStr = _data$data.req_body_other,
            resBodyStr = _data$data.res_body;
        var reqBody = JSON.parse(reqBodyStr);
        var resBody = JSON.parse(resBodyStr);
        var reqProperties = reqBody.properties,
            reqRequired = reqBody.required;
        var resProperties = resBody.properties,
            resRequired = resBody.required;
        var resPropertiesData = resProperties.data.properties;
        var code = tsGen(namespamce, reqProperties, resPropertiesData);
        var el = $('#yapi2tsTA').html(code)[0];
        el.select();
        el.setSelectionRange(0, code.length);
        document.execCommand('copy');
        alert('生成成功，已复制到粘贴版');
      }
    });
  }

  function createIconItem(item) {
    return "<a class=\"icon\" style=\"background-image:url(".concat(item.icon, ")\" data-language=\"").concat(item.key, "\"></a>");
  }

  function createUI() {
    $('head').append("\n      <style>\n        .languages_type_icons {\n          line-height: 0;\n          font-size: 0;\n          position: fixed;\n          bottom: 30px;\n          right: 30px;\n          z-index: 100;\n        }\n        .languages_type_icons .icon{\n          display: inline-block;\n          width: 26px;\n          height: 26px;\n          margin-right: 6px;\n          background-size: contain;\n        }\n      </style>\n    ");
    var languages = [{
      key: 'ts',
      icon: 'https://api.iconify.design/logos-typescript-icon.svg'
    }];
    var reqTitleCopyItemsEl = document.createElement('div');
    reqTitleCopyItemsEl.className = 'languages_type_icons';
    reqTitleCopyItemsEl.innerHTML = languages.map(function (item) {
      return createIconItem(item);
    }).join('');
    $(reqTitleCopyItemsEl).on('click', '.icon', function (e) {
      var _e$currentTarget$data;

      fetchInterfaceData((_e$currentTarget$data = e.currentTarget.dataset) === null || _e$currentTarget$data === void 0 ? void 0 : _e$currentTarget$data.language);
    });
    $(reqTitleCopyItemsEl).append("<textarea style=\"width:1px;height:1px;border:0px;margin:0px;padding:0px;opacity:0\" id=\"yapi2tsTA\"></textarea>");
    $('body').append(reqTitleCopyItemsEl);
    console.log('yapi2ts inited');
  }

  createUI();
})();