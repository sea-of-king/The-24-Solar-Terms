(function () {
  var version = "dev";

  function hasQuery(url) {
    return typeof url === "string" && url.indexOf("?") >= 0;
  }

  function appendVersion(url) {
    if (typeof url !== "string" || !url) return url;
    if (/\/$/.test(url)) return url;
    if (hasQuery(url) || !version) return url;
    return url + "?v=" + encodeURIComponent(version);
  }

  window.SiteAssetVersion = {
    value: version,
    append: appendVersion
  };
})();
