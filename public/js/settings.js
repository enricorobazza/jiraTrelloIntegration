/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var linkSelector = document.getElementById('link');
var projectSelector = document.getElementById('project');

t.render(function () {
  return Promise.all([
    t.get('board', 'shared', 'link'),
    t.get('board', 'shared', 'project'),
  ])
    .spread(function (savedLink, savedProject) {
      linkSelector.value = savedLink;
      projectSelector.value = savedProject;
    })
    .then(function () {
      t.sizeTo('#content').done();
    });
});

document.getElementById('save').addEventListener('click', async function () {
  return t.set('board', 'shared', 'link', linkSelector.value).then(function () {
    return t
      .set('board', 'shared', 'project', projectSelector.value)
      .then(function () {
        function openInNewTab(url) {
          var win = window.open(url, '_blank');
          win.focus();
        }

        openInNewTab(
          `https://https://jiratrellointegration.herokuapp.com/authenticate?link=${encodeURIComponent(
            linkSelector.value
          )}`
        );

        t.closePopup();
      });
  });
});
