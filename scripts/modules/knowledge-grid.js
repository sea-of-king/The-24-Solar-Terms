(function () {
  window.KnowledgeGrid = {
    groupBySeason: function (terms) {
      var seasons = { "春": [], "夏": [], "秋": [], "冬": [] };
      (terms || []).forEach(function (term) {
        if (seasons[term.season]) seasons[term.season].push(term);
      });
      return Object.keys(seasons).map(function (season) {
        return { season: season, terms: seasons[season] };
      });
    }
  };
})();
