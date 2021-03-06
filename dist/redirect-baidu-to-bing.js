"use strict";

// ==UserScript==
// @name         redirect baidu.com to cn.bing.com
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  垃圾百度！！！！！
// @author       inwoo
// @match        http*://*.baidu.com/*
// @grant        none
// @run-at document-start
// ==/UserScript==
(function () {
  var searchToObject = function searchToObject() {
    var pairs = window.location.search.substring(1).split("&"),
        obj = {},
        pair,
        i;

    for (i in pairs) {
      if (pairs[i] === "") continue;
      pair = pairs[i].split("=");
      obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return obj;
  };

  var queryObj = searchToObject();
  var hostnames = location.hostname.split('.');
  var ignoreNames = ['tongji', 'baike', 'naotu', 'pan'];

  if (ignoreNames.indexOf(hostnames[0]) > -1) {
    return;
  }

  if (queryObj.w) {
    window.location.replace(location.protocol + '//cn.bing.com/search?q=' + searchToObject().wd);
  } else {
    window.location.replace(location.protocol + '//cn.bing.com/');
  }
})();